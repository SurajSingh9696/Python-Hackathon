import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { documentService } from '../services/documentService.js';
import { documentRepo } from '../repositories/documentRepository.js';

const JourneyIdParamSchema = z.object({
  id: z.string().min(1),
});

const DocumentParamSchema = z.object({
  id: z.string().min(1),
  docId: z.string().min(1),
});

const UploadDocumentBodySchema = z.object({
  docType: z.enum(['admission_letter', 'income_proof', 'identity_proof', 'bank_statement']),
  filename: z.string().min(1),
  contentBase64: z.string().optional(),
  mimeType: z.string().optional(),
});

export const documentsRoutes: FastifyPluginAsync = async (app) => {
  // ── POST /api/journeys/:id/documents ───────────────────────────
  app.post('/journeys/:id/documents', async (request, reply) => {
    const params = JourneyIdParamSchema.parse(request.params);
    const body = UploadDocumentBodySchema.parse(request.body);

    const result = await documentService.processUpload({
      journeyId: params.id,
      userId: request.userId,
      docType: body.docType,
      filename: body.filename,
      ...(body.contentBase64 !== undefined ? { contentBase64: body.contentBase64 } : {}),
      ...(body.mimeType !== undefined ? { mimeType: body.mimeType } : {}),
    });

    return reply.status(201).send(result);
  });

  // ── GET /api/journeys/:id/documents ────────────────────────────
  app.get('/journeys/:id/documents', async (request, reply) => {
    const params = JourneyIdParamSchema.parse(request.params);
    const docs = await documentRepo.listByJourney(params.id, request.userId);
    return reply.send({ documents: docs });
  });

  // ── DELETE /api/journeys/:id/documents/:docId ──────────────────
  app.delete('/journeys/:id/documents/:docId', async (request, reply) => {
    const params = DocumentParamSchema.parse(request.params);
    const res = await documentService.deleteDocument(params.docId, params.id, request.userId);
    return reply.send(res);
  });
};
