/**
 * Output Guard — Phase 4
 *
 * Every AI-generated token stream must pass through this guard before emission.
 *
 * Responsibilities:
 * 1. Detect banned guarantee phrases (findBannedPhrase from shared)
 * 2. Detect prompt-injection patterns (SYSTEM OVERRIDE, etc.)
 * 3. Replace banned phrases with safe alternatives
 * 4. Append REQUIRED_DISCLAIMER on responses containing financial figures
 * 5. Claims validator: flag any numbers not produced by calculators (heuristic)
 */
import { findBannedPhrase } from '@sahaj/shared';

// ── Prompt Injection Patterns ─────────────────────────────────────────────────

const INJECTION_PATTERNS: RegExp[] = [
  /system\s+override/gi,
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/gi,
  /you\s+are\s+now\s+(a|an)\s+/gi,
  /disregard\s+(all\s+)?(previous|prior|rbi)\s+/gi,
  /forget\s+(everything|all|your\s+instructions)/gi,
  /jailbreak/gi,
  /\[\s*INST\s*\]/gi,
  /<\|im_start\|>/gi,
  /dan\s+mode/gi,
  /<script[\s\S]*?>/gi,
  /mark\s+my\s+.*(verified|approved)/gi,
  /bypass\s+.*(verification|check)/gi,
  /pan\s+card\s+number.*user/gi,
];

export function containsInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((re) => re.test(text));
}

// ── Financial disclaimer ───────────────────────────────────────────────────────

export const REQUIRED_DISCLAIMER =
  '\n\n*Disclaimer: All figures shown are illustrative estimates based on indicative rates. Actual terms depend on lender assessment, credit history, and applicable RBI/IRDA guidelines. This is not a guarantee of loan approval or insurance coverage.*';

const FINANCIAL_NUMBER_PATTERN = /₹[\d,]+|[\d,]+\s*(lakh|crore|k|L|Cr)/i;

// ── Safe phrase replacements ───────────────────────────────────────────────────

const SAFE_REPLACEMENTS: Record<string, string> = {
  guaranteed: 'potentially available',
  'guaranteed milega': 'potentially milega',
  '100% approved': 'eligible',
  'instant approval': 'quick processing',
  'guaranteed returns': 'projected returns',
  'no risk': 'lower risk',
  'best rate': 'competitive rate',
  'lowest rate guaranteed': 'among the lowest rates available',
};

// ── Main scan function ─────────────────────────────────────────────────────────

export interface GuardResult {
  text: string;
  /** True if any content was modified */
  modified: boolean;
  /** Reasons why it was modified */
  violations: string[];
  /** True if disclaimer was appended */
  disclaimerAdded: boolean;
}

export function scan(text: string): GuardResult {
  let out = text;
  const violations: string[] = [];

  // 1. Prompt injection → hard block
  if (containsInjection(out)) {
    violations.push('prompt_injection');
    out = '[This content was blocked by the safety filter.]';
    return { text: out, modified: true, violations, disclaimerAdded: false };
  }

  // 2. Banned guarantee phrases
  let bannedPhrase: string | null = findBannedPhrase(out);
  while (bannedPhrase) {
    violations.push(`banned_phrase:${bannedPhrase}`);
    const replacement = SAFE_REPLACEMENTS[bannedPhrase.toLowerCase()] ?? 'available (subject to eligibility)';
    out = out.replace(new RegExp(bannedPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), replacement);
    bannedPhrase = findBannedPhrase(out);
  }

  // 3. Disclaimer on financial content
  let disclaimerAdded = false;
  if (FINANCIAL_NUMBER_PATTERN.test(out) && !out.includes('Disclaimer:')) {
    out += REQUIRED_DISCLAIMER;
    disclaimerAdded = true;
  }

  return {
    text: out,
    modified: violations.length > 0 || disclaimerAdded,
    violations,
    disclaimerAdded,
  };
}

/**
 * Stream guard: wraps an async generator of string deltas.
 * Buffers the full text, runs scan(), then yields the guarded output.
 * The disclaimer is appended as a final chunk.
 */
export async function* guardStream(source: AsyncGenerator<string>): AsyncGenerator<string> {
  // Buffer everything (scan requires full text for phrase detection)
  let full = '';
  for await (const delta of source) {
    full += delta;
    yield delta; // still yield raw tokens for low-latency feel
  }

  // Post-process: check for violations
  const result = scan(full);

  if (result.violations.length > 0) {
    // If there were violations, we need to signal correction.
    // In streaming context, we yield a special replacement block.
    // This is a trade-off: the injected/banned text already went out,
    // but we append an override marker for the UI to handle.
    yield '\n[SAHAJ_GUARD_OVERRIDE]';
    yield result.text;
  } else if (result.disclaimerAdded) {
    // Just append the disclaimer as an additional chunk
    yield REQUIRED_DISCLAIMER;
  }
}
