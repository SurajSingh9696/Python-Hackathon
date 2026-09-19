import { describe, it, expect } from 'vitest';
import {
  formatINR,
  formatINRTabular,
  formatPct,
  formatTenure,
  abbreviateINR,
} from '../format.js';

describe('Formatting Utilities', () => {
  describe('formatINR() & formatINRTabular()', () => {
    it('formats numbers to Indian Rupee notation', () => {
      const res = formatINR(200000);
      expect(res).toContain('2,00,000');
      expect(res).toContain('₹');
    });

    it('formats tabular numbers consistently', () => {
      const res = formatINRTabular(50000);
      expect(res).toContain('50,000');
    });
  });

  describe('formatPct()', () => {
    it('formats percentage with specified decimal places', () => {
      expect(formatPct(10.5)).toBe('10.5%');
      expect(formatPct(10.556, 2)).toBe('10.56%');
      expect(formatPct(12, 0)).toBe('12%');
    });
  });

  describe('formatTenure()', () => {
    it('formats months < 12 as months', () => {
      expect(formatTenure(1)).toBe('1 month');
      expect(formatTenure(6)).toBe('6 months');
      expect(formatTenure(11)).toBe('11 months');
    });

    it('formats whole years cleanly', () => {
      expect(formatTenure(12)).toBe('1 year');
      expect(formatTenure(24)).toBe('2 years');
      expect(formatTenure(36)).toBe('3 years');
    });

    it('formats mixed years and months', () => {
      expect(formatTenure(18)).toBe('1 yr 6 mo');
      expect(formatTenure(40)).toBe('3 yr 4 mo');
    });
  });

  describe('abbreviateINR()', () => {
    it('abbreviates values in Crores', () => {
      expect(abbreviateINR(10000000)).toBe('₹1Cr');
      expect(abbreviateINR(25000000)).toBe('₹2.5Cr');
    });

    it('abbreviates values in Lakhs', () => {
      expect(abbreviateINR(200000)).toBe('₹2L');
      expect(abbreviateINR(250000)).toBe('₹2.5L');
    });

    it('abbreviates values in Thousands', () => {
      expect(abbreviateINR(50000)).toBe('₹50K');
      expect(abbreviateINR(5500)).toBe('₹5.5K');
    });

    it('retains exact amount for values under 1,000', () => {
      expect(abbreviateINR(500)).toBe('₹500');
    });
  });
});
