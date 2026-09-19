import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../http/app.js';
import { getConfig } from '../config/env.js';

describe('API Authorization & Cross-User Isolation (A3-2)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    const config = getConfig();
    app = await buildApp(config);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('strictly returns 404 (never 403) when User B tries to access User A journey', async () => {
    // 1. User A creates a journey
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/journeys',
      payload: { language: 'en' },
    });

    expect(createRes.statusCode).toBe(201);
    const userAJourney = createRes.json();
    const journeyId = userAJourney._id;
    expect(journeyId).toBeDefined();

    // Extract User A's session cookie
    const cookiesA = createRes.headers['set-cookie'];
    expect(cookiesA).toBeDefined();

    // 2. User B (different session / no cookie or fresh cookie) attempts GET /api/journeys/:id
    const userBAccessRes = await app.inject({
      method: 'GET',
      url: `/api/journeys/${journeyId}`,
      // No cookie -> User B gets their own separate guest session
    });

    // Quality gate: Must return 404, not 403, to prevent ID harvesting/enumeration
    expect(userBAccessRes.statusCode).toBe(404);
  });

  it('returns 404 when User B attempts to view compare or checklist of User A journey', async () => {
    // Create journey for User A
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/journeys',
      payload: { language: 'en' },
    });
    const journeyId = createRes.json().id ?? createRes.json()._id;

    // User B tries to access compare
    const compareRes = await app.inject({
      method: 'GET',
      url: `/api/journeys/${journeyId}/compare`,
    });
    expect(compareRes.statusCode).toBe(404);

    // User B tries to access checklist
    const checklistRes = await app.inject({
      method: 'GET',
      url: `/api/journeys/${journeyId}/checklist`,
    });
    expect(checklistRes.statusCode).toBe(404);
  });

  it('returns 404 when User B attempts to patch profile or stream messages to User A journey', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/journeys',
      payload: { language: 'en' },
    });
    const journeyId = createRes.json().id ?? createRes.json()._id;

    // User B tries to patch profile
    const patchRes = await app.inject({
      method: 'PATCH',
      url: `/api/journeys/${journeyId}/profile`,
      payload: { amount: 500000 },
    });
    expect(patchRes.statusCode).toBe(404);

    // User B tries to post message
    const msgRes = await app.inject({
      method: 'POST',
      url: `/api/journeys/${journeyId}/messages`,
      payload: { content: 'Malicious message' },
    });
    expect(msgRes.statusCode).toBe(404);
  });

  it('allows User A with valid session cookie to read their own journey', async () => {
    // User A creates journey
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/journeys',
      payload: { language: 'hinglish' },
    });
    const cookie = createRes.headers['set-cookie'];
    const journeyId = createRes.json().id ?? createRes.json()._id;

    // User A accesses journey with cookie
    const getRes = await app.inject({
      method: 'GET',
      url: `/api/journeys/${journeyId}`,
      headers: {
        cookie: Array.isArray(cookie) ? cookie.join('; ') : cookie,
      },
    });

    expect(getRes.statusCode).toBe(200);
    expect(getRes.json()._id).toBe(journeyId);
  });
});
