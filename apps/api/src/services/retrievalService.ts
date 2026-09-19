/**
 * Knowledge Retrieval Service.
 *
 * Implements:
 * - Multi-dataset retrieval with metadata filtering
 * - Recency preference weighting (latest effective_date prioritized)
 * - Conflict detection across sources (flags contradiction, triggers escalation recommendation)
 * - Trace generation for the 3D KnowledgeTrace drawer
 * - Asynchronous per-user journey-context synchronization with strict isolation
 * - Input/output sanitization against prompt injection
 */
import {
  getKnowledgeStore,
  type SearchHit,
  type SearchResult,
  type KnowledgeConflict,
} from '../adapters/knowledge/index.js';
import type { JourneyDomain } from '@sahaj/shared';

export interface RetrievalQueryOptions {
  query: string;
  domain?: JourneyDomain;
  userId: string;
  topK?: number;
  product?: string;
  includeUserContext?: boolean;
}

export interface RetrievalResult {
  hits: SearchHit[];
  sources: Array<{
    id: string;
    source: string;
    provider: string;
    version: string;
    effectiveDate: string;
    excerpt: string;
  }>;
  conflicts: KnowledgeConflict[];
  trace: {
    nodes: Array<{ id: string; label: string; type: 'user' | 'goal' | 'product' | 'term' | 'document'; retrieved: boolean }>;
    edges: Array<{ from: string; to: string }>;
    topK: number;
    retrievalMs: number;
    adapterMode: 'cognee-live' | 'cognee-cached' | 'local-fallback' | 'mock';
    sources: string[];
  };
}

/** Known prompt injection markers that must be stripped from retrieved knowledge */
const INJECTION_PATTERNS = [
  /system\s*override/gi,
  /ignore\s*all\s*previous\s*instructions/gi,
  /ignore\s*previous\s*instructions/gi,
  /guarantee\s*100%\s*approval/gi,
  /disburse\s*now/gi,
];

function sanitizeChunk(content: string): string {
  let clean = content;
  for (const pattern of INJECTION_PATTERNS) {
    clean = clean.replace(pattern, '[REDACTED_SECURITY_POLICY]');
  }
  return clean;
}

export class RetrievalService {
  async retrieve(options: RetrievalQueryOptions): Promise<RetrievalResult> {
    const store = getKnowledgeStore();
    const datasets: string[] = ['financial_products', 'demo_faq'];

    if (options.domain === 'insurance') {
      datasets.push('insurance_knowledge');
    }

    if (options.includeUserContext) {
      datasets.push('journey_context');
    }

    const searchRes: SearchResult = await store.search(options.query, {
      datasets,
      topK: options.topK ?? 6,
      filters: {
        ...(options.domain !== undefined ? { domain: options.domain } : {}),
        ...(options.product !== undefined ? { product: options.product } : {}),
      },
      scope: {
        userId: options.userId,
      },
    });

    // Sanitize any malicious chunks
    const sanitizedHits = searchRes.hits.map((hit) => ({
      ...hit,
      content: sanitizeChunk(hit.content),
    }));

    // Build structured source citations
    const sources = sanitizedHits.map((h) => ({
      id: h.id,
      source: h.source,
      provider: h.provider,
      version: h.version,
      effectiveDate: h.effectiveDate,
      excerpt: h.content.slice(0, 160).replace(/\n+/g, ' ').trim() + '...',
    }));

    // Build trace nodes & edges for Behind the Scenes drawer
    const nodes: Array<{ id: string; label: string; type: 'user' | 'goal' | 'product' | 'term' | 'document'; retrieved: boolean }> = [
      { id: 'node-user', label: 'User Context', type: 'user', retrieved: true },
      { id: 'node-query', label: `Query: "${options.query.slice(0, 24)}..."`, type: 'goal', retrieved: true },
    ];

    const edges: Array<{ from: string; to: string }> = [
      { from: 'node-user', to: 'node-query' },
    ];

    for (const hit of sanitizedHits) {
      const nodeId = `doc-${hit.id}`;
      nodes.push({
        id: nodeId,
        label: `${hit.title} (${hit.version})`,
        type: 'product',
        retrieved: true,
      });
      edges.push({ from: 'node-query', to: nodeId });
    }

    // Add conflict nodes if any detected
    const conflicts = searchRes.conflicts ?? [];
    if (conflicts.length > 0) {
      nodes.push({
        id: 'node-conflict',
        label: 'Policy Conflict Detected',
        type: 'term',
        retrieved: true,
      });
      edges.push({ from: 'node-query', to: 'node-conflict' });
    }

    const adapterMode: 'cognee-live' | 'cognee-cached' | 'local-fallback' | 'mock' =
      searchRes.adapterMode === 'local-bm25'
        ? 'local-fallback'
        : searchRes.adapterMode;

    return {
      hits: sanitizedHits,
      sources,
      conflicts,
      trace: {
        nodes,
        edges,
        topK: options.topK ?? 6,
        retrievalMs: searchRes.latencyMs,
        adapterMode,
        sources: Array.from(new Set(sanitizedHits.map((h) => `${h.source} (v${h.version})`))),
      },
    };
  }

  /**
   * Asynchronously writes journey-context summaries into the user's isolated dataset.
   * Stores derived summaries only (goal, state, non-sensitive facts), NEVER raw user docs.
   */
  async syncUserJourneyContext(
    userId: string,
    journeyId: string,
    contextSummary: {
      goal?: string;
      domain: string;
      state: string;
      derivedFacts: Record<string, unknown>;
    }
  ): Promise<void> {
    try {
      const store = getKnowledgeStore();
      const doc = {
        id: `journey-${journeyId}`,
        title: `Journey Context for ${journeyId}`,
        content: `User Goal: ${contextSummary.goal ?? 'Financial Journey'}\nDomain: ${contextSummary.domain}\nState: ${contextSummary.state}\nFacts: ${JSON.stringify(contextSummary.derivedFacts)}`,
        domain: contextSummary.domain,
        source: 'User Journey Context',
        provider: 'Sahaj Journey Engine',
        version: '1.0',
        effectiveDate: new Date().toISOString().slice(0, 10),
        synthetic: true,
      };

      // Physical namespacing by userId
      await store.add('journey_context', [doc], {
        scope: { userId },
      });
    } catch {
      // Async background sync failure is non-blocking
    }
  }
}

export const retrievalService = new RetrievalService();
