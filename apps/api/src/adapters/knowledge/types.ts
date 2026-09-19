/**
 * Knowledge Store Interface and Types.
 *
 * Defines the contract for all knowledge adapters:
 * - cognee-mock (in-memory graph + keyword)
 * - local-bm25 (MiniSearch BM25)
 * - cognee-live (Cognee Cloud REST API)
 *
 * Enforces per-user data isolation by construction:
 * Datasets for user context must be scoped by userId.
 */

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  domain: string;
  source: string;
  provider: string;
  version: string;
  effectiveDate: string;
  synthetic: boolean;
  conflictsWith?: string;
  metadata?: Record<string, unknown>;
}

export interface SearchOptions {
  datasets?: string[];
  topK?: number;
  mode?: 'graph_completion' | 'rag' | 'bm25' | string;
  filters?: {
    domain?: string;
    product?: string;
    effectiveDateMin?: string;
  };
  /** Mandatory scope for user-specific datasets */
  scope?: {
    userId?: string;
  };
}

export interface SearchHit {
  id: string;
  title: string;
  content: string;
  domain: string;
  source: string;
  provider: string;
  version: string;
  effectiveDate: string;
  score: number;
  conflictsWith?: string;
  metadata?: Record<string, unknown>;
}

export interface KnowledgeConflict {
  sourceA: string;
  versionA: string;
  sourceB: string;
  versionB: string;
  description: string;
}

export interface SearchResult {
  hits: SearchHit[];
  total: number;
  adapterMode: 'mock' | 'local-bm25' | 'cognee-live' | 'local-fallback';
  latencyMs: number;
  conflicts?: KnowledgeConflict[];
}

export interface KnowledgeStore {
  add(
    dataset: string,
    docs: KnowledgeDocument[],
    options?: { scope?: { userId?: string } }
  ): Promise<void>;

  cognify(
    dataset: string,
    options?: { scope?: { userId?: string } }
  ): Promise<void>;

  search(
    query: string,
    options?: SearchOptions
  ): Promise<SearchResult>;

  health(): Promise<{
    status: 'ok' | 'degraded' | 'down';
    mode: string;
    latencyMs: number;
  }>;
}
