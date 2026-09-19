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
  const allowedOrigins = config.CORS_ORIGINS.split(',').map((o) => o.trim());
  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Request-ID', 'X-CSRF-Token'],
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
      sameSite: 'strict' as const,
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

  await app.register(healthRoute, { prefix: '/api' });
  await app.register(journeysRoutes, { prefix: '/api' });
  await app.register(interactionsRoutes, { prefix: '/api' });
  await app.register(documentsRoutes, { prefix: '/api' });
  await app.register(automationRoutes, { prefix: '/api' });

  return app;
}
