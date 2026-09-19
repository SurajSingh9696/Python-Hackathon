import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../http/app.js';
import { getConfig } from '../config/env.js';

describe('Health & Root Cloud Prober Endpoints', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    const config = getConfig();
    app = await buildApp(config);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('responds 200 to GET / (Render root prober)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('sahaj-api');
  });

  it('responds 200 to HEAD / (Render default health check method)', async () => {
    const res = await app.inject({
      method: 'HEAD',
      url: '/',
    });
    expect(res.statusCode).toBe(200);
  });

  it('responds 200 to GET /health', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('ok');
  });

  it('responds 200 to GET /api/health with system & adapter diagnostics', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/health',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('ok');
    expect(body.version).toBe('0.1.0');
    expect(body.adapters).toBeDefined();
    expect(body.db).toBeDefined();
  });

  it('handles CORS preflight OPTIONS requests from Vercel origins', async () => {
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/api/journeys',
      headers: {
        origin: 'https://web-one-kohl-70.vercel.app',
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'content-type',
      },
    });
    expect(res.statusCode).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('https://web-one-kohl-70.vercel.app');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });
});
