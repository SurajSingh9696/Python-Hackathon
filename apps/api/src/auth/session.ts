/**
 * Guest Session & Authentication Plugin.
 *
 * Provides transparent guest sessions via httpOnly SameSite signed cookies.
 * Attaches `request.userId` to all incoming requests.
 * Separation of concerns: identity is kept separate from financial data.
 */
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { v4 as uuidv4 } from 'uuid';
import { getCollections } from '../db/collections.js';
import { getDb, getMongoStatus } from '../db/connection.js';

declare module 'fastify' {
  interface FastifyRequest {
    userId: string;
    isGuest: boolean;
  }
}

const COOKIE_NAME = 'sahaj_session';

export const sessionPlugin: FastifyPluginAsync = fp(async (app) => {
  app.decorateRequest('userId', '');
  app.decorateRequest('isGuest', true);

  app.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip session check for healthcheck and preflight OPTIONS
    if (request.method === 'OPTIONS' || request.url.startsWith('/api/health')) {
      return;
    }

    // 1. Check existing signed cookie
    let userId: string | null = null;
    const cookieVal = request.cookies[COOKIE_NAME];

    if (cookieVal) {
      const unsigned = request.unsignCookie(cookieVal);
      if (unsigned.valid && unsigned.value) {
        userId = unsigned.value;
      }
    }

    // 2. If no valid session, generate a new guest session
    if (!userId) {
      userId = uuidv4();

      // Persist guest user record if DB is connected
      const mongoStatus = getMongoStatus();
      if (mongoStatus.connected) {
        try {
          const cols = getCollections(getDb());
          await cols.users.insertOne({
            _id: userId,
            isGuest: true,
            createdAt: new Date(),
            lastActiveAt: new Date(),
          });
        } catch {
          // In mock/test environments without DB, in-memory session continues seamlessly
        }
      }

      // Set signed httpOnly cookie (supports cross-origin Vercel -> Render calls)
      reply.setCookie(COOKIE_NAME, userId, {
        path: '/',
        httpOnly: true,
        secure: process.env['NODE_ENV'] === 'production',
        sameSite: process.env['NODE_ENV'] === 'production' ? 'none' : 'lax',
        signed: true,
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }

    request.userId = userId;
    request.isGuest = true;
  });
});
