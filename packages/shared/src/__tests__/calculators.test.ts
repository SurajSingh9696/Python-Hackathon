import { describe, it, expect } from 'vitest';
import {
  emi,
  loanSummary,
  affordability,
  premiumIllustration,
} from '../calculators.js';

describe('Financial Calculators', () => {
  describe('emi() - Reducing-balance formula', () => {
    it('matches blueprint reference test: ₹2,00,000 at 10.5% for 36 months ≈ ₹6,500 (±₹2)', () => {
      const result = emi(200000, 10.5, 36);
      // Exact formula: 200000 * 0.00875 * (1.00875^36) / (1.00875^36 - 1) = 6501.62
      expect(result).toBeGreaterThanOrEqual(6498);
      expect(result).toBeLessThanOrEqual(6503);
      expect(result).toBe(6500);
    });

    it('calculates standard personal loan case: ₹1,00,000 at 12% for 12 months', () => {
      const result = emi(100000, 12, 12);
      // r = 0.01; 100000 * 0.01 * 1.01^12 / (1.01^12 - 1) = 8884.87 -> 8885
      expect(result).toBe(8885);
    });

    it('calculates larger home loan case: ₹50,00,000 at 8.5% for 240 months', () => {
      const result = emi(5000000, 8.5, 240);
      expect(result).toBe(43391);
    });

    it('handles 0% interest rate edge case (simple division)', () => {
      const result = emi(120000, 0, 12);
      expect(result).toBe(10000);
    });

    it('handles tenure = 1 month edge case', () => {
      const result = emi(10000, 12, 1);
      // 10000 * (1 + 0.12/12) = 10100
      expect(result).toBe(10100);
    });

    it('handles tenure = 0 months edge case (immediate repayment)', () => {
      const result = emi(50000, 10, 0);
      expect(result).toBe(50000);
    });

    it('handles 0 or negative principal edge case', () => {
      expect(emi(0, 10, 12)).toBe(0);
      expect(emi(-1000, 10, 12)).toBe(0);
    });
  });

  describe('loanSummary()', () => {
    it('computes complete loan breakdown with processing fee and 18% GST', () => {
      const summary = loanSummary({
        principal: 200000,
        annualRatePct: 10.5,
        tenureMonths: 36,
        processingFeePct: 1, // 1% = 2000
        gstPct: 18,
      });

      expect(summary.emiMonthly).toBe(6500);
      expect(summary.processingFee).toBe(2000);
      expect(summary.gstOnFee).toBe(360);
      expect(summary.effectiveUpfrontCost).toBe(2360);
      expect(summary.totalPayable).toBe(6500 * 36); // 234000
      expect(summary.totalInterest).toBe(234000 - 200000); // 34000
      expect(summary.label).toBe('Illustrative estimate');
    });

    it('supports flat processing fee overriding percentage', () => {
      const summary = loanSummary({
        principal: 500000,
        annualRatePct: 11,
        tenureMonths: 24,
        processingFeePct: 2,
        processingFeeFlat: 1500, // flat should win
        gstPct: 18,
      });

      expect(summary.processingFee).toBe(1500);
      expect(summary.gstOnFee).toBe(270);
      expect(summary.effectiveUpfrontCost).toBe(1770);
    });

    it('calculates education loan moratorium accrual correctly', () => {
      // 2 lakh at 10.5% with 24 months moratorium, followed by 36 months repayment
      const summary = loanSummary({
        principal: 200000,
        annualRatePct: 10.5,
        tenureMonths: 36,
        moratoriumMonths: 24,
        processingFeePct: 1,
      });

      // Simple interest during moratorium: 200000 * (10.5/100/12) * 24 = 42000
      expect(summary.moratoriumInterest).toBe(42000);
      expect(summary.grownPrincipal).toBe(242000);
      // Repayment EMI is computed on grown principal of 242000
      expect(summary.emiMonthly).toBe(emi(242000, 10.5, 36));
      expect(summary.totalPayable).toBe(summary.emiMonthly * 36 + 42000);
    });
  });

  describe('affordability()', () => {
    it('categorizes comfortable band when FOIR <= 35%', () => {
      // Income 1,00,000, existing 10,000, new EMI 15,000 -> total 25,000 (25%)
      const result = affordability(100000, 10000, 15000, 50);
      expect(result.foirPct).toBe(25);
      expect(result.band).toBe('comfortable');
      expect(result.isAffordable).toBe(true);
      expect(result.headroomMonthly).toBe(25000); // 50,000 - 25,000
      expect(result.label).toBe('Illustrative estimate');
    });

    it('categorizes stretched band when 35% < FOIR <= maxFoirPct', () => {
      // Income 1,00,000, existing 20,000, new EMI 25,000 -> total 45,000 (45%)
      const result = affordability(100000, 20000, 25000, 50);
      expect(result.foirPct).toBe(45);
      expect(result.band).toBe('stretched');
      expect(result.isAffordable).toBe(true);
      expect(result.headroomMonthly).toBe(5000); // 50,000 - 45,000
    });

    it('categorizes high band and flags unaffordable when FOIR > maxFoirPct', () => {
      // Income 50,000, existing 15,000, new EMI 20,000 -> total 35,000 (70%)
      const result = affordability(50000, 15000, 20000, 50);
      expect(result.foirPct).toBe(70);
      expect(result.band).toBe('high');
      expect(result.isAffordable).toBe(false);
      expect(result.headroomMonthly).toBe(0);
    });

    it('handles zero or negative income gracefully', () => {
      const result = affordability(0, 5000, 5000, 50);
      expect(result.foirPct).toBe(100);
      expect(result.band).toBe('high');
      expect(result.isAffordable).toBe(false);
      expect(result.headroomMonthly).toBe(0);
    });
  });

  describe('premiumIllustration()', () => {
    it('returns table-driven premium for basic health plan (18-35 age)', () => {
      const illustration = premiumIllustration({
        planId: 'health-basic',
        ageBand: '18-35',
        coverAmountLakh: 5,
        membersCount: 1,
      });

      expect(illustration.annualPremium).toBe(8000);
      expect(illustration.monthlyPremium).toBe(Math.round(8000 / 12));
      expect(illustration.label).toBe('Illustrative estimate');
    });

    it('scales premium proportionally for higher coverage and multiple members', () => {
      const illustration = premiumIllustration({
        planId: 'health-basic',
        ageBand: '18-35',
        coverAmountLakh: 10, // 2x cover multiplier
        membersCount: 3,     // 1 + 2 * 0.4 = 1.8x member multiplier
      });

      // 8000 * 2 * 1.8 = 28800
      expect(illustration.annualPremium).toBe(28800);
    });

    it('handles fallback for unknown plans smoothly', () => {
      const illustration = premiumIllustration({
        planId: 'unknown-plan',
        ageBand: '18-35',
        coverAmountLakh: 5,
        membersCount: 1,
      });

      expect(illustration.annualPremium).toBe(10000);
    });
  });
});
