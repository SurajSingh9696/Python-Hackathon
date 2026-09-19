/**
 * Mock Cognee Store.
 *
 * Simulates Cognee Cloud graph-completion search and semantic indexing
 * with in-memory knowledge graph representation and strict user isolation.
 */
import type {
  KnowledgeStore,
  KnowledgeDocument,
  SearchOptions,
  SearchResult,
  SearchHit,
  KnowledgeConflict,
} from './types.js';

interface GraphNode {
  id: string;
  label: string;
  type: string;
  properties: Record<string, unknown>;
}

interface GraphEdge {
  from: string;
  to: string;
  relation: string;
}

export class CogneeMockStore implements KnowledgeStore {
  private documents = new Map<string, KnowledgeDocument[]>();
  private nodes: GraphNode[] = [];
  private edges: GraphEdge[] = [];

  private getDatasetKey(dataset: string, userId?: string): string {
    if (dataset === 'journey_context') {
      if (!userId) {
        throw new Error('Security Error: scope.userId is required when accessing journey_context in Cognee');
      }
      return `journey_context_${userId}`;
    }
    return dataset;
  }

  async add(
    dataset: string,
    docs: KnowledgeDocument[],
    options?: { scope?: { userId?: string } }
  ): Promise<void> {
    const key = this.getDatasetKey(dataset, options?.scope?.userId);
    const existing = this.documents.get(key) ?? [];
    this.documents.set(key, [...existing, ...docs]);

    // Build mock graph nodes
    for (const doc of docs) {
      this.nodes.push({
        id: doc.id,
        label: doc.title,
        type: doc.domain,
        properties: { ...doc.metadata, version: doc.version, source: doc.source },
      });
    }
  }

  async cognify(dataset: string, options?: { scope?: { userId?: string } }): Promise<void> {
    const key = this.getDatasetKey(dataset, options?.scope?.userId);
    const docs = this.documents.get(key) ?? [];

    // Synthesize semantic relations
    for (let i = 0; i < docs.length - 1; i++) {
      const docA = docs[i]!;
      const docB = docs[i + 1]!;
      if (docA.domain === docB.domain) {
        this.edges.push({
          from: docA.id,
          to: docB.id,
          relation: 'RELATES_TO',
        });
      }
    }
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult> {
    const startTime = Date.now();
    const datasets = options.datasets ?? ['financial_products', 'insurance_knowledge'];
    const topK = options.topK ?? 6;
    const lowerQuery = query.toLowerCase();
    const terms = lowerQuery.split(/\s+/).filter((t) => t.length > 2);

    const hits: SearchHit[] = [];

    for (const dataset of datasets) {
      if (dataset === 'journey_context' && !options.scope?.userId) {
        continue;
      }
      const key = this.getDatasetKey(dataset, options.scope?.userId);
      const docs = this.documents.get(key) ?? [];

      for (const doc of docs) {
        if (options.filters?.domain && doc.domain !== options.filters.domain) {
          continue;
        }

        let score = 0;
        const text = `${doc.title} ${doc.content} ${doc.source}`.toLowerCase();
        for (const term of terms) {
          if (text.includes(term)) score += 1.0;
        }

        if (score > 0) {
          // Recency bias
          const year = parseInt(doc.effectiveDate.slice(0, 4), 10) || 2024;
          const recencyBoost = (year - 2024) * 0.2;

          hits.push({
            id: doc.id,
            title: doc.title,
            content: doc.content,
            domain: doc.domain,
            source: doc.source,
            provider: doc.provider,
            version: doc.version,
            effectiveDate: doc.effectiveDate,
            score: score + recencyBoost,
            ...(doc.conflictsWith !== undefined ? { conflictsWith: doc.conflictsWith } : {}),
            ...(doc.metadata !== undefined ? { metadata: doc.metadata } : {}),
          });
        }
      }
    }

    hits.sort((a, b) => b.score - a.score);
    const finalHits = hits.slice(0, topK);

    // Conflict detection
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
            description: `Contradictory policy detected between "${hit.title}" and "${opposing.title}"`,
          });
        }
      }
    }

    return {
      hits: finalHits,
      total: hits.length,
      adapterMode: 'mock',
      latencyMs: Date.now() - startTime,
      ...(conflicts.length > 0 ? { conflicts } : {}),
    };
  }

  async health(): Promise<{ status: 'ok'; mode: string; latencyMs: number }> {
    return {
      status: 'ok',
      mode: 'mock',
      latencyMs: 5,
    };
  }
}
