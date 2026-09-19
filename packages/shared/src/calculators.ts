/**
 * Deterministic financial calculators.
 *
 * RULE: The LLM NEVER does arithmetic. All financial numbers
 * shown to users come from these functions. The LLM only
 * explains the numbers it receives.
 *
 * All money values are in Indian Rupees (₹).
 * Rounding is done once at the end using Math.round().
 */

// ─────────────────────────────────────────────────────────────────────────────
// EMI — Reducing-balance formula
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate monthly EMI using the reducing-balance (equal-instalment) formula.
 *
 * Formula: EMI = P × r × (1+r)^n / ((1+r)^n - 1)
 * where r = annual rate / 12 / 100, n = tenure in months.
 *
 * Reference test (from spec):
 *   ₹2,00,000 @ 10.5% for 36 months ≈ ₹6,500 (±₹2)
 *
 * Edge cases:
 *   - annualRatePct = 0  → simple division: principal / tenureMonths
 *   - tenureMonths = 0   → full principal (single payment)
 *   - tenureMonths = 1   → single balloon payment
 */
export function emi(
  principal: number,
  annualRatePct: number,
  tenureMonths: number
): number {
  if (principal <= 0) return 0;
  if (tenureMonths <= 0) return principal; // Edge case: pay immediately
  if (annualRatePct === 0) return Math.round(principal / tenureMonths);
  if (tenureMonths === 1) return Math.round(principal * (1 + annualRatePct / 100 / 12));

  const r = annualRatePct / 100 / 12;
  const pow = Math.pow(1 + r, tenureMonths);
  return Math.round((principal * r * pow) / (pow - 1));
}

// ─────────────────────────────────────────────────────────────────────────────
// Loan Summary
// ─────────────────────────────────────────────────────────────────────────────

export interface LoanSummaryInput {
  principal: number;
  annualRatePct: number;
  tenureMonths: number;
  /** Processing fee as % of principal (e.g. 1 = 1%) */
  processingFeePct?: number | undefined;
  /** Flat processing fee in ₹ (used if > 0, overrides pct) */
  processingFeeFlat?: number | undefined;
  /** GST rate on processing fee (default 18%) */
  gstPct?: number | undefined;
  /**
   * Moratorium months (education loans).
   * Simple interest accrues during this period; EMI starts after.
   */
  moratoriumMonths?: number | undefined;
}

export interface LoanSummary {
  /** Rounded monthly EMI in ₹ */
  emiMonthly: number;
  /** Total interest payable in ₹ */
  totalInterest: number;
  /** Total amount payable (principal + interest) in ₹ */
  totalPayable: number;
  /** Processing fee in ₹ (before GST) */
  processingFee: number;
  /** GST on processing fee in ₹ */
  gstOnFee: number;
  /** Effective upfront cost: fee + GST */
  effectiveUpfrontCost: number;
  /** Simple interest accrued during moratorium (if any) */
  moratoriumInterest?: number | undefined;
  /** Principal after moratorium interest is added */
  grownPrincipal?: number | undefined;
  /** Label required by A3 */
  label: 'Illustrative estimate';
}

export function loanSummary(input: LoanSummaryInput): LoanSummary {
  const {
    principal,
    annualRatePct,
    tenureMonths,
    processingFeePct = 0,
    processingFeeFlat = 0,
    gstPct = 18,
    moratoriumMonths = 0,
  } = input;

  // Processing fee (flat takes precedence over percentage)
  const fee =
    processingFeeFlat > 0
      ? processingFeeFlat
      : Math.round((principal * processingFeePct) / 100);
  const gst = Math.round((fee * gstPct) / 100);

  // Moratorium: simple interest accrues on principal during the course period
  let moratoriumInterest: number | undefined;
  let grownPrincipal: number | undefined;
  let emiPrincipal = principal;

  if (moratoriumMonths > 0) {
    moratoriumInterest = Math.round(
      principal * (annualRatePct / 100 / 12) * moratoriumMonths
    );
    grownPrincipal = principal + moratoriumInterest;
    emiPrincipal = grownPrincipal;
  }

  const monthlyEmi = emi(emiPrincipal, annualRatePct, tenureMonths);
  const totalPayable = monthlyEmi * tenureMonths + (moratoriumInterest ?? 0);
  const totalInterest = totalPayable - principal;

  return {
    emiMonthly: monthlyEmi,
    totalInterest,
    totalPayable,
    processingFee: fee,
    gstOnFee: gst,
    effectiveUpfrontCost: fee + gst,
    ...(moratoriumMonths > 0
      ? { moratoriumInterest, grownPrincipal }
      : {}),
    label: 'Illustrative estimate',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Affordability / FOIR
// ─────────────────────────────────────────────────────────────────────────────

export type AffordabilityBand = 'comfortable' | 'stretched' | 'high';

export interface AffordabilityResult {
  /** FOIR/DTI as percentage (0–100+) */
  foirPct: number;
  /** Monthly headroom in ₹ before hitting maxFoirPct */
  headroomMonthly: number;
  /** Qualitative band */
  band: AffordabilityBand;
  /** Whether the proposed EMI is within the lender's FOIR limit */
  isAffordable: boolean;
  /** Always present — required by A3 */
  label: 'Illustrative estimate';
}

/**
 * Compute FOIR (Fixed Obligations-to-Income Ratio) affordability.
 *
 * FOIR = (existingObligations + newEmi) / monthlyIncome × 100
 * Band:
 *   ≤ 35%           → comfortable
 *   35% < x ≤ max  → stretched
 *   > max           → high (not affordable)
 */
export function affordability(
  monthlyIncome: number,
  existingObligations: number,
  newEmi: number,
  maxFoirPct = 50
): AffordabilityResult {
  if (monthlyIncome <= 0) {
    return {
      foirPct: 100,
      headroomMonthly: 0,
      band: 'high',
      isAffordable: false,
      label: 'Illustrative estimate',
    };
  }

  const totalObligations = existingObligations + newEmi;
  const foirPct = Math.round((totalObligations / monthlyIncome) * 100);
  const maxAllowed = (monthlyIncome * maxFoirPct) / 100;
  const headroomMonthly = Math.round(Math.max(0, maxAllowed - totalObligations));

  let band: AffordabilityBand;
  if (foirPct <= 35) band = 'comfortable';
  else if (foirPct <= maxFoirPct) band = 'stretched';
  else band = 'high';

  return {
    foirPct,
    headroomMonthly,
    band,
    isAffordable: foirPct <= maxFoirPct,
    label: 'Illustrative estimate',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Premium Illustration (Insurance)
// ─────────────────────────────────────────────────────────────────────────────

export interface PremiumIllustrationInput {
  /** Age band: "18-35" | "36-45" | "46-55" | "56-65" | "65+" */
  ageBand: string;
  /** Cover amount in lakhs (e.g. 5 = ₹5L) */
  coverAmountLakh: number;
  /** Number of members to cover */
  membersCount: number;
  /** Plan identifier matching product seed */
  planId: string;
}

export interface PremiumIllustration {
  annualPremium: number;
  monthlyPremium: number;
  label: 'Illustrative estimate';
}

/**
 * Premium lookup table — keyed by planId → ageBand → base annual premium (₹).
 * Base assumes ₹5L cover and 1 member. Adjusted below.
 * Real values come from the product seed in Phase 3.
 */
const PREMIUM_TABLE: Record<string, Record<string, number>> = {
  'health-basic':   { '18-35':  8_000, '36-45': 12_000, '46-55': 18_000, '56-65': 28_000, '65+': 40_000 },
  'health-premium': { '18-35': 14_000, '36-45': 20_000, '46-55': 30_000, '56-65': 45_000, '65+': 65_000 },
  'term-standard':  { '18-35':  6_000, '36-45': 10_000, '46-55': 16_000, '56-65': 28_000, '65+': 45_000 },
};
const DEFAULT_BASE_ANNUAL = 10_000;

export function premiumIllustration(
  input: PremiumIllustrationInput
): PremiumIllustration {
  const baseAnnual = PREMIUM_TABLE[input.planId]?.[input.ageBand] ?? DEFAULT_BASE_ANNUAL;

  // Scale by cover amount (base is ₹5L cover)
  const coverMultiplier = Math.max(1, input.coverAmountLakh / 5);
  // Additional members: each extra member adds 40% of the base
  const memberMultiplier =
    input.membersCount <= 1 ? 1 : 1 + (input.membersCount - 1) * 0.4;

  const annualPremium = Math.round(baseAnnual * coverMultiplier * memberMultiplier);
  return {
    annualPremium,
    monthlyPremium: Math.round(annualPremium / 12),
    label: 'Illustrative estimate',
  };
}

// ── Convenient Object-style Aliases ──────────────────────────────────────────

export function calculateEmi(params: {
  principal: number;
  annualRatePct: number;
  tenureMonths: number;
}): { emi: number } {
  return {
    emi: emi(params.principal, params.annualRatePct, params.tenureMonths),
  };
}

export function calculateAffordability(params: {
  monthlyIncome: number;
  existingEmi: number;
  newEmi: number;
  maxFoirPct?: number;
}): AffordabilityResult {
  return affordability(
    params.monthlyIncome,
    params.existingEmi,
    params.newEmi,
    params.maxFoirPct ?? 50
  );
}

export function calculateMoratorium(params: {
  principal: number;
  annualRatePct: number;
  moratoriumMonths: number;
}): { moratoriumInterest: number; grownPrincipal: number } {
  const interest = Math.round(
    params.principal * (params.annualRatePct / 100 / 12) * params.moratoriumMonths
  );
  return {
    moratoriumInterest: interest,
    grownPrincipal: params.principal + interest,
  };
}

export function calculatePremiumIllustration(params: {
  sumAssured: number;
  age: number;
  isSmoker?: boolean;
}): PremiumIllustration {
  const ageBand =
    params.age <= 35
      ? '18-35'
      : params.age <= 45
        ? '36-45'
        : params.age <= 55
          ? '46-55'
          : '56-65';
  const coverAmountLakh = params.sumAssured / 100000;
  const base = premiumIllustration({
    planId: 'term-standard',
    ageBand,
    coverAmountLakh,
    membersCount: 1,
  });

  if (params.isSmoker) {
    const smokerPremium = Math.round(base.annualPremium * 1.5);
    return {
      annualPremium: smokerPremium,
      monthlyPremium: Math.round(smokerPremium / 12),
      label: 'Illustrative estimate',
    };
  }

  return base;
}

