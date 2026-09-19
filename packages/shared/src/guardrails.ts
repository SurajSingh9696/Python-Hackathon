/**
 * Guardrail phrase lists.
 *
 * RULE (A3-1): The LLM must NEVER output guarantee/approval language.
 * These lists are used by the output guard to scan and block/strip banned phrases.
 */

/** Phrases that must never appear in any AI-generated output. Case-insensitive match. */
export const BANNED_PROMISE_PHRASES: string[] = [
  // Multi-word / specific phrases first
  'pre-approved',
  'pre approved',
  'approved',
  'guaranteed',
  'guarantee',
  'you will get',
  'you will receive',
  'you are eligible',
  "you'll get",
  "you'll receive",
  '100 percent',
  '100%',
  'definitely get',
  'sure to get',
  'certainly get',
  'will be sanctioned',
  'will be disbursed',
  'will approve',
  // Hindi/Hinglish equivalents
  'pakka approve',
  'pakka milega',
  'zaroor milega',
  'guaranteed milega',
  'confirmed hai',
  'पक्का मिलेगा',
  'मंजूर हो जाएगा',
  'गारंटी',
];

// Pre-sort phrases by length descending so longer phrases match first
const SORTED_BANNED_PHRASES = [...BANNED_PROMISE_PHRASES].sort(
  (a, b) => b.length - a.length
);

/** Disclaimer that must appear on every response containing financial numbers. */
export const REQUIRED_DISCLAIMER = {
  en: 'Illustrative estimate · Based on {source} · Assumes {assumptions} · Not a financial guarantee · Verify with the lender/insurer',
  hi: 'अनुमानित आंकड़े · {source} के आधार पर · {assumptions} मानते हुए · यह वित्तीय गारंटी नहीं है · ऋणदाता/बीमाकर्ता से सत्यापित करें',
};

/** Terms that trigger human escalation when detected in user messages. */
export const ESCALATION_TRIGGER_WORDS: string[] = [
  'harassment',
  'complaint',
  'threaten',
  'cheated',
  'dispute',
  'police',
  'court',
  'fraud',
  'legal',
  'scam',
  // Hindi
  'complaint karna',
  'pareshaan',
  'dhokha',
  'dhoka',
  'धोखा',
  'शिकायत',
  'कानूनी',
];

const SORTED_ESCALATION_WORDS = [...ESCALATION_TRIGGER_WORDS].sort(
  (a, b) => b.length - a.length
);

/** Check if text contains any banned phrase. Returns the first matched phrase or null. */
export function findBannedPhrase(text: string): string | null {
  const lower = text.toLowerCase();
  for (const phrase of SORTED_BANNED_PHRASES) {
    if (lower.includes(phrase.toLowerCase())) {
      return phrase;
    }
  }
  return null;
}

/** Check if text contains any escalation trigger. Returns matched word or null. */
export function findEscalationTrigger(text: string): string | null {
  const lower = text.toLowerCase();
  for (const word of SORTED_ESCALATION_WORDS) {
    if (lower.includes(word.toLowerCase())) {
      return word;
    }
  }
  return null;
}
