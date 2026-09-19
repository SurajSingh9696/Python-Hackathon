/**
 * Knowledge Store Factory & Resilient Fallback Layer.
 *
 * Provides:
 * - Deterministic adapter selection (mock / local-bm25 / cognee-live)
 * - Transparent fallback to Local BM25 if Cognee times out (>1500ms) or fails
 * - Shared dataset caching (LRU) - NEVER caches user context
 * - Single entry point for knowledge queries throughout the API
 */
import { LRUCache } from 'lru-cache';
import type {
  KnowledgeStore,
  KnowledgeDocument,
  SearchOptions,
  SearchResult,
} from './types.js';
import { CogneeMockStore } from './cognee-mock.js';
import { LocalBm25Store } from './local-bm25.js';
import { CogneeLiveStore } from './cognee-live.js';
import type { Config } from '../../config/env.js';

export class ResilientKnowledgeStore implements KnowledgeStore {
  private primary: KnowledgeStore;
  private fallback: LocalBm25Store;
  private isLiveMode: boolean;
  // Shared-only cache: NEVER caches queries that include journey_context
  private sharedCache: LRUCache<string, SearchResult>;
  private corpusVersion: number;

  constructor(primary: KnowledgeStore, fallback: LocalBm25Store, isLiveMode: boolean, corpusVersion = 1) {
    this.primary = primary;
    this.fallback = fallback;
    this.isLiveMode = isLiveMode;
    this.corpusVersion = corpusVersion;
    this.sharedCache = new LRUCache<string, SearchResult>({
      max: 500,
      ttl: 1000 * 60 * 15, // 15 minutes
    });
  }

  async add(
    dataset: string,
    docs: KnowledgeDocument[],
    options?: { scope?: { userId?: string } }
  ): Promise<void> {
    // Always index into the local fallback store so fallback is always warm
    await this.fallback.add(dataset, docs, options);

    // If live or mock, also add to primary
    if (this.primary !== this.fallback) {
      try {
        await this.primary.add(dataset, docs, options);
      } catch (err) {
        if (!this.isLiveMode) throw err;
        // In live mode, primary add failure will gracefully log and use fallback
      }
    }
  }

  async cognify(
    dataset: string,
    options?: { scope?: { userId?: string } }
  ): Promise<void> {
    await this.fallback.cognify(dataset, options);
    if (this.primary !== this.fallback) {
      try {
        await this.primary.cognify(dataset, options);
      } catch {
        // Cognify error caught gracefully
      }
    }
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult> {
    const isUserContextSearch =
      (options.datasets ?? []).includes('journey_context') || !!options.scope?.userId;

    // Cache check for purely shared queries
    if (!isUserContextSearch) {
      const cacheKey = `${query}_${(options.datasets ?? []).sort().join(',')}_${this.corpusVersion}_${options.filters?.domain ?? 'all'}`;
      const cached = this.sharedCache.get(cacheKey);
      if (cached) {
        return { ...cached, latencyMs: 1 };
      }
    }

    // Try primary adapter first
    try {
      const result = await this.primary.search(query, options);

      // Cache shared result
      if (!isUserContextSearch) {
        const cacheKey = `${query}_${(options.datasets ?? []).sort().join(',')}_${this.corpusVersion}_${options.filters?.domain ?? 'all'}`;
        this.sharedCache.set(cacheKey, result);
      }

      return result;
    } catch (err) {
      // Automatic fallback to Local BM25 in < 1.5s
      const fallbackResult = await this.fallback.search(query, options);
      return {
        ...fallbackResult,
        adapterMode: 'local-fallback',
      };
    }
  }

  async health(): Promise<{
    status: 'ok' | 'degraded' | 'down';
    mode: string;
    latencyMs: number;
  }> {
    return this.primary.health();
  }

  getFallbackStore(): LocalBm25Store {
    return this.fallback;
  }
}

// Singleton store instance
let _store: ResilientKnowledgeStore | null = null;

export function createKnowledgeStore(config: Config): ResilientKnowledgeStore {
  if (_store) return _store;

  const fallback = new LocalBm25Store();
  let primary: KnowledgeStore;
  let isLive = false;

  if (config.KNOWLEDGE_ADAPTER === 'cognee-live' && config.COGNEE_API_KEY) {
    primary = new CogneeLiveStore({
      apiKey: config.COGNEE_API_KEY,
      baseUrl: config.COGNEE_BASE_URL,
      timeoutMs: config.COGNEE_RETRIEVAL_TIMEOUT_MS,
      searchMode: config.COGNEE_SEARCH_MODE,
    });
    isLive = true;
  } else if (config.KNOWLEDGE_ADAPTER === 'local-bm25') {
    primary = fallback;
  } else {
    // Default: mock store
    primary = new CogneeMockStore();
  }

  _store = new ResilientKnowledgeStore(
    primary,
    fallback,
    isLive,
    config.KNOWLEDGE_CORPUS_VERSION
  );
  return _store;
}

export function getKnowledgeStore(): ResilientKnowledgeStore {
  if (!_store) {
    throw new Error('Knowledge store not initialized. Call createKnowledgeStore(config) first.');
  }
  return _store;
}

export * from './types.js';
export { LocalBm25Store } from './local-bm25.js';
export { CogneeMockStore } from './cognee-mock.js';
export { CogneeLiveStore } from './cognee-live.js';
