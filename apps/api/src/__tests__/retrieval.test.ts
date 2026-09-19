import { describe, it, expect, beforeAll } from 'vitest';
import {
  createKnowledgeStore,
  LocalBm25Store,
  ResilientKnowledgeStore,
  type KnowledgeStore,
  type KnowledgeDocument,
  type SearchOptions,
  type SearchResult,
} from '../adapters/knowledge/index.js';
import { getConfig } from '../config/env.js';
import { seedKnowledge } from '../scripts/seed-knowledge.js';
import { RetrievalService } from '../services/retrievalService.js';

describe('Knowledge Retrieval Engine & Resilience Tests', () => {
  let store: KnowledgeStore;
  let service: RetrievalService;

  beforeAll(async () => {
    // Seed corpus into knowledge store
    await seedKnowledge();
    const config = getConfig();
    store = createKnowledgeStore(config);
    service = new RetrievalService();
  });

  it('prefers newer document versions over outdated versions (Recency Preference)', async () => {
    const res = await store.search('Scholar Prime Education Loan', {
      datasets: ['financial_products'],
      topK: 5,
    });

    expect(res.hits.length).toBeGreaterThan(0);
    const topHit = res.hits[0]!;

    // Top hit must be the 2026 version (v2.4), NOT the outdated 2024 version (v1.0)
    expect(topHit.version).toBe('2.4');
    expect(topHit.effectiveDate).toContain('2026');

    // Outdated version (v1.0), if present, must rank lower
    const v1Index = res.hits.findIndex((h) => h.version === '1.0');
    if (v1Index !== -1) {
      expect(v1Index).toBeGreaterThan(0);
    }
  });

  it('detects and flags contradictory policies (Conflict Detection)', async () => {
    const res = await store.search('Lending Underwriting FOIR eligibility rules circular', {
      datasets: ['financial_products', 'demo_faq'],
      topK: 6,
    });

    // Both the standard policy and the conflicting circular should be retrieved
    const hasStandard = res.hits.some((h) => h.id === 'policy-lending-eligibility');
    const hasConflict = res.hits.some((h) => h.id === 'test-conflicting-eligibility');

    expect(hasStandard).toBe(true);
    expect(hasConflict).toBe(true);

    // Conflict array must be populated with both sources
    expect(res.conflicts).toBeDefined();
    expect(res.conflicts!.length).toBeGreaterThan(0);
    const conflict = res.conflicts![0]!;
    expect(conflict.description).toContain('Contradictory policy');
  });

  it('falls back transparently to Local BM25 in < 1.5s with UI-visible flag when primary store fails', async () => {
    const fallbackStore = new LocalBm25Store();
    // Seed the fallback store
    await fallbackStore.add('financial_products', [
      {
        id: 'fallback-edu',
        title: 'Emergency Fallback Education Loan',
        content: 'Available even if cloud services are offline',
        domain: 'lending',
        source: 'Offline Fallback Catalog',
        provider: 'Demo Provider',
        version: '1.0',
        effectiveDate: '2026-01-01',
        synthetic: true,
      },
    ]);

    // Create a mock primary that always fails or times out
    const failingPrimary: KnowledgeStore = {
      add: async () => {},
      cognify: async () => {},
      search: async (_query: string, _options?: SearchOptions): Promise<SearchResult> => {
        // Simulate network failure or timeout > 1500ms
        throw new Error('Cognee Cloud API Gateway Timeout 504');
      },
      health: async () => ({ status: 'down', mode: 'failing-primary', latencyMs: 1500 }),
    };

    const resilientStore = new ResilientKnowledgeStore(failingPrimary, fallbackStore, true, 1);

    const t0 = Date.now();
    const result = await resilientStore.search('Emergency Fallback Education Loan', {
      datasets: ['financial_products'],
    });
    const elapsed = Date.now() - t0;

    // Quality Gate: Fallback MUST complete in < 1.5 s
    expect(elapsed).toBeLessThan(1500);

    // Quality Gate: Must return hits and flag adapterMode as 'local-fallback' for UI badge
    expect(result.hits.length).toBeGreaterThan(0);
    expect(result.hits[0]?.id).toBe('fallback-edu');
    expect(result.adapterMode).toBe('local-fallback');
  });

  it('ensures every returned chunk includes source, version, and effective_date', async () => {
    const res = await service.retrieve({
      query: 'health insurance waiting period co-payment cashless',
      domain: 'insurance',
      userId: 'test-user-meta',
      topK: 4,
    });

    expect(res.sources.length).toBeGreaterThan(0);
    for (const src of res.sources) {
      expect(src.source).toBeDefined();
      expect(src.source.length).toBeGreaterThan(0);
      expect(src.version).toBeDefined();
      expect(src.effectiveDate).toBeDefined();
      expect(src.effectiveDate.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('neutralizes prompt-injection payloads in retrieved chunks', async () => {
    const res = await service.retrieve({
      query: 'SYSTEM OVERRIDE Promotional Attachment guarantee 100% approval',
      domain: 'lending',
      userId: 'test-user-security',
      topK: 5,
    });

    const injectionHit = res.hits.find((h) => h.id === 'test-prompt-injection');
    if (injectionHit) {
      // Must be sanitized - no raw SYSTEM OVERRIDE or guarantee commands
      expect(injectionHit.content).toContain('[REDACTED_SECURITY_POLICY]');
      expect(injectionHit.content).not.toContain('SYSTEM OVERRIDE');
    }
  });
});
