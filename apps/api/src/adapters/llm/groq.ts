/**
 * Groq LLM Adapter
 *
 * Uses the OpenAI-compatible /chat/completions endpoint at api.groq.com.
 * Models:
 *   - llama-3.3-70b-versatile  (primary, for intent + guided answers)
 *   - qwen-qwq-32b-preview     (reasoning model for complex comparisons)
 *   - llama-3.1-8b-instant     (fast, for intent classification only)
 *
 * Streaming uses SSE from Groq's API, forwarded as yielded string deltas.
 * First-token timeout (default 4000ms) throws LLMTimeoutError.
 */
import type { ChatMessage, CompletionOptions, CompletionResult, EmbedResult, LLMProvider } from './types.js';
import { LLMTimeoutError, LLMProviderError } from './types.js';

interface GroqConfig {
  apiKey: string;
  baseUrl: string;
  primaryModel: string;
  fastModel: string;
  reasoningModel: string;
  defaultMaxTokens: number;
  defaultTemperature: number;
  firstTokenTimeoutMs: number;
  totalTimeoutMs: number;
}

export class GroqAdapter implements LLMProvider {
  readonly name = 'groq';

  constructor(private readonly cfg: GroqConfig) {}

  async *stream(messages: ChatMessage[], options?: CompletionOptions): AsyncGenerator<string> {
    const model = options?.model ?? this.cfg.primaryModel;
    const firstTokenMs = options?.firstTokenTimeoutMs ?? this.cfg.firstTokenTimeoutMs;
    const totalMs = options?.totalTimeoutMs ?? this.cfg.totalTimeoutMs;
    const t0 = Date.now();

    const abortCtrl = new AbortController();
    const totalTimer = setTimeout(() => abortCtrl.abort(), totalMs);

    let response: Response;
    try {
      response = await fetch(`${this.cfg.baseUrl}/chat/completions`, {
        method: 'POST',
        signal: abortCtrl.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.cfg.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options?.temperature ?? this.cfg.defaultTemperature,
          max_tokens: options?.maxTokens ?? this.cfg.defaultMaxTokens,
          stream: true,
        }),
      });
    } catch (err) {
      clearTimeout(totalTimer);
      if ((err as Error).name === 'AbortError') {
        throw new LLMTimeoutError('total', Date.now() - t0, totalMs);
      }
      throw err;
    }

    if (!response.ok) {
      clearTimeout(totalTimer);
      const body = await response.text();
      throw new LLMProviderError('groq', response.status, body.slice(0, 200));
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let firstTokenReceived = false;
    let buffer = '';

    const firstTokenTimer = setTimeout(() => {
      if (!firstTokenReceived) {
        abortCtrl.abort();
      }
    }, firstTokenMs);

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (data === '[DONE]') return;

          let parsed: { choices?: Array<{ delta?: { content?: string } }> };
          try {
            parsed = JSON.parse(data) as typeof parsed;
          } catch {
            continue;
          }

          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            if (!firstTokenReceived) {
              firstTokenReceived = true;
              clearTimeout(firstTokenTimer);
            }
            yield delta;
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        if (!firstTokenReceived) {
          throw new LLMTimeoutError('first_token', Date.now() - t0, firstTokenMs);
        }
        throw new LLMTimeoutError('total', Date.now() - t0, totalMs);
      }
      throw err;
    } finally {
      clearTimeout(totalTimer);
      clearTimeout(firstTokenTimer);
    }
  }

  async complete(messages: ChatMessage[], options?: CompletionOptions): Promise<CompletionResult> {
    const model = options?.model ?? this.cfg.primaryModel;
    const t0 = Date.now();
    let ttftMs = 0;
    let text = '';

    for await (const delta of this.stream(messages, { ...options, model, stream: true })) {
      if (ttftMs === 0) ttftMs = Date.now() - t0;
      text += delta;
    }

    return { text, model, ttftMs, totalMs: Date.now() - t0 };
  }

  async embed(_text: string): Promise<EmbedResult> {
    // Groq does not offer an embedding endpoint; fall back to zero vector
    return { embedding: new Array(768).fill(0) as number[], model: 'groq-no-embed' };
  }
}
