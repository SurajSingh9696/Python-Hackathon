/**
 * GET /api/health — reports adapter modes and DB status.
 * Used by Docker healthcheck and the KnowledgeTrace drawer.
 */
import type { FastifyPluginAsync } from 'fastify';
import { getAdapterModes, getConfig } from '../config/env.js';
import { getMongoStatus } from '../db/connection.js';

export const healthRoute: FastifyPluginAsync = async (app) => {
  app.get(
    '/health',
    // No response schema — health endpoint returns freeform JSON
    async (_request, reply) => {
      const config = getConfig();
      const adapters = getAdapterModes(config);
      const dbStatus = getMongoStatus();

      return reply.status(200).send({
        status: 'ok',
        version: '0.1.0',
        uptime: Math.floor(process.uptime()),
        adapters,
        db: dbStatus,
        timestamp: new Date().toISOString(),
      });
    }
  );
};
