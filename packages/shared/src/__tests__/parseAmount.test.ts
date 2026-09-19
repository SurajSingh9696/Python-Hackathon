import { describe, it, expect } from 'vitest';
import { parseAmount } from '../parseAmount.js';

describe('Amount Parser (parseAmount)', () => {
  describe('English numerical & short forms', () => {
    it('parses "200000"', () => {
      const res = parseAmount('200000');
      expect(res).not.toBeNull();
      expect(res?.value).toBe(200000);
    });

    it('parses "₹2,00,000"', () => {
      const res = parseAmount('₹2,00,000');
      expect(res).not.toBeNull();
      expect(res?.value).toBe(200000);
    });

    it('parses "2,00,000"', () => {
      const res = parseAmount('2,00,000');
      expect(res).not.toBeNull();
      expect(res?.value).toBe(200000);
    });

    it('parses "2L"', () => {
      const res = parseAmount('2L');
      expect(res).not.toBeNull();
      expect(res?.value).toBe(200000);
    });

    it('parses "2l"', () => {
      const res = parseAmount('2l');
      expect(res?.value).toBe(200000);
    });

    it('parses "2.5L"', () => {
      const res = parseAmount('2.5L');
      expect(res?.value).toBe(250000);
    });

    it('parses "2 lakh"', () => {
      const res = parseAmount('2 lakh');
      expect(res?.value).toBe(200000);
    });

    it('parses "2 lac"', () => {
      const res = parseAmount('2 lac');
      expect(res?.value).toBe(200000);
    });

    it('parses "2.5 lakh"', () => {
      const res = parseAmount('2.5 lakh');
      expect(res?.value).toBe(250000);
    });

    it('parses "1 crore"', () => {
      const res = parseAmount('1 crore');
      expect(res?.value).toBe(10000000);
    });

    it('parses "1cr"', () => {
      const res = parseAmount('1cr');
      expect(res?.value).toBe(10000000);
    });

    it('parses "1.5 crore"', () => {
      const res = parseAmount('1.5 crore');
      expect(res?.value).toBe(15000000);
    });

    it('parses "50k"', () => {
      const res = parseAmount('50k');
      expect(res?.value).toBe(50000);
    });

    it('parses "50 thousand"', () => {
      const res = parseAmount('50 thousand');
      expect(res?.value).toBe(50000);
    });

    it('parses "twenty thousand"', () => {
      const res = parseAmount('twenty thousand');
      expect(res?.value).toBe(20000);
    });

    it('parses "five lakh"', () => {
      const res = parseAmount('five lakh');
      expect(res?.value).toBe(500000);
    });
  });

  describe('Hinglish phrases', () => {
    it('parses "do lakh"', () => {
      const res = parseAmount('do lakh');
      expect(res?.value).toBe(200000);
    });

    it('parses "teen lakh"', () => {
      const res = parseAmount('teen lakh');
      expect(res?.value).toBe(300000);
    });

    it('parses "char lakh"', () => {
      const res = parseAmount('char lakh');
      expect(res?.value).toBe(400000);
    });

    it('parses "paanch lakh"', () => {
      const res = parseAmount('paanch lakh');
      expect(res?.value).toBe(500000);
    });

    it('parses "das lakh"', () => {
      const res = parseAmount('das lakh');
      expect(res?.value).toBe(1000000);
    });

    it('parses "ek crore"', () => {
      const res = parseAmount('ek crore');
      expect(res?.value).toBe(10000000);
    });

    it('parses "50 hazaar"', () => {
      const res = parseAmount('50 hazaar');
      expect(res?.value).toBe(50000);
    });

    it('parses "tees hazaar"', () => {
      const res = parseAmount('tees hazaar');
      expect(res?.value).toBe(30000);
    });

    it('parses "dhaai lakh"', () => {
      const res = parseAmount('dhaai lakh');
      expect(res?.value).toBe(250000);
    });

    it('parses "dedh lakh"', () => {
      const res = parseAmount('dedh lakh');
      expect(res?.value).toBe(150000);
    });

    it('parses "saade teen lakh"', () => {
      const res = parseAmount('saade teen lakh');
      expect(res?.value).toBe(350000);
    });

    it('parses "saade do lakh"', () => {
      const res = parseAmount('saade do lakh');
      expect(res?.value).toBe(250000);
    });
  });

  describe('Hindi (Devanagari script)', () => {
    it('parses "दो लाख"', () => {
      const res = parseAmount('दो लाख');
      expect(res?.value).toBe(200000);
    });

    it('parses "२ लाख" (Devanagari digit)', () => {
      const res = parseAmount('२ लाख');
      expect(res?.value).toBe(200000);
    });

    it('parses "डेढ़ लाख"', () => {
      const res = parseAmount('डेढ़ लाख');
      expect(res?.value).toBe(150000);
    });

    it('parses "ढाई लाख"', () => {
      const res = parseAmount('ढाई लाख');
      expect(res?.value).toBe(250000);
    });

    it('parses "साढ़े तीन लाख"', () => {
      const res = parseAmount('साढ़े तीन लाख');
      expect(res?.value).toBe(350000);
    });

    it('parses "तीन लाख"', () => {
      const res = parseAmount('तीन लाख');
      expect(res?.value).toBe(300000);
    });

    it('parses "पाँच लाख"', () => {
      const res = parseAmount('पाँच लाख');
      expect(res?.value).toBe(500000);
    });

    it('parses "एक करोड़"', () => {
      const res = parseAmount('एक करोड़');
      expect(res?.value).toBe(10000000);
    });

    it('parses "५० हजार"', () => {
      const res = parseAmount('५० हजार');
      expect(res?.value).toBe(50000);
    });

    it('parses "बीस हजार"', () => {
      const res = parseAmount('बीस हजार');
      expect(res?.value).toBe(20000);
    });
  });

  describe('Invalid and edge-case inputs', () => {
    it('returns null for empty string or null/undefined', () => {
      expect(parseAmount('')).toBeNull();
      // @ts-expect-error testing null input
      expect(parseAmount(null)).toBeNull();
      // @ts-expect-error testing undefined input
      expect(parseAmount(undefined)).toBeNull();
    });

    it('returns null for purely non-numerical text', () => {
      expect(parseAmount('hello world')).toBeNull();
      expect(parseAmount('random test message')).toBeNull();
    });
  });
});
