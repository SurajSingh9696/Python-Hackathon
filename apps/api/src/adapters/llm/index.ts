/**
 * LLM adapter factory and singleton.
 * Reads LLM_ADAPTER env to choose: mock | groq | openai-compatible
 */
import { getConfig } from '../../config/env.js';
import { MockLLMAdapter } from './mock.js';
import { GroqAdapter } from './groq.js';
import type { LLMProvider } from './types.js';

export type { LLMProvider, ChatMessage, CompletionOptions, CompletionResult, EmbedResult } from './types.js';
export { LLMTimeoutError, LLMProviderError } from './types.js';
export { MockLLMAdapter } from './mock.js';
export { GroqAdapter } from './groq.js';

let _llm: LLMProvider | null = null;

export function createLLMProvider(): LLMProvider {
  if (_llm) return _llm;
  const config = getConfig();

  switch (config.LLM_ADAPTER) {
    case 'groq': {
      if (!config.GROQ_API_KEY) {
        console.warn('[LLM] GROQ_API_KEY not set, falling back to mock');
        _llm = new MockLLMAdapter();
        break;
      }
      _llm = new GroqAdapter({
        apiKey: config.GROQ_API_KEY,
        baseUrl: config.GROQ_BASE_URL,
        primaryModel: config.GROQ_MODEL_PRIMARY,
        fastModel: config.GROQ_MODEL_FAST,
        reasoningModel: config.GROQ_MODEL_REASONING,
        defaultMaxTokens: config.GROQ_MAX_TOKENS,
        defaultTemperature: config.GROQ_TEMPERATURE,
        firstTokenTimeoutMs: config.LLM_FIRST_TOKEN_TIMEOUT_MS,
        totalTimeoutMs: config.LLM_TOTAL_TIMEOUT_MS,
      });
      break;
    }
    default:
      _llm = new MockLLMAdapter();
  }

  return _llm;
}

/** Singleton accessor */
export function getLLMProvider(): LLMProvider {
  return createLLMProvider();
}

/** Reset singleton (for tests) */
export function _resetLLMProvider(): void {
  _llm = null;
}
