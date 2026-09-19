/**
 * Server-Sent Events (SSE) Helper for Fastify.
 *
 * Implements SSE over POST with typed events matching packages/shared Zod schemas.
 * Ensures proper headers and chunk flushing for real-time frontend streaming.
 */
import type { FastifyReply } from 'fastify';
import type { SseEvent } from '@sahaj/shared';

export class SseStream {
  private reply: FastifyReply;
  private closed = false;

  constructor(reply: FastifyReply) {
    this.reply = reply;

    // Copy all Fastify queued headers (CORS, cookies, security, etc.) to raw response before flushing
    const fastifyHeaders = reply.getHeaders();
    for (const [key, val] of Object.entries(fastifyHeaders)) {
      if (val !== undefined && !reply.raw.hasHeader(key)) {
        reply.raw.setHeader(key, val);
      }
    }

    // Explicitly guarantee CORS headers for cross-origin SSE connections
    const origin = reply.request.headers['origin'];
    if (origin && !reply.raw.hasHeader('access-control-allow-origin')) {
      reply.raw.setHeader('Access-Control-Allow-Origin', origin);
      reply.raw.setHeader('Access-Control-Allow-Credentials', 'true');
      reply.raw.setHeader('Vary', 'Origin');
    }

    // Set SSE headers
    reply.raw.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    reply.raw.setHeader('Cache-Control', 'no-cache, no-transform');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering (Nginx, etc.)
    reply.raw.flushHeaders();

    reply.raw.on('close', () => {
      this.closed = true;
    });
  }

  /**
   * Send a typed SSE event to the client.
   */
  send(event: SseEvent): boolean {
    if (this.closed) return false;

    const payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
    this.reply.raw.write(payload);
    return true;
  }

  /**
   * Send token chunk for fast progressive streaming.
   */
  sendToken(delta: string): boolean {
    return this.send({ type: 'token', delta });
  }

  /**
   * Send a heartbeat ping to prevent connection timeout.
   */
  ping(): boolean {
    if (this.closed) return false;
    this.reply.raw.write(': ping\n\n');
    return true;
  }

  /**
   * Close the stream.
   */
  close(): void {
    if (!this.closed) {
      this.closed = true;
      this.reply.raw.end();
    }
  }

  get isClosed(): boolean {
    return this.closed;
  }
}
