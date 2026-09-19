/**
 * Fastify application factory.
 * Registers all plugins and routes.
 */
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import cookie from '@fastify/cookie';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import type { Config } from '../config/env.js';

export async function buildApp(config: Config) {
  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      ...(config.NODE_ENV === 'development'
        ? {
            transport: {
              target: 'pino-pretty',
              options: { colorize: true, translateTime: 'HH:MM:ss.l', ignore: 'pid,hostname' },
            },
          }
        : {}),
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          '*.monthly_income',
          '*.amount',
          '*.masked_number',
          '*.gross_income',
          '*.net_income',
        ],
        censor: '[REDACTED]',
      },
    },
    trustProxy: true,
    rewriteUrl: (req) => (req.url ? req.url.replace(/\/{2,}/g, '/') : (req.url ?? '')),
    bodyLimit: 10 * 1024 * 1024, // 10 MB
    requestIdHeader: 'x-request-id',
    genReqId: () => crypto.randomUUID(),
  });

  // Zod schema validation
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Security
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
        mediaSrc: ["'self'", 'blob:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  });

  // CORS
  await app.register(cors, {
    origin: (origin, cb) => {
      // Reflect origin for preflight & cross-origin requests (Vercel, Render, local dev, custom domains)
      if (!origin) {
        cb(null, true);
        return;
      }
      cb(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Request-ID',
      'X-CSRF-Token',
      'Cache-Control',
      'Last-Event-ID',
    ],
    exposedHeaders: ['Content-Type', 'X-Request-ID'],
  });

  // Rate limiting
  await app.register(rateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW_MS,
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please slow down.',
    }),
  });

  // Cookies
  await app.register(cookie, {
    secret: config.SESSION_SECRET,
    parseOptions: {
      httpOnly: true,
      sameSite: config.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const),
      secure: config.NODE_ENV === 'production',
      maxAge: config.SESSION_MAX_AGE_SECONDS,
      path: '/',
    },
  });

  // Global error handler
  app.setErrorHandler((error, request, reply) => {
    const statusCode = error.statusCode ?? 500;
    request.log.error({ err: error, statusCode }, 'Request error');
    void reply.status(statusCode).send({
      error: error.name ?? 'InternalError',
      message:
        statusCode < 500
          ? error.message
          : 'Something went wrong. Please try again.',
      requestId: request.id,
    });
  });

  // Not found handler
  app.setNotFoundHandler((request, reply) => {
    void reply.status(404).send({
      error: 'NotFound',
      message: `Route ${request.method} ${request.url} not found`,
    });
  });

  // Session & Guest Authentication
  const { sessionPlugin } = await import('../auth/session.js');
  await app.register(sessionPlugin);

  // Register routes
  const { healthRoute } = await import('../routes/health.js');
  const { journeysRoutes } = await import('../routes/journeys.js');
  const { interactionsRoutes } = await import('../routes/interactions.js');
  const { documentsRoutes } = await import('../routes/documents.js');
  const { automationRoutes } = await import('../routes/automation.js');

  // Root & Health check routes for Render / PaaS health probers
  app.get('/', async (_request, reply) => {
    return reply.status(200).send({
      status: 'ok',
      service: 'sahaj-api',
      version: '0.1.0',
      health: '/api/health',
    });
  });

  app.get('/health', async (_request, reply) => {
    return reply.status(200).send({
      status: 'ok',
      service: 'sahaj-api',
      version: '0.1.0',
      health: '/api/health',
    });
  });

  await app.register(healthRoute, { prefix: '/api' });
  await app.register(journeysRoutes, { prefix: '/api' });
  await app.register(interactionsRoutes, { prefix: '/api' });
  await app.register(documentsRoutes, { prefix: '/api' });
  await app.register(automationRoutes, { prefix: '/api' });

  return app;
}
