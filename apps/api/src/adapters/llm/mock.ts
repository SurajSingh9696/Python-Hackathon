/**
 * Mock LLM Adapter — deterministic in-memory responses for tests and demo mode.
 * Never calls external APIs. Always returns within 100ms.
 */
import type { ChatMessage, CompletionOptions, CompletionResult, EmbedResult, LLMProvider } from './types.js';

/** Canned responses keyed by rough intent heuristic */
const CANNED: Record<string, string> = {
  clarify_amount:
    'To help you find the right loan, could you share the approximate amount you need?',
  clarify_income:
    'What is your approximate monthly take-home income? This helps us calculate an accurate EMI.',
  clarify_tenure:
    'How many months would you prefer for repayment — 24, 36, or 48 months?',
  compare:
    'Based on your profile, Scholar Prime offers the lowest rate (9.5%) with a 24-month moratorium. EduFlex is faster to disburse with no co-applicant needed. Merit Premier suits larger amounts with Section 80E tax benefits.',
  default:
    'I understand. Let me help you explore the best financial options for your needs.',
};

function pickCanned(messages: ChatMessage[]): string {
  const systemPrompt = messages.find((m) => m.role === 'system')?.content ?? '';
  const last = messages[messages.length - 1]?.content ?? '';
  const lower = last.toLowerCase();

  // If called by intent classifier service, return valid JSON
  if (systemPrompt.includes('intent classifier') || lower.includes('classify the user message')) {
    if (lower.includes('insurance') || lower.includes('bima') || lower.includes('policy')) {
      return JSON.stringify({ domain: 'insurance', purpose: 'health', confidence: 0.9 });
    }
    if (lower.includes('education') || lower.includes('college') || lower.includes('padhai')) {
      return JSON.stringify({ domain: 'lending', purpose: 'education', confidence: 0.95 });
    }
    return JSON.stringify({ domain: 'lending', purpose: 'personal', confidence: 0.85 });
  }

  if (lower.includes('amount') || lower.includes('kitna') || lower.includes('how much')) return CANNED['clarify_amount']!;
  if (lower.includes('income') || lower.includes('salary') || lower.includes('aay')) return CANNED['clarify_income']!;
  if (lower.includes('tenure') || lower.includes('months') || lower.includes('kitne mahine')) return CANNED['clarify_tenure']!;
  if (lower.includes('compare') || lower.includes('best') || lower.includes('kaunsa')) return CANNED['compare']!;
  return CANNED['default']!;
}

export class MockLLMAdapter implements LLMProvider {
  readonly name = 'mock';

  async *stream(messages: ChatMessage[], _options?: CompletionOptions): AsyncGenerator<string> {
    const text = pickCanned(messages);
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
      await new Promise((r) => setTimeout(r, 8));
      yield (i === 0 ? '' : ' ') + words[i]!;
    }
  }

  async complete(messages: ChatMessage[], _options?: CompletionOptions): Promise<CompletionResult> {
    const t0 = Date.now();
    const text = pickCanned(messages);
    await new Promise((r) => setTimeout(r, 20));
    const totalMs = Date.now() - t0;
    return { text, model: 'mock-1.0', ttftMs: 8, totalMs };
  }

  async embed(_text: string): Promise<EmbedResult> {
    return { embedding: new Array(768).fill(0) as number[], model: 'mock-embed-1.0' };
  }
}
