/**
 * LLM Adapter Interface — Sahaj AI Journey Layer
 *
 * All LLM interactions go through this interface.
 * Rules:
 * - LLM NEVER performs math. Numbers come from calculators only.
 * - Every response from LLM must be passed through OutputGuard before emission.
 * - Streaming is mandatory for user-facing text.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
  stream?: boolean;
  firstTokenTimeoutMs?: number;
  totalTimeoutMs?: number;
}

export interface CompletionResult {
  text: string;
  model: string;
  ttftMs: number;
  totalMs: number;
  inputTokens?: number;
  outputTokens?: number;
}

export interface EmbedResult {
  embedding: number[];
  model: string;
}

export interface LLMProvider {
  stream(messages: ChatMessage[], options?: CompletionOptions): AsyncGenerator<string>;
  complete(messages: ChatMessage[], options?: CompletionOptions): Promise<CompletionResult>;
  embed(text: string): Promise<EmbedResult>;
  readonly name: string;
}

export class LLMTimeoutError extends Error {
  constructor(
    public readonly phase: 'first_token' | 'total',
    public readonly elapsedMs: number,
    public readonly limitMs: number
  ) {
    super(`LLM ${phase} timeout after ${elapsedMs}ms (limit ${limitMs}ms)`);
    this.name = 'LLMTimeoutError';
  }
}

export class LLMProviderError extends Error {
  constructor(
    public readonly provider: string,
    public readonly statusCode: number | undefined,
    message: string
  ) {
    super(`[${provider}] ${message}${statusCode ? ` (HTTP ${statusCode})` : ''}`);
    this.name = 'LLMProviderError';
  }
}
