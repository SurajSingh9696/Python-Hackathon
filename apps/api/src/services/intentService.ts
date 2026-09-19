/**
 * Intent Classification Service — Phase 4
 *
 * Pipeline:
 * 1. Rules-first: parseAmount() + regex keyword patterns → confidence >= 0.75
 * 2. LLM fallback: single-pass Groq prompt when confidence < 0.75
 */
import { parseAmount, findEscalationTrigger, type JourneyDomain } from '@sahaj/shared';
import type { LLMProvider } from '../adapters/llm/index.js';

export type Language = 'en' | 'hi' | 'hinglish';

export interface IntentResult {
  domain: JourneyDomain;
  purpose?: string;
  amount?: number;
  language: Language;
  confidence: number;
  requiresEscalation: boolean;
  escalationReason?: string;
  classifiedBy: 'rules' | 'llm';
}

// ── Language detection ────────────────────────────────────────────────────────

function detectLanguage(text: string): Language {
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  if (
    /\b(mujhe|chahiye|zarurat|hai|mera|mere|aap|karna|hoga|kaunsa|sahik|nahi|koi|kitna|aur|matlab|theek|bas)\b/i.test(
      text
    )
  )
    return 'hinglish';
  return 'en';
}

// ── Keyword-based domain + purpose detection ──────────────────────────────────

interface RuleClassification {
  domain: JourneyDomain | null;
  purpose?: string;
  confidence: number;
}

function ruleClassify(lower: string): RuleClassification {
  let domain: JourneyDomain | null = null;
  let purpose: string | undefined;
  let score = 0;

  if (/insurance|bima|health cover|term plan|बीमा|जीवन बीमा|policy|premium/.test(lower)) {
    domain = 'insurance';
    score += 0.6;
  }
  if (/\b(loan|lending|emi|rin|ऋण|उधार|कर्ज|zarurat|paise|chahiye|money|funds)\b/.test(lower) || /₹|\blakh\b|\bcrore\b|\bhazaar\b/.test(lower)) {
    domain = domain ?? 'lending';
    score += 0.55;
  }
  if (/education|padhai|college|fees|school|शिक्षा|पढ़ाई/.test(lower)) {
    purpose = 'education';
    domain = domain ?? 'lending';
    score += 0.35;
  } else if (/home|ghar|property|flat|house|घर/.test(lower)) {
    purpose = 'home';
    domain = domain ?? 'lending';
    score += 0.35;
  } else if (/personal|kharcha|travel|shaadi|wedding/.test(lower)) {
    purpose = 'personal';
    domain = domain ?? 'lending';
    score += 0.35;
  } else if (/business|startup|vyapar|व्यापार/.test(lower)) {
    purpose = 'business';
    domain = domain ?? 'lending';
    score += 0.35;
  }

  const ruleRes: RuleClassification = { domain, confidence: Math.min(score, 0.95) };
  if (purpose !== undefined) ruleRes.purpose = purpose;
  return ruleRes;
}

// ── LLM fallback classification ────────────────────────────────────────────────

async function llmClassify(
  text: string,
  llm: LLMProvider
): Promise<{ domain: JourneyDomain; purpose?: string; confidence: number }> {
  const systemPrompt = `You are a financial intent classifier for an Indian AI assistant.
Classify the user message into:
- domain: "lending" or "insurance"
- purpose (optional): "education" | "home" | "personal" | "business" | "health" | "term"
- confidence: 0.0 to 1.0

Respond ONLY with compact JSON, no explanation. Example:
{"domain":"lending","purpose":"education","confidence":0.9}`;

  const result = await llm.complete(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text },
    ],
    { maxTokens: 60, temperature: 0, firstTokenTimeoutMs: 3000, totalTimeoutMs: 6000 }
  );

  try {
    const parsed = JSON.parse(result.text.trim()) as {
      domain?: string;
      purpose?: string;
      confidence?: number;
    };
    const out: { domain: JourneyDomain; purpose?: string; confidence: number } = {
      domain: parsed.domain === 'insurance' ? 'insurance' : 'lending',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7,
    };
    if (parsed.purpose) out.purpose = parsed.purpose;
    return out;
  } catch {
    return { domain: 'lending', confidence: 0.5 };
  }
}

// ── Main classify function ─────────────────────────────────────────────────────

export async function classifyIntent(
  text: string,
  llm: LLMProvider,
  existingDomain?: JourneyDomain
): Promise<IntentResult> {
  const language = detectLanguage(text);
  const lower = text.toLowerCase();

  const escalationWord = findEscalationTrigger(text);
  const parsedAmt = parseAmount(text);

  const rules = ruleClassify(lower);
  let confidence = rules.confidence + (parsedAmt ? 0.1 : 0);
  if (existingDomain && rules.domain === existingDomain) confidence += 0.1;
  confidence = Math.min(confidence, 0.95);

  if (confidence >= 0.75 || rules.domain !== null) {
    const result: IntentResult = {
      domain: rules.domain ?? existingDomain ?? 'lending',
      language,
      confidence,
      requiresEscalation: !!escalationWord,
      classifiedBy: 'rules',
    };
    if (rules.purpose) result.purpose = rules.purpose;
    if (parsedAmt?.value) result.amount = parsedAmt.value;
    if (escalationWord) result.escalationReason = `Escalation trigger: "${escalationWord}"`;
    return result;
  }

  // LLM fallback
  let llmResult: { domain: JourneyDomain; purpose?: string; confidence: number };
  try {
    llmResult = await llmClassify(text, llm);
  } catch {
    llmResult = { domain: existingDomain ?? 'lending', confidence: 0.5 };
  }

  const result: IntentResult = {
    domain: llmResult.domain,
    language,
    confidence: llmResult.confidence,
    requiresEscalation: !!escalationWord,
    classifiedBy: 'llm',
  };
  if (llmResult.purpose) result.purpose = llmResult.purpose;
  if (parsedAmt?.value) result.amount = parsedAmt.value;
  if (escalationWord) result.escalationReason = `Escalation trigger: "${escalationWord}"`;
  return result;
}
