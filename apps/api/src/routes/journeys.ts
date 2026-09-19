/**
 * Journey & Message REST & Streaming Routes.
 *
 * Implements:
 * - POST /api/journeys
 * - GET  /api/journeys
 * - GET  /api/journeys/:id
 * - POST /api/journeys/:id/messages (SSE over POST)
 * - PATCH /api/journeys/:id/profile
 * - GET  /api/journeys/:id/compare
 * - GET  /api/journeys/:id/checklist
 */
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  CreateJourneySchema,
  SendMessageSchema,
  UpdateProfileSchema,
} from '@sahaj/shared';
import { journeyRepo } from '../repositories/journeyRepository.js';
import { SseStream } from '../http/sse.js';
import { executeMessagePipeline, DEMO_PRODUCTS } from '../orchestrator/messageOrchestrator.js';

const JourneyIdParamSchema = z.object({
  id: z.string().min(1),
});

export const journeysRoutes: FastifyPluginAsync = async (app) => {
  // ── POST /api/journeys ──────────────────────────────────────────
  app.post(
    '/journeys',
    async (request, reply) => {
      const body = CreateJourneySchema.parse(request.body ?? {});
      const journey = await journeyRepo.create({
        userId: request.userId,
        language: body.language,
      });
      return reply.status(201).send(journey);
    }
  );

  // ── GET /api/journeys ───────────────────────────────────────────
  app.get('/journeys', async (request, reply) => {
    const list = await journeyRepo.listByUser(request.userId);
    return reply.send({ journeys: list });
  });

  // ── GET /api/journeys/:id ───────────────────────────────────────
  app.get('/journeys/:id', async (request, reply) => {
    const params = JourneyIdParamSchema.parse(request.params);
    const journey = await journeyRepo.getById(params.id, request.userId);
    return reply.send(journey);
  });

  // ── PATCH /api/journeys/:id/profile ─────────────────────────────
  app.patch('/journeys/:id/profile', async (request, reply) => {
    const params = JourneyIdParamSchema.parse(request.params);
    const body = UpdateProfileSchema.parse(request.body);

    const updated = await journeyRepo.updateStateAndProfile(params.id, request.userId, {
      profile: body,
    });
    return reply.send(updated);
  });

  // ── GET /api/journeys/:id/compare ───────────────────────────────
  app.get('/journeys/:id/compare', async (request, reply) => {
    const params = JourneyIdParamSchema.parse(request.params);
    const journey = await journeyRepo.getById(params.id, request.userId);

    return reply.send({
      journeyId: journey._id,
      state: journey.state,
      domain: journey.domain,
      products: DEMO_PRODUCTS,
      timestamp: new Date().toISOString(),
    });
  });

  // ── GET /api/journeys/:id/checklist ─────────────────────────────
  app.get('/journeys/:id/checklist', async (request, reply) => {
    const params = JourneyIdParamSchema.parse(request.params);
    await journeyRepo.getById(params.id, request.userId);

    return reply.send({
      items: [
        {
          id: 'doc-admission',
          label: 'College Admission Letter / Fee Structure',
          status: 'needed',
          mandatory: true,
        },
        {
          id: 'doc-income',
          label: 'Income Proof / Salary Slip',
          status: 'needed',
          mandatory: true,
        },
        {
          id: 'doc-kyc',
          label: 'KYC Document (Aadhaar / PAN Card)',
          status: 'needed',
          mandatory: true,
        },
      ],
    });
  });

  // ── POST /api/journeys/:id/messages (SSE STREAM) ─────────────────
  app.post('/journeys/:id/messages', async (request, reply) => {
    const params = JourneyIdParamSchema.parse(request.params);
    const body = SendMessageSchema.parse(request.body);

    // Verify ownership before opening stream (throws 404 on mismatch)
    await journeyRepo.getById(params.id, request.userId);

    const sse = new SseStream(reply);

    // Run pipeline asynchronously over SSE
    executeMessagePipeline(
      {
        journeyId: params.id,
        userId: request.userId,
        content: body.content,
        ...(body.language !== undefined ? { language: body.language } : {}),
      },
      sse
    ).catch((err) => {
      request.log.error({ err }, 'Error in message pipeline stream');
      if (!sse.isClosed) {
        sse.send({
          type: 'error',
          code: 'PIPELINE_ERROR',
          message: 'An error occurred while generating your response. Please try again.',
          retryable: true,
        });
        sse.close();
      }
    });

    // Fastify handles the reply via raw stream in SseStream
  });
};
