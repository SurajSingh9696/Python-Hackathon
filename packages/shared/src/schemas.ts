/**
 * Zod schemas — single source of truth for all API payloads and SSE events.
 * Both apps/web and apps/api import from here so types can never drift.
 */
import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// COMMON PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

export const ObjectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId');

export const JourneyStateSchema = z.enum([
  'NEW',
  'INTENT_CAPTURED',
  'PROFILE_INCOMPLETE',
  'PROFILE_READY',
  'KNOWLEDGE_RETRIEVED',
  'OPTIONS_READY',
  'DOCUMENTS_PENDING',
  'APPLICATION_GUIDANCE',
  'FOLLOW_UP',
]);

export const JourneyDomainSchema = z.enum(['lending', 'insurance', 'general']);

export const LanguageSchema = z.enum(['en', 'hi', 'hinglish']);

// ─────────────────────────────────────────────────────────────────────────────
// FINANCIAL PROFILE
// ─────────────────────────────────────────────────────────────────────────────

export const LendingProfileSchema = z.object({
  purpose: z.enum(['education', 'personal', 'home', 'vehicle', 'business', 'other']).optional(),
  amount: z.number().positive().optional(),
  monthly_income: z.number().positive().optional(),
  existing_obligations_monthly: z.number().min(0).optional(),
  tenure_months_pref: z.number().int().positive().optional(),
  employment_type: z.enum(['salaried', 'self_employed', 'student', 'other']).optional(),
});

export const InsuranceProfileSchema = z.object({
  insurance_type: z.enum(['health', 'term', 'other']).optional(),
  age_band: z.enum(['18-35', '36-45', '46-55', '56-65', '65+']).optional(),
  members_to_cover: z.number().int().positive().optional(),
  coverage_pref: z.number().positive().optional(),
  budget_pref: z.number().positive().optional(),
  pre_existing_conditions: z.enum(['yes', 'no', 'prefer_not_to_say']).optional(),
});

export const FinancialProfileSchema = z.discriminatedUnion('domain', [
  z.object({ domain: z.literal('lending') }).merge(LendingProfileSchema),
  z.object({ domain: z.literal('insurance') }).merge(InsuranceProfileSchema),
  z.object({ domain: z.literal('general') }),
]);

export type FinancialProfile = z.infer<typeof FinancialProfileSchema>;
export type LendingProfile = z.infer<typeof LendingProfileSchema>;
export type InsuranceProfile = z.infer<typeof InsuranceProfileSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// JOURNEY
// ─────────────────────────────────────────────────────────────────────────────

export const JourneySchema = z.object({
  id: ObjectIdSchema,
  userId: ObjectIdSchema,
  state: JourneyStateSchema,
  domain: JourneyDomainSchema,
  language: LanguageSchema.default('en'),
  profile: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  title: z.string().optional(), // e.g. "₹2L Education Loan"
});

export type Journey = z.infer<typeof JourneySchema>;

// ─────────────────────────────────────────────────────────────────────────────
// API PAYLOADS — REQUESTS
// ─────────────────────────────────────────────────────────────────────────────

export const CreateJourneySchema = z.object({
  language: LanguageSchema.optional().default('en'),
});

export const SendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  language: LanguageSchema.optional(),
  voiceInputUrl: z.string().url().optional(),
});

export const UpdateProfileSchema = z.record(z.string(), z.unknown());

export const FeedbackSchema = z.object({
  messageId: z.string(),
  vote: z.enum(['up', 'down']),
  comment: z.string().max(500).optional(),
});

export const ConsentSchema = z.object({
  dataProcessing: z.boolean(),
  aiAnalysis: z.boolean(),
  timestamp: z.string().datetime(),
});

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT (from knowledge / product connector)
// ─────────────────────────────────────────────────────────────────────────────

export const SourceMetaSchema = z.object({
  source: z.string(),
  provider: z.string().default('Demo Provider'),
  version: z.string(),
  effectiveDate: z.string(),
  synthetic: z.boolean().default(true),
});

export const LoanProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  domain: z.literal('lending'),
  purpose: z.array(z.string()),
  minAmount: z.number(),
  maxAmount: z.number(),
  annualRateMin: z.number(),
  annualRateMax: z.number(),
  tenureMinMonths: z.number().int(),
  tenureMaxMonths: z.number().int(),
  processingFeePct: z.number().default(0),
  processingFeeFlat: z.number().default(0),
  gstPct: z.number().default(18),
  maxFoirPct: z.number().default(50),
  moratoriumAvailable: z.boolean().default(false),
  moratoriumMaxMonths: z.number().int().default(0),
  collateralRequired: z.boolean().default(false),
  coApplicantRequired: z.boolean().default(false),
  keyConditions: z.array(z.string()),
  documentsRequired: z.array(z.string()),
  source: SourceMetaSchema,
});

export const InsurancePlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  domain: z.literal('insurance'),
  type: z.enum(['health', 'term', 'other']),
  minSumInsuredLakh: z.number(),
  maxSumInsuredLakh: z.number(),
  waitingPeriodDays: z.number().int().default(30),
  coPay: z.boolean().default(false),
  coPayPct: z.number().default(0),
  keyConditions: z.array(z.string()),
  source: SourceMetaSchema,
});

export type LoanProduct = z.infer<typeof LoanProductSchema>;
export type InsurancePlan = z.infer<typeof InsurancePlanSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// SSE EVENT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export const SseStatusSchema = z.object({
  type: z.literal('status'),
  stage: z.enum([
    'understanding',
    'retrieving',
    'calculating',
    'comparing',
    'generating',
    'done',
  ]),
  message: z.string().optional(),
});

export const SseIntentSchema = z.object({
  type: z.literal('intent'),
  domain: JourneyDomainSchema,
  confidence: z.number().min(0).max(1),
  entities: z.object({
    amount: z.number().optional(),
    purpose: z.string().optional(),
    insuranceType: z.string().optional(),
    language: LanguageSchema.optional(),
  }),
});

export const SseProfileUpdateSchema = z.object({
  type: z.literal('profile_update'),
  fields: z.record(z.string(), z.unknown()),
  missingFields: z.array(z.string()),
});

export const SseTokenSchema = z.object({
  type: z.literal('token'),
  delta: z.string(),
});

export const SseAffordabilitySchema = z.object({
  type: z.literal('affordability'),
  foirPct: z.number(),
  headroomMonthly: z.number(),
  band: z.enum(['comfortable', 'stretched', 'high']),
  isAffordable: z.boolean(),
  label: z.literal('Illustrative estimate'),
  assumptions: z.object({
    income: z.number(),
    existingEmi: z.number(),
    newEmi: z.number(),
    rate: z.number(),
    tenure: z.number(),
    maxFoirPct: z.number(),
  }),
});

export const SseChecklistSchema = z.object({
  type: z.literal('checklist'),
  items: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      labelHi: z.string().optional(),
      status: z.enum(['needed', 'uploading', 'reading', 'review_needed', 'verified']),
      mandatory: z.boolean(),
    })
  ),
});

export const SseJourneyStateSchema = z.object({
  type: z.literal('journey_state'),
  state: JourneyStateSchema,
  progress: z.number().min(0).max(1),
  label: z.string(),
  missingFields: z.array(z.string()).optional(),
});

export const CitationSchema = z.object({
  id: z.string(),
  source: z.string(),
  provider: z.string(),
  version: z.string(),
  effectiveDate: z.string(),
  excerpt: z.string().optional(),
});

export const SseCitationsSchema = z.object({
  type: z.literal('citations'),
  citations: z.array(CitationSchema),
});

export const SseTraceSchema = z.object({
  type: z.literal('trace'),
  nodes: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      type: z.enum(['user', 'goal', 'product', 'term', 'document']),
      retrieved: z.boolean(),
    })
  ),
  edges: z.array(z.object({ from: z.string(), to: z.string() })),
  topK: z.number().int(),
  retrievalMs: z.number(),
  adapterMode: z.enum(['cognee-live', 'cognee-cached', 'local-fallback', 'mock']),
  sources: z.array(z.string()),
});

export const SseEscalationSchema = z.object({
  type: z.literal('escalation'),
  reason: z.string(),
  message: z.string(), // user-facing message
});

export const SseDoneSchema = z.object({
  type: z.literal('done'),
  messageId: z.string(),
  timings: z.object({
    totalMs: z.number(),
    ttftMs: z.number(),
    retrievalMs: z.number(),
    calcMs: z.number(),
    llmMs: z.number(),
  }),
});

export const SseErrorSchema = z.object({
  type: z.literal('error'),
  code: z.string(),
  message: z.string(), // user-safe message
  retryable: z.boolean().default(false),
});

export const SseCardsSchema = z.object({
  type: z.literal('cards'),
  products: z.array(LoanProductSchema.or(InsurancePlanSchema)),
});

// Union of all SSE event types
export const SseEventSchema = z.discriminatedUnion('type', [
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
]);

export type SseEvent = z.infer<typeof SseEventSchema>;
export type SseStatus = z.infer<typeof SseStatusSchema>;
export type SseIntent = z.infer<typeof SseIntentSchema>;
export type SseToken = z.infer<typeof SseTokenSchema>;
export type SseAffordability = z.infer<typeof SseAffordabilitySchema>;
export type SseChecklist = z.infer<typeof SseChecklistSchema>;
export type SseJourneyState = z.infer<typeof SseJourneyStateSchema>;
export type SseCitations = z.infer<typeof SseCitationsSchema>;
export type SseTrace = z.infer<typeof SseTraceSchema>;
export type SseDone = z.infer<typeof SseDoneSchema>;
export type SseError = z.infer<typeof SseErrorSchema>;
export type Citation = z.infer<typeof CitationSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const DocumentStatusSchema = z.enum([
  'needed',
  'uploading',
  'reading',
  'review_needed',
  'verified',
  'failed',
]);

export const ExtractedFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.unknown(),
  confidence: z.number().min(0).max(1),
  needsReview: z.boolean().default(false),
});

export const IncomeProofExtractionSchema = z.object({
  docType: z.literal('income_proof'),
  name: z.string().optional(),
  employer: z.string().optional(),
  month: z.string().optional(),
  grossIncome: z.number().optional(),
  netIncome: z.number().optional(),
  fields: z.array(ExtractedFieldSchema),
});

export const AdmissionLetterExtractionSchema = z.object({
  docType: z.literal('admission_letter'),
  institution: z.string().optional(),
  course: z.string().optional(),
  fee: z.number().optional(),
  year: z.number().int().optional(),
  fields: z.array(ExtractedFieldSchema),
});

export const IdProofExtractionSchema = z.object({
  docType: z.literal('id_proof'),
  idType: z.string().optional(),
  maskedNumber: z.string().optional(), // last 4 only
  fields: z.array(ExtractedFieldSchema),
});

export type DocumentStatus = z.infer<typeof DocumentStatusSchema>;
export type ExtractedField = z.infer<typeof ExtractedFieldSchema>;
