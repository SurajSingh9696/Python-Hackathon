/**
 * Local BM25 Knowledge Store using MiniSearch.
 *
 * Fast in-memory full-text search with BM25 ranking,
 * metadata filtering, recency-preference weighting,
 * and policy conflict detection.
 */
import MiniSearch from 'minisearch';
import type {
  KnowledgeStore,
  KnowledgeDocument,
  SearchOptions,
  SearchResult,
  SearchHit,
  KnowledgeConflict,
} from './types.js';

interface IndexedDoc {
  id: string;
  title: string;
  content: string;
  domain: string;
  source: string;
  provider: string;
  version: string;
  effectiveDate: string;
  conflictsWith?: string;
  rawDoc: KnowledgeDocument;
}

export class LocalBm25Store implements KnowledgeStore {
  // Map of datasetName -> MiniSearch instance
  private indexes = new Map<string, MiniSearch<IndexedDoc>>();
  // Map of datasetName -> docId -> IndexedDoc
  private docs = new Map<string, Map<string, IndexedDoc>>();

  private getIndexName(dataset: string, userId?: string): string {
    if (dataset === 'journey_context') {
      if (!userId) {
        throw new Error('Security Error: scope.userId is mandatory when accessing journey_context dataset');
      }
      return `journey_context_${userId}`;
    }
    return dataset;
  }

  private getOrCreateIndex(datasetKey: string): MiniSearch<IndexedDoc> {
    let index = this.indexes.get(datasetKey);
    if (!index) {
      index = new MiniSearch<IndexedDoc>({
        fields: ['title', 'content', 'source'],
        storeFields: ['id', 'title', 'domain', 'source', 'provider', 'version', 'effectiveDate', 'conflictsWith'],
        searchOptions: {
          boost: { title: 2.5, source: 1.5 },
          prefix: true,
          fuzzy: 0.2,
        },
      });
      this.indexes.set(datasetKey, index);
      this.docs.set(datasetKey, new Map());
    }
    return index;
  }

  async add(
    dataset: string,
    docs: KnowledgeDocument[],
    options?: { scope?: { userId?: string } }
  ): Promise<void> {
    const datasetKey = this.getIndexName(dataset, options?.scope?.userId);
    const index = this.getOrCreateIndex(datasetKey);
    const docMap = this.docs.get(datasetKey)!;

    for (const doc of docs) {
      const indexed: IndexedDoc = {
        id: doc.id,
        title: doc.title,
        content: doc.content,
        domain: doc.domain,
        source: doc.source,
        provider: doc.provider,
        version: doc.version,
        effectiveDate: doc.effectiveDate,
        ...(doc.conflictsWith !== undefined ? { conflictsWith: doc.conflictsWith } : {}),
        rawDoc: doc,
      };

      if (docMap.has(doc.id)) {
        index.discard(indexed);
      }
      index.add(indexed);
      docMap.set(doc.id, indexed);
    }
  }

  async cognify(_dataset: string, _options?: { scope?: { userId?: string } }): Promise<void> {
    // Local BM25 is index-on-add; cognify is a no-op that resolves immediately
    return Promise.resolve();
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult> {
    const startTime = Date.now();
    const datasets = options.datasets ?? ['financial_products', 'insurance_knowledge', 'demo_faq'];
    const topK = options.topK ?? 6;
    const allHits: SearchHit[] = [];

    for (const dataset of datasets) {
      // User isolation security check
      if (dataset === 'journey_context' && !options.scope?.userId) {
        continue; // Never search unnamespaced user context
      }

      const datasetKey = this.getIndexName(dataset, options.scope?.userId);
      const index = this.indexes.get(datasetKey);
      const docMap = this.docs.get(datasetKey);
      if (!index || !docMap) continue;

      const rawResults = index.search(query, {
        filter: (doc) => {
          if (options.filters?.domain && doc.domain !== options.filters.domain) {
            return false;
          }
          if (options.filters?.effectiveDateMin) {
            if (doc.effectiveDate < options.filters.effectiveDateMin) return false;
          }
          return true;
        },
      });

      for (const res of rawResults) {
        const fullDoc = docMap.get(res.id);
        if (!fullDoc) continue;

        // Recency weighting bonus: Newer documents get an extra boost
        const docYear = parseInt(fullDoc.effectiveDate.slice(0, 4), 10) || 2024;
        const recencyBonus = (docYear - 2024) * 0.15; // 2026 gets +0.3 boost

        allHits.push({
          id: fullDoc.id,
          title: fullDoc.title,
          content: fullDoc.content,
          domain: fullDoc.domain,
          source: fullDoc.source,
          provider: fullDoc.provider,
          version: fullDoc.version,
          effectiveDate: fullDoc.effectiveDate,
          score: res.score + recencyBonus,
          ...(fullDoc.conflictsWith !== undefined ? { conflictsWith: fullDoc.conflictsWith } : {}),
          ...(fullDoc.rawDoc.metadata !== undefined ? { metadata: fullDoc.rawDoc.metadata } : {}),
        });
      }
    }

    // Sort by final score descending (recency + relevance)
    allHits.sort((a, b) => b.score - a.score);
    const finalHits = allHits.slice(0, topK);

    // Conflict detection across returned hits
    const conflicts: KnowledgeConflict[] = [];
    const hitIds = new Set(finalHits.map((h) => h.id));

    for (const hit of finalHits) {
      if (hit.conflictsWith && hitIds.has(hit.conflictsWith)) {
        const opposing = finalHits.find((h) => h.id === hit.conflictsWith);
        if (opposing) {
          conflicts.push({
            sourceA: hit.source,
            versionA: hit.version,
            sourceB: opposing.source,
            versionB: opposing.version,
            description: `Contradictory policy between "${hit.title}" and "${opposing.title}"`,
          });
        }
      }
    }

    return {
      hits: finalHits,
      total: allHits.length,
      adapterMode: 'local-bm25',
      latencyMs: Date.now() - startTime,
      ...(conflicts.length > 0 ? { conflicts } : {}),
    };
  }

  async health(): Promise<{ status: 'ok'; mode: string; latencyMs: number }> {
    const t0 = Date.now();
    return {
      status: 'ok',
      mode: 'local-bm25',
      latencyMs: Date.now() - t0,
    };
  }
}
