import { describe, it, expect } from 'vitest';

describe('Web App Smoke Test', () => {
  it('loads environment and shared workspace package', async () => {
    const { formatINR, STATE_LABELS_EN } = await import('@sahaj/shared');
    expect(formatINR(200000)).toContain('2,00,000');
    expect(STATE_LABELS_EN.NEW).toBe('Getting started');
  });
});
