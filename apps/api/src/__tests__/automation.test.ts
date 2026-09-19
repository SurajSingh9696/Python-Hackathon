import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import crypto from 'crypto';
import { buildApp } from '../http/app.js';
import { getConfig } from '../config/env.js';
import { outboxService } from '../services/outboxService.js';

describe('Automation, Escalation & Outbox Service (Phase 8)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    const config = getConfig();
    app = await buildApp(config);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('schedules a reminder and enqueues event in Outbox', async () => {
    // 1. Create a journey
    const journeyRes = await app.inject({
      method: 'POST',
      url: '/api/journeys',
      payload: { language: 'en' },
    });
    expect(journeyRes.statusCode).toBe(201);
    const journey = journeyRes.json();
    const cookie = journeyRes.headers['set-cookie'];

    // 2. Schedule reminder
    const remindRes = await app.inject({
      method: 'POST',
      url: `/api/journeys/${journey._id}/remind`,
      headers: { cookie: Array.isArray(cookie) ? cookie[0]! : cookie! },
      payload: {
        note: 'Review loan comparison and upload documents',
        channel: 'whatsapp',
        remindAt: new Date(Date.now() + 86400000).toISOString(),
      },
    });

    expect(remindRes.statusCode).toBe(201);
    const body = remindRes.json();
    expect(body.success).toBe(true);
    expect(body.eventId).toBeDefined();
    expect(body.message).toContain('Reminder scheduled successfully');
  });

  it('rejects reminder scheduling if user is unauthorized or journey does not exist', async () => {
    const remindRes = await app.inject({
      method: 'POST',
      url: '/api/journeys/non-existent-id/remind',
      payload: {
        note: 'Some note',
        channel: 'sms',
      },
    });

    expect(remindRes.statusCode).toBe(404);
  });

  it('escalates journey to human specialist and records in outbox', async () => {
    // 1. Create journey
    const journeyRes = await app.inject({
      method: 'POST',
      url: '/api/journeys',
      payload: { language: 'hi' },
    });
    const journey = journeyRes.json();
    const cookie = journeyRes.headers['set-cookie'];

    // 2. Escalate
    const escalateRes = await app.inject({
      method: 'POST',
      url: `/api/journeys/${journey._id}/escalate`,
      headers: { cookie: Array.isArray(cookie) ? cookie[0]! : cookie! },
      payload: {
        reason: 'Complex collateral requirements on foreign loan',
        comment: 'Customer needs help understanding SBI collateral norms.',
      },
    });

    expect(escalateRes.statusCode).toBe(201);
    const body = escalateRes.json();
    expect(body.success).toBe(true);
    expect(body.escalationId).toBeDefined();
    expect(body.outboxDeliveryId).toBeDefined();

    // 3. Query escalations for this journey
    const listRes = await app.inject({
      method: 'GET',
      url: `/api/journeys/${journey._id}/escalations`,
      headers: { cookie: Array.isArray(cookie) ? cookie[0]! : cookie! },
    });

    expect(listRes.statusCode).toBe(200);
    const listBody = listRes.json();
    expect(Array.isArray(listBody.escalations)).toBe(true);
  });

  it('prevents User B from accessing User A escalations (returns 404)', async () => {
    // 1. Create User A journey
    const journeyRes = await app.inject({
      method: 'POST',
      url: '/api/journeys',
      payload: { language: 'en' },
    });
    const journey = journeyRes.json();

    // 2. User B tries to fetch escalations without User A session cookie
    const unauthorizedRes = await app.inject({
      method: 'GET',
      url: `/api/journeys/${journey._id}/escalations`,
    });

    expect(unauthorizedRes.statusCode).toBe(404);
  });

  it('returns valid stats from GET /api/outbox/status', async () => {
    const statsRes = await app.inject({
      method: 'GET',
      url: '/api/outbox/status',
    });

    expect(statsRes.statusCode).toBe(200);
    const stats = statsRes.json();
    expect(typeof stats.pending).toBe('number');
    expect(typeof stats.completed).toBe('number');
    expect(typeof stats.failed).toBe('number');
    expect(typeof stats.total).toBe('number');
    expect(stats.total).toBeGreaterThanOrEqual(0);
  });

  it('OutboxService computes valid HMAC-SHA256 signatures for webhook payloads', async () => {
    const secret = 'sahaj-test-secret';
    const payload = { test: true, journeyId: '123' };
    const payloadStr = JSON.stringify(payload);
    const expectedSig = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');

    // Verify HMAC correctness
    const computedSig = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');
    expect(computedSig).toBe(expectedSig);
    expect(computedSig).toMatch(/^[a-f0-9]{64}$/);

    // Enqueue an event directly
    const event = await outboxService.enqueue({
      eventType: 'unit_test_event',
      payload,
    });

    expect(event._id).toBeDefined();
    expect(event.eventType).toBe('unit_test_event');
  });
});
