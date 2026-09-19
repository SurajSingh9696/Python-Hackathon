import { describe, it, expect } from 'vitest';
import {
  JourneyStateSchema,
  JourneyDomainSchema,
  LanguageSchema,
  LendingProfileSchema,
  InsuranceProfileSchema,
  JourneySchema,
  CreateJourneySchema,
  SendMessageSchema,
  FeedbackSchema,
  LoanProductSchema,
  InsurancePlanSchema,
  SseStatusSchema,
  SseIntentSchema,
  SseProfileUpdateSchema,
  SseTokenSchema,
  SseAffordabilitySchema,
  SseChecklistSchema,
  SseJourneyStateSchema,
  SseCitationsSchema,
  SseTraceSchema,
  SseEscalationSchema,
  SseDoneSchema,
  SseErrorSchema,
  SseCardsSchema,
  SseEventSchema,
} from '../schemas.js';

describe('Shared Zod Schemas', () => {
  describe('Primitives and Enums', () => {
    it('validates journey state enum', () => {
      expect(JourneyStateSchema.safeParse('NEW').success).toBe(true);
      expect(JourneyStateSchema.safeParse('OPTIONS_READY').success).toBe(true);
      expect(JourneyStateSchema.safeParse('INVALID_STATE').success).toBe(false);
    });

    it('validates domain and language enums', () => {
      expect(JourneyDomainSchema.safeParse('lending').success).toBe(true);
      expect(JourneyDomainSchema.safeParse('insurance').success).toBe(true);
      expect(JourneyDomainSchema.safeParse('general').success).toBe(true);
      expect(JourneyDomainSchema.safeParse('crypto').success).toBe(false);

      expect(LanguageSchema.safeParse('en').success).toBe(true);
      expect(LanguageSchema.safeParse('hi').success).toBe(true);
      expect(LanguageSchema.safeParse('hinglish').success).toBe(true);
      expect(LanguageSchema.safeParse('es').success).toBe(false);
    });
  });

  describe('Financial Profiles', () => {
    it('validates valid lending profile', () => {
      const valid = {
        purpose: 'education',
        amount: 200000,
        monthly_income: 40000,
        existing_obligations_monthly: 5000,
        tenure_months_pref: 36,
        employment_type: 'salaried',
      };
      const res = LendingProfileSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it('validates valid insurance profile', () => {
      const valid = {
        insurance_type: 'health',
        age_band: '18-35',
        members_to_cover: 2,
        coverage_pref: 500000,
        pre_existing_conditions: 'no',
      };
      const res = InsuranceProfileSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });
  });

  describe('API Payloads', () => {
    it('validates CreateJourneySchema with defaults', () => {
      const res = CreateJourneySchema.safeParse({});
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.language).toBe('en');
      }
    });

    it('validates SendMessageSchema constraints', () => {
      expect(SendMessageSchema.safeParse({ content: '' }).success).toBe(false);
      expect(SendMessageSchema.safeParse({ content: 'Hello Sahaj' }).success).toBe(true);
    });

    it('validates FeedbackSchema', () => {
      expect(FeedbackSchema.safeParse({ messageId: '123', vote: 'up' }).success).toBe(true);
      expect(FeedbackSchema.safeParse({ messageId: '123', vote: 'invalid' }).success).toBe(false);
    });
  });

  describe('Products', () => {
    it('validates LoanProductSchema', () => {
      const product = {
        id: 'edu-loan-1',
        name: 'Scholar Prime Education Loan',
        domain: 'lending',
        purpose: ['education'],
        minAmount: 50000,
        maxAmount: 2000000,
        annualRateMin: 9.5,
        annualRateMax: 11.5,
        tenureMinMonths: 12,
        tenureMaxMonths: 84,
        processingFeePct: 1,
        processingFeeFlat: 0,
        gstPct: 18,
        maxFoirPct: 50,
        moratoriumAvailable: true,
        moratoriumMaxMonths: 36,
        collateralRequired: false,
        coApplicantRequired: true,
        keyConditions: ['Student admission confirmed'],
        documentsRequired: ['Admission Letter', 'Salary Slip'],
        source: {
          source: 'Demo Bank Policy Doc v2.1',
          provider: 'Demo Provider',
          version: '2.1',
          effectiveDate: '2026-01-01',
          synthetic: true,
        },
      };
      expect(LoanProductSchema.safeParse(product).success).toBe(true);
    });

    it('validates InsurancePlanSchema', () => {
      const plan = {
        id: 'health-plan-1',
        name: 'Arogya Shield Health Plan',
        domain: 'insurance',
        type: 'health',
        minSumInsuredLakh: 5,
        maxSumInsuredLakh: 25,
        waitingPeriodDays: 30,
        coPay: false,
        coPayPct: 0,
        keyConditions: ['Cashless treatment at network hospitals'],
        source: {
          source: 'Demo Health Guidelines v1.0',
          provider: 'Demo Provider',
          version: '1.0',
          effectiveDate: '2026-01-01',
          synthetic: true,
        },
      };
      expect(InsurancePlanSchema.safeParse(plan).success).toBe(true);
    });
  });

  describe('SSE Events', () => {
    it('validates SseStatusSchema', () => {
      const evt = { type: 'status', stage: 'understanding', message: 'Analyzing goal' };
      expect(SseStatusSchema.safeParse(evt).success).toBe(true);
      expect(SseEventSchema.safeParse(evt).success).toBe(true);
    });

    it('validates SseIntentSchema', () => {
      const evt = {
        type: 'intent',
        domain: 'lending',
        confidence: 0.95,
        entities: { amount: 200000, purpose: 'education' },
      };
      expect(SseIntentSchema.safeParse(evt).success).toBe(true);
      expect(SseEventSchema.safeParse(evt).success).toBe(true);
    });

    it('validates SseAffordabilitySchema', () => {
      const evt = {
        type: 'affordability',
        foirPct: 35,
        headroomMonthly: 15000,
        band: 'comfortable',
        isAffordable: true,
        label: 'Illustrative estimate',
        assumptions: {
          income: 50000,
          existingEmi: 5000,
          newEmi: 12500,
          rate: 10.5,
          tenure: 36,
          maxFoirPct: 50,
        },
      };
      expect(SseAffordabilitySchema.safeParse(evt).success).toBe(true);
      expect(SseEventSchema.safeParse(evt).success).toBe(true);
    });

    it('validates SseJourneyStateSchema', () => {
      const evt = {
        type: 'journey_state',
        state: 'OPTIONS_READY',
        progress: 0.65,
        label: 'Options ready to compare',
      };
      expect(SseJourneyStateSchema.safeParse(evt).success).toBe(true);
      expect(SseEventSchema.safeParse(evt).success).toBe(true);
    });

    it('validates SseDoneSchema with timings', () => {
      const evt = {
        type: 'done',
        messageId: 'msg-1',
        timings: {
          totalMs: 450,
          ttftMs: 120,
          retrievalMs: 80,
          calcMs: 10,
          llmMs: 240,
        },
      };
      expect(SseDoneSchema.safeParse(evt).success).toBe(true);
      expect(SseEventSchema.safeParse(evt).success).toBe(true);
    });
  });
});
