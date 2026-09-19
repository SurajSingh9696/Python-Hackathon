import { describe, it, expect, beforeAll } from 'vitest';
import {
  createKnowledgeStore,
  type KnowledgeStore,
} from '../adapters/knowledge/index.js';
import { getConfig } from '../config/env.js';
import { RetrievalService } from '../services/retrievalService.js';

describe('Knowledge Layer & Cognee Multi-User Isolation (Leakage Test)', () => {
  let store: KnowledgeStore;
  let service: RetrievalService;

  beforeAll(async () => {
    const config = getConfig();
    store = createKnowledgeStore(config);
    service = new RetrievalService();
  });

  it('strictly isolates User A journey context from User B', async () => {
    const userA = 'user-alice-101';
    const userB = 'user-bob-202';

    // 1. User A stores their confidential financial context
    await service.syncUserJourneyContext(userA, 'journey-alice-edu', {
      goal: '₹15 Lakh Medical Specialization Loan in Mumbai',
      domain: 'lending',
      state: 'OPTIONS_READY',
      derivedFacts: {
        monthly_income: 95000,
        target_institute: 'Grant Medical College',
      },
    });

    // 2. User B stores their own different context
    await service.syncUserJourneyContext(userB, 'journey-bob-health', {
      goal: 'Family Health Cover for elderly parents',
      domain: 'insurance',
      state: 'PROFILE_INCOMPLETE',
      derivedFacts: {
        members_to_cover: 3,
      },
    });

    // 3. User B searches for "Medical Specialization" or "Grant Medical" in journey_context
    const userBSearch = await store.search('Medical Specialization Grant Medical College Mumbai', {
      datasets: ['journey_context'],
      scope: { userId: userB },
    });

    // Quality Gate: User B MUST NOT see Alice's confidential loan facts!
    expect(userBSearch.hits.length).toBe(0);
    const leakedAliceDoc = userBSearch.hits.find((h) => h.content.includes('Grant Medical') || h.content.includes('95000'));
    expect(leakedAliceDoc).toBeUndefined();

    // 4. User A searches for their own context
    const userASearch = await store.search('Medical Specialization', {
      datasets: ['journey_context'],
      scope: { userId: userA },
    });

    // User A can retrieve their own context
    expect(userASearch.hits.length).toBeGreaterThan(0);
    expect(userASearch.hits[0]?.content).toContain('Grant Medical College');
  });

  it('throws security error if journey_context is queried without scope.userId', async () => {
    await expect(
      store.add('journey_context', [
        {
          id: 'unscoped-doc',
          title: 'Unscoped Document',
          content: 'Should not be allowed',
          domain: 'lending',
          source: 'Leak Test',
          provider: 'Demo Provider',
          version: '1.0',
          effectiveDate: '2026-01-01',
          synthetic: true,
        },
      ])
    ).rejects.toThrow(/Security Error: scope.userId is/i);
  });
});
