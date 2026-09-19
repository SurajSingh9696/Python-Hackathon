import { describe, it, expect } from 'vitest';
import { t, DICTIONARY } from '../lib/i18n';

describe('i18n translation dictionary', () => {
  it('translates common keys across en, hi, hinglish', () => {
    expect(t('common', 'brandName', 'en')).toBe('Sahaj');
    expect(t('common', 'brandName', 'hi')).toBe('सहज');
    expect(t('common', 'brandName', 'hinglish')).toBe('Sahaj');

    expect(t('common', 'send', 'hi')).toBe('भेजें');
    expect(t('common', 'send', 'en')).toBe('Send');
  });

  it('translates financial terms (moratorium, foir, reducing_rate)', () => {
    expect(DICTIONARY.terms.moratorium.title.en).toBe('Moratorium Period');
    expect(DICTIONARY.terms.moratorium.title.hi).toBe('मोरेटोरियम अवधि');
    expect(DICTIONARY.terms.foir.title.en).toContain('FOIR');
  });

  it('falls back to key if section or key is missing', () => {
    // @ts-expect-error testing invalid section
    expect(t('unknown_section', 'some_key', 'en')).toBe('some_key');
  });
});
