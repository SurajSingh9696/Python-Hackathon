/**
 * Intent Classification Service Tests — Phase 4
 */
import { describe, it, expect } from 'vitest';
import { MockLLMAdapter } from '../adapters/llm/mock.js';
import { classifyIntent } from '../services/intentService.js';

const mockLLM = new MockLLMAdapter();

describe('classifyIntent', () => {
  it('classifies education loan in English', async () => {
    const result = await classifyIntent('I need an education loan of 2 lakh', mockLLM);
    expect(result.domain).toBe('lending');
    expect(result.purpose).toBe('education');
    expect(result.classifiedBy).toBe('rules');
    expect(result.confidence).toBeGreaterThanOrEqual(0.75);
  });

  it('classifies insurance in Hinglish', async () => {
    const result = await classifyIntent('Mujhe health insurance chahiye', mockLLM);
    expect(result.domain).toBe('insurance');
    expect(result.language).toBe('hinglish');
  });

  it('detects Devanagari as Hindi', async () => {
    const result = await classifyIntent('मुझे शिक्षा ऋण चाहिए', mockLLM);
    expect(result.language).toBe('hi');
    expect(result.domain).toBe('lending');
  });

  it('detects escalation trigger', async () => {
    const result = await classifyIntent('I want to file a fraud complaint', mockLLM);
    expect(result.requiresEscalation).toBe(true);
    expect(result.escalationReason).toBeDefined();
  });

  it('parses amount from text', async () => {
    const result = await classifyIntent('I need a loan of 3 lakh for my college fees', mockLLM);
    expect(result.amount).toBe(300_000);
  });
});
