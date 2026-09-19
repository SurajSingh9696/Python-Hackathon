/**
 * LLM Adapter Tests — Phase 4
 * Tests MockLLMAdapter (no external calls) and GroqAdapter interface.
 */
import { describe, it, expect } from 'vitest';
import { MockLLMAdapter } from '../adapters/llm/mock.js';

const mock = new MockLLMAdapter();

describe('MockLLMAdapter', () => {
  it('streams tokens for income question', async () => {
    const tokens: string[] = [];
    for await (const delta of mock.stream([{ role: 'user', content: 'What is my monthly income?' }])) {
      tokens.push(delta);
    }
    const text = tokens.join('');
    expect(text.length).toBeGreaterThan(10);
    expect(text.toLowerCase()).toMatch(/income|salary/);
  });

  it('complete() returns result with model name', async () => {
    const result = await mock.complete([{ role: 'user', content: 'compare loans' }]);
    expect(result.model).toBe('mock-1.0');
    expect(result.text).toBeTruthy();
    expect(result.ttftMs).toBeGreaterThan(0);
    expect(result.totalMs).toBeGreaterThanOrEqual(result.ttftMs);
  });

  it('embed() returns 768-dim vector', async () => {
    const result = await mock.embed('education loan India');
    expect(result.embedding).toHaveLength(768);
    expect(result.embedding.every((v) => v === 0)).toBe(true); // mock zeros
  });

  it('completes within 150ms', async () => {
    const t0 = Date.now();
    await mock.complete([{ role: 'user', content: 'hello' }]);
    expect(Date.now() - t0).toBeLessThan(150);
  });
});
