/**
 * Live Cognee Cloud Adapter.
 *
 * Connects to Cognee Cloud REST API (https://api.cognee.ai/api/v1):
 * - POST /api/v1/add (multipart/form-data)
 * - POST /api/v1/cognify (application/json)
 * - POST /api/v1/search (application/json)
 *
 * Implements strict request timeouts and per-user namespacing.
 */
import type {
  KnowledgeStore,
  KnowledgeDocument,
  SearchOptions,
  SearchResult,
  SearchHit,
} from './types.js';

export interface CogneeLiveConfig {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
  searchMode?: string;
}

export class CogneeLiveStore implements KnowledgeStore {
  private apiKey: string;
  private baseUrl: string;
  private timeoutMs: number;
  private searchMode: string;

  constructor(config: CogneeLiveConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? 'https://api.cognee.ai').replace(/\/+$/, '');
    // Ensure base URL includes /api/v1
    if (!this.baseUrl.endsWith('/api/v1')) {
      this.baseUrl += '/api/v1';
    }
    this.timeoutMs = config.timeoutMs ?? 1500;
    this.searchMode = config.searchMode ?? 'GRAPH_COMPLETION';
  }

  private getDatasetName(dataset: string, userId?: string): string {
    if (dataset === 'journey_context') {
      if (!userId) {
        throw new Error('Security Error: scope.userId is required when accessing journey_context in Cognee');
      }
      return `journey_context_${userId}`;
    }
    return dataset;
  }

  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          ...options.headers,
        },
      });
      return res;
    } finally {
      clearTimeout(timer);
    }
  }

  async add(
    dataset: string,
    docs: KnowledgeDocument[],
    options?: { scope?: { userId?: string } }
  ): Promise<void> {
    const datasetName = this.getDatasetName(dataset, options?.scope?.userId);

    for (const doc of docs) {
      const formData = new FormData();
      const contentBlob = new Blob([doc.content], { type: 'text/markdown' });
      formData.append('data', contentBlob, `${doc.id}.md`);
      formData.append('datasetName', datasetName);
      formData.append(
        'external_metadata',
        JSON.stringify({
          id: doc.id,
          title: doc.title,
          domain: doc.domain,
          source: doc.source,
          version: doc.version,
          effectiveDate: doc.effectiveDate,
        })
      );

      const res = await this.fetchWithTimeout(`${this.baseUrl}/add`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Cognee add failed [${res.status}]: ${errText}`);
      }
    }
  }

  async cognify(dataset: string, options?: { scope?: { userId?: string } }): Promise<void> {
    const datasetName = this.getDatasetName(dataset, options?.scope?.userId);

    const res = await this.fetchWithTimeout(`${this.baseUrl}/cognify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ datasets: [datasetName] }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Cognee cognify failed [${res.status}]: ${errText}`);
    }
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult> {
    const startTime = Date.now();
    const datasets = (options.datasets ?? ['financial_products', 'insurance_knowledge']).map((d) =>
      this.getDatasetName(d, options.scope?.userId)
    );

    const payload = {
      query,
      datasets,
      searchType: options.mode ?? this.searchMode,
      top_k: options.topK ?? 6,
    };

    const res = await this.fetchWithTimeout(`${this.baseUrl}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Cognee search failed [${res.status}]: ${errText}`);
    }

    const data = (await res.json()) as {
      results?: Array<{
        id?: string;
        text?: string;
        content?: string;
        metadata?: Record<string, unknown>;
        score?: number;
      }>;
    };

    const rawResults = data.results ?? [];
    const hits: SearchHit[] = rawResults.map((item, idx) => ({
      id: (item.id ?? item.metadata?.['id'] ?? `hit-${idx}`) as string,
      title: (item.metadata?.['title'] ?? 'Document') as string,
      content: item.content ?? item.text ?? '',
      domain: (item.metadata?.['domain'] ?? 'general') as string,
      source: (item.metadata?.['source'] ?? 'Cognee Knowledge Graph') as string,
      provider: (item.metadata?.['provider'] ?? 'Demo Provider') as string,
      version: (item.metadata?.['version'] ?? '1.0') as string,
      effectiveDate: (item.metadata?.['effectiveDate'] ?? '2026-01-01') as string,
      score: item.score ?? 1.0,
      ...(item.metadata !== undefined ? { metadata: item.metadata } : {}),
    }));

    return {
      hits,
      total: hits.length,
      adapterMode: 'cognee-live',
      latencyMs: Date.now() - startTime,
    };
  }

  async health(): Promise<{ status: 'ok' | 'degraded' | 'down'; mode: string; latencyMs: number }> {
    const t0 = Date.now();
    try {
      const res = await this.fetchWithTimeout(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'healthcheck', datasets: ['healthcheck'], top_k: 1 }),
      });
      return {
        status: res.ok ? 'ok' : 'degraded',
        mode: 'cognee-live',
        latencyMs: Date.now() - t0,
      };
    } catch {
      return {
        status: 'down',
        mode: 'cognee-live',
        latencyMs: Date.now() - t0,
      };
    }
  }
}
