import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../http/app.js';
import { getConfig } from '../config/env.js';
import type { SseEvent } from '@sahaj/shared';

function parseSseEvents(raw: string): SseEvent[] {
  const events: SseEvent[] = [];
  const blocks = raw.split('\n\n');

  for (const block of blocks) {
    if (!block.trim() || block.startsWith(': ping')) continue;
    const lines = block.split('\n');
    let dataStr = '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        dataStr = line.slice(6);
      }
    }

    if (dataStr) {
      try {
        events.push(JSON.parse(dataStr) as SseEvent);
      } catch {
        // Skip malformed chunk
      }
    }
  }

  return events;
}

describe('B-Pipeline Message Orchestrator (SSE Streaming)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    const config = getConfig();
    app = await buildApp(config);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Turn 1: processes the Hinglish demo line and asks the single missing field', async () => {
    // 1. Create journey
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/journeys',
      payload: { language: 'hinglish' },
    });
    expect(createRes.statusCode).toBe(201);
    const cookie = createRes.headers['set-cookie'];
    const journeyId = createRes.json()._id;

    // 2. User sends Hinglish demo line:
    // "Mujhe ₹2 lakh ki zarurat hai apni education ke liye. Mujhe samajh nahi aa raha kaunsa option mere liye sahi hai."
    const msgRes = await app.inject({
      method: 'POST',
      url: `/api/journeys/${journeyId}/messages`,
      headers: {
        cookie: Array.isArray(cookie) ? cookie.join('; ') : cookie,
      },
      payload: {
        content: 'Mujhe ₹2 lakh ki zarurat hai apni education ke liye. Mujhe samajh nahi aa raha kaunsa option mere liye sahi hai.',
      },
    });

    expect(msgRes.statusCode).toBe(200);
    expect(msgRes.headers['content-type']).toContain('text/event-stream');

    const events = parseSseEvents(msgRes.body);
    expect(events.length).toBeGreaterThan(0);

    // Event 1: status understanding
    expect(events[0]?.type).toBe('status');
    // @ts-expect-error type assertion
    expect(events[0]?.stage).toBe('understanding');

    // Event 2: intent detected (lending, 200000, education)
    const intentEvt = events.find((e) => e.type === 'intent');
    expect(intentEvt).toBeDefined();
    if (intentEvt && intentEvt.type === 'intent') {
      expect(intentEvt.domain).toBe('lending');
      expect(intentEvt.entities.amount).toBe(200000);
      expect(intentEvt.entities.purpose).toBe('education');
    }

    // Event 3: profile_update with missing fields
    const profileEvt = events.find((e) => e.type === 'profile_update');
    expect(profileEvt).toBeDefined();
    if (profileEvt && profileEvt.type === 'profile_update') {
      expect(profileEvt.missingFields).toContain('monthly_income');
      expect(profileEvt.fields['amount']).toBe(200000);
      expect(profileEvt.fields['purpose']).toBe('education');
    }

    // Tokens streamed
    const tokens = events.filter((e) => e.type === 'token');
    expect(tokens.length).toBeGreaterThan(0);

    // Event: journey_state PROFILE_INCOMPLETE
    const stateEvt = events.find((e) => e.type === 'journey_state');
    expect(stateEvt).toBeDefined();
    if (stateEvt && stateEvt.type === 'journey_state') {
      expect(stateEvt.state).toBe('PROFILE_INCOMPLETE');
      expect(stateEvt.progress).toBe(0.2);
    }

    // Event: done with timings
    const doneEvt = events.find((e) => e.type === 'done');
    expect(doneEvt).toBeDefined();
    if (doneEvt && doneEvt.type === 'done') {
      expect(doneEvt.timings.totalMs).toBeGreaterThanOrEqual(0);
      expect(doneEvt.timings.ttftMs).toBeGreaterThanOrEqual(0);
    }
  });

  it('Turn 2: completes profile with monthly income -> receives affordability, cards, checklist, trace & explanation', async () => {
    // 1. Create journey
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/journeys',
      payload: { language: 'hinglish' },
    });
    const cookie = createRes.headers['set-cookie'];
    const journeyId = createRes.json()._id;

    // First turn: intent & amount
    await app.inject({
      method: 'POST',
      url: `/api/journeys/${journeyId}/messages`,
      headers: { cookie: Array.isArray(cookie) ? cookie.join('; ') : cookie },
      payload: { content: 'Mujhe 2 lakh education loan chahiye' },
    });

    // Second turn: monthly income
    const turn2Res = await app.inject({
      method: 'POST',
      url: `/api/journeys/${journeyId}/messages`,
      headers: { cookie: Array.isArray(cookie) ? cookie.join('; ') : cookie },
      payload: { content: 'Meri monthly salary 30 hazaar hai aur koi EMI nahi hai' },
    });

    expect(turn2Res.statusCode).toBe(200);
    const events = parseSseEvents(turn2Res.body);

    // Verify Affordability Event
    const affordEvt = events.find((e) => e.type === 'affordability');
    expect(affordEvt).toBeDefined();
    if (affordEvt && affordEvt.type === 'affordability') {
      expect(affordEvt.label).toBe('Illustrative estimate');
      expect(affordEvt.band).toBe('comfortable');
      expect(affordEvt.isAffordable).toBe(true);
      expect(affordEvt.assumptions.income).toBe(30000);
    }

    // Verify Cards Event (3 education loan products)
    const cardsEvt = events.find((e) => e.type === 'cards');
    expect(cardsEvt).toBeDefined();
    if (cardsEvt && cardsEvt.type === 'cards') {
      expect(cardsEvt.products.length).toBe(3);
      expect(cardsEvt.products[0]?.domain).toBe('lending');
    }

    // Verify Checklist Event
    const checklistEvt = events.find((e) => e.type === 'checklist');
    expect(checklistEvt).toBeDefined();
    if (checklistEvt && checklistEvt.type === 'checklist') {
      expect(checklistEvt.items.length).toBe(3);
      expect(checklistEvt.items.some((i) => i.id === 'doc-admission')).toBe(true);
    }

    // Verify KnowledgeTrace Event
    const traceEvt = events.find((e) => e.type === 'trace');
    expect(traceEvt).toBeDefined();
    if (traceEvt && traceEvt.type === 'trace') {
      expect(traceEvt.nodes.length).toBeGreaterThan(0);
      expect(traceEvt.topK).toBe(6);
    }

    // Verify Citations Event
    const citationsEvt = events.find((e) => e.type === 'citations');
    expect(citationsEvt).toBeDefined();
    if (citationsEvt && citationsEvt.type === 'citations') {
      expect(citationsEvt.citations.length).toBe(3);
    }

    // Verify Journey State: OPTIONS_READY
    const stateEvt = events.find((e) => e.type === 'journey_state');
    expect(stateEvt).toBeDefined();
    if (stateEvt && stateEvt.type === 'journey_state') {
      expect(stateEvt.state).toBe('OPTIONS_READY');
      expect(stateEvt.progress).toBe(0.65);
    }

    // Verify Explanation tokens streamed
    const tokens = events.filter((e) => e.type === 'token');
    expect(tokens.length).toBeGreaterThan(0);

    // Verify Done event
    const doneEvt = events.find((e) => e.type === 'done');
    expect(doneEvt).toBeDefined();
  });
});
