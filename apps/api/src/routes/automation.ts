import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { outboxService } from '../services/outboxService.js';
import { journeyRepo } from '../repositories/journeyRepository.js';
import { getCollections } from '../db/collections.js';
import { getDb, getMongoStatus } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

const JourneyIdParamSchema = z.object({
  id: z.string().min(1),
});

const ReminderBodySchema = z.object({
  note: z.string().min(1),
  channel: z.enum(['whatsapp', 'sms', 'push', 'email']).default('whatsapp'),
  remindAt: z.string().optional(),
});

const EscalateBodySchema = z.object({
  reason: z.string().min(1),
  comment: z.string().optional(),
});

export const automationRoutes: FastifyPluginAsync = async (app) => {
  // ── POST /api/journeys/:id/remind ───────────────────────────────
  app.post('/journeys/:id/remind', async (request, reply) => {
    const params = JourneyIdParamSchema.parse(request.params);
    const body = ReminderBodySchema.parse(request.body);

    const journey = await journeyRepo.getById(params.id, request.userId);

    const outboxEvent = await outboxService.enqueue({
      eventType: 'reminder_requested',
      payload: {
        journeyId: journey._id,
        userId: request.userId,
        domain: journey.domain,
        channel: body.channel,
        note: body.note,
        remindAt: body.remindAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        userPhoneMasked: 'XXXXXX9876',
      },
    });

    return reply.status(201).send({
      success: true,
      message: 'Reminder scheduled successfully via n8n webhook outbox.',
      eventId: outboxEvent._id,
    });
  });

  // ── POST /api/journeys/:id/escalate ─────────────────────────────
  app.post('/journeys/:id/escalate', async (request, reply) => {
    const params = JourneyIdParamSchema.parse(request.params);
    const body = EscalateBodySchema.parse(request.body);

    const journey = await journeyRepo.getById(params.id, request.userId);

    const escalationDoc = {
      _id: uuidv4(),
      journeyId: journey._id,
      userId: request.userId,
      reason: body.reason,
      status: 'pending' as const,
      createdAt: new Date(),
    };

    const status = getMongoStatus();
    if (status.connected) {
      const cols = getCollections(getDb());
      await cols.escalations.insertOne(escalationDoc);
    }

    // Enqueue webhook for specialist dispatch via n8n
    const outboxEvent = await outboxService.enqueue({
      eventType: 'human_escalation',
      payload: {
        escalationId: escalationDoc._id,
        journeyId: journey._id,
        userId: request.userId,
        reason: body.reason,
        comment: body.comment,
        state: journey.state,
        domain: journey.domain,
        urgency: 'high',
      },
    });

    return reply.status(201).send({
      success: true,
      escalationId: escalationDoc._id,
      outboxDeliveryId: outboxEvent._id,
      message: 'A human specialist has been notified and will review your journey.',
    });
  });

  // ── GET /api/journeys/:id/escalations ───────────────────────────
  app.get('/journeys/:id/escalations', async (request, reply) => {
    const params = JourneyIdParamSchema.parse(request.params);
    await journeyRepo.getById(params.id, request.userId);

    const status = getMongoStatus();
    if (status.connected) {
      const cols = getCollections(getDb());
      const list = await cols.escalations.find({ journeyId: params.id, userId: request.userId }).toArray();
      return reply.send({ escalations: list });
    }

    return reply.send({ escalations: [] });
  });

  // ── GET /api/outbox/status ──────────────────────────────────────
  app.get('/outbox/status', async (_request, reply) => {
    const stats = await outboxService.getStats();
    return reply.send(stats);
  });
};
