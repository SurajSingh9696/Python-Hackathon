/**
 * Server-Sent Events (SSE) Client.
 *
 * Uses fetch + ReadableStream to read streaming responses from Fastify backend.
 * Parses lines formatted as `data: {...}\n\n` into typed SseEvent objects.
 */
import { SseEventSchema, type SseEvent } from '@sahaj/shared';

function getApiBase(): string {
  const raw = (process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3001/api').trim().replace(/\/+$/, '');
  return raw.endsWith('/api') ? raw : `${raw}/api`;
}

const API_BASE = getApiBase();

export interface SseStreamCallbacks {
  onEvent: (event: SseEvent) => void;
  onError?: (error: Error) => void;
  onDone?: () => void;
}

export async function startMessageStream(
  journeyId: string,
  content: string,
  callbacks: SseStreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const url = `${API_BASE}/journeys/${journeyId}/messages`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      credentials: 'include',
      body: JSON.stringify({ content }),
      signal,
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') return;
    callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));
    return;
  }

  if (!response.ok) {
    const errorText = await response.text();
    callbacks.onError?.(new Error(`Server returned HTTP ${response.status}: ${errorText}`));
    return;
  }

  if (!response.body) {
    callbacks.onError?.(new Error('ReadableStream not supported or empty body'));
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;

        // Expect format: `data: {...}`
        const lines = trimmed.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const jsonStr = line.slice(5).trim();
          if (!jsonStr) continue;

          try {
            const rawJson = JSON.parse(jsonStr);
            const parsed = SseEventSchema.safeParse(rawJson);
            if (parsed.success) {
              callbacks.onEvent(parsed.data);
            } else {
              console.warn('[SSE] Event schema parse warning:', parsed.error);
            }
          } catch (e) {
            console.warn('[SSE] Failed to parse JSON:', jsonStr, e);
          }
        }
      }
    }
  } catch (err) {
    if ((err as Error).name === 'AbortError') return;
    callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));
  } finally {
    callbacks.onDone?.();
  }
}
