/**
 * Response Generator — Phase 4
 *
 * Generates:
 * 1. Clarifying questions (one field at a time)
 * 2. Grounded comparison narratives (numbers from calculators, NOT from LLM)
 * 3. Guided next-step summaries
 *
 * All outputs are streamed and pass through OutputGuard.
 */
import { getNextQuestionField, type JourneyDomain } from '@sahaj/shared';
import type { LLMProvider } from '../adapters/llm/index.js';
import { scan, REQUIRED_DISCLAIMER } from './outputGuard.js';

type Language = 'en' | 'hi' | 'hinglish';

// ── System prompts ────────────────────────────────────────────────────────────

function buildSystemPrompt(language: Language): string {
  const base = `You are Sahaj, a friendly and trustworthy AI financial guide for Indian users.
Rules you MUST follow:
- Never guarantee loan approval, insurance issuance, or specific rates.
- Never invent numbers. All financial figures are provided to you — use them exactly.
- Keep responses under 150 words.
- Use simple language appropriate for a first-time borrower or insurance seeker.
- End every response with a clear next step for the user.
- Do not use markdown headers. Use plain sentences.`;

  if (language === 'hi') {
    return `${base}
- Respond entirely in Hindi (Devanagari script).`;
  }
  if (language === 'hinglish') {
    return `${base}
- Respond in Hinglish (mix of Hindi words written in English + English). Keep it warm and conversational.`;
  }
  return `${base}
- Respond in clear, simple English.`;
}

// ── Clarifying Question Generator ─────────────────────────────────────────────

export async function* streamClarifyingQuestion(params: {
  domain: JourneyDomain;
  profile: Record<string, unknown>;
  language: Language;
  amount?: number;
  llm: LLMProvider;
}): AsyncGenerator<string> {
  const { domain, profile, language, amount, llm } = params;
  const nextField = getNextQuestionField(domain, profile);

  if (!nextField) {
    yield language === 'hi'
      ? 'धन्यवाद! आपकी प्रोफ़ाइल पूर्ण है।'
      : language === 'hinglish'
        ? 'Shukriya! Aapki profile complete ho gayi.'
        : 'Thank you! Your profile is now complete.';
    return;
  }

  const prompt = nextField.questionPrompt[language];

  // Build a contextual LLM-assisted question for better conversational quality
  const messages = [
    { role: 'system' as const, content: buildSystemPrompt(language) },
    {
      role: 'user' as const,
      content:
        language === 'hinglish'
          ? `User needs a ${domain} loan${amount ? ` of ₹${amount.toLocaleString('en-IN')}` : ''}. Ask them: "${prompt}" — make it warm and conversational in 1-2 sentences.`
          : language === 'hi'
            ? `User को ${domain} loan${amount ? ` ₹${amount.toLocaleString('en-IN')} का` : ''} चाहिए। उनसे पूछें: "${prompt}" — एक-दो वाक्यों में विनम्रता से।`
            : `User needs a ${domain} loan${amount ? ` of ₹${amount.toLocaleString('en-IN')}` : ''}. Ask them: "${prompt}" — warmly in 1-2 sentences.`,
    },
  ];

  let fullText = '';
  for await (const delta of llm.stream(messages, { maxTokens: 80, temperature: 0.3 })) {
    fullText += delta;
    yield delta;
  }

  // Post-guard: append disclaimer only if financial number was mentioned
  const result = scan(fullText);
  if (result.disclaimerAdded) {
    yield REQUIRED_DISCLAIMER;
  }
}

// ── Grounded Comparison Generator ─────────────────────────────────────────────

export interface ProductCalcSummary {
  id: string;
  name: string;
  rate: number;
  emi: number;
  totalInterest: number;
  moratoriumMonths: number;
  keyBenefit: string;
}

export async function* streamComparison(params: {
  products: ProductCalcSummary[];
  amount: number;
  tenure: number;
  foirPct: number;
  language: Language;
  retrievedContext: string; // Knowledge base excerpt to ground the narrative
  llm: LLMProvider;
}): AsyncGenerator<string> {
  const { products, amount, tenure, foirPct, language, retrievedContext, llm } = params;

  // Prepare the pre-calculated numbers block (LLM reads these, does NOT recalculate)
  const calcBlock = products
    .map(
      (p, i) =>
        `Option ${i + 1}: ${p.name}\n` +
        `  Rate: ${p.rate}% p.a.\n` +
        `  EMI: ₹${p.emi.toLocaleString('en-IN')}/month\n` +
        `  Total interest: ₹${p.totalInterest.toLocaleString('en-IN')}\n` +
        `  Moratorium: ${p.moratoriumMonths} months\n` +
        `  Key benefit: ${p.keyBenefit}`
    )
    .join('\n\n');

  const systemPrompt =
    buildSystemPrompt(language) +
    `\n\nIMPORTANT: The following pre-calculated figures are AUTHORITATIVE. Use them verbatim — do not recalculate or estimate:
${calcBlock}

Additional context from verified policy documents:
${retrievedContext.slice(0, 600)}`;

  const userMsg =
    language === 'hi'
      ? `ऋण राशि ₹${amount.toLocaleString('en-IN')} और ${tenure} महीने अवधि के लिए उपरोक्त तीन विकल्पों की तुलना करें। FOIR ${foirPct}% है।`
      : language === 'hinglish'
        ? `₹${amount.toLocaleString('en-IN')} loan ke liye ${tenure} months mein teeno options compare karo. FOIR ${foirPct}% hai.`
        : `Compare the above options for a ₹${amount.toLocaleString('en-IN')} loan over ${tenure} months. User FOIR is ${foirPct}%.`;

  let fullText = '';
  for await (const delta of llm.stream(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMsg },
    ],
    { maxTokens: 220, temperature: 0.15 }
  )) {
    fullText += delta;
    yield delta;
  }

  // Guard: disclaimer always added for comparison text (has financial numbers)
  const result = scan(fullText);
  if (!result.text.includes('Disclaimer:')) {
    yield REQUIRED_DISCLAIMER;
  }
}

// ── Next-step Guide Generator ─────────────────────────────────────────────────

export async function* streamGuidance(params: {
  domain: JourneyDomain;
  state: string;
  profile: Record<string, unknown>;
  language: Language;
  llm: LLMProvider;
}): AsyncGenerator<string> {
  const { domain, state, profile, language, llm } = params;

  const messages = [
    { role: 'system' as const, content: buildSystemPrompt(language) },
    {
      role: 'user' as const,
      content:
        language === 'hi'
          ? `User का ${domain} journey state "${state}" है। उनके लिए अगला कदम सुझाएं।`
          : language === 'hinglish'
            ? `User ka ${domain} journey state "${state}" hai. Unhe next step batao.`
            : `User's ${domain} journey is at state "${state}" with profile: ${JSON.stringify(profile, null, 2).slice(0, 200)}. What is their recommended next step?`,
    },
  ];

  for await (const delta of llm.stream(messages, { maxTokens: 100, temperature: 0.2 })) {
    yield delta;
  }
}
