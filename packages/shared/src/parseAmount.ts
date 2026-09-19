/**
 * Amount parser — handles 35+ phrase variants across EN / Hindi / Hinglish,
 * both as standalone phrases ("2 lakh", "₹2,00,000") and embedded in natural
 * language sentences ("Mujhe ₹2 lakh ki zarurat hai apni education ke liye").
 *
 * Supports:
 *  Numeric:      "200000", "2,00,000", "₹2,00,000"
 *  Short forms:  "2L", "2l", "2CR", "2cr", "50K", "50k"
 *  English:      "2 lakh", "2 lac", "2.5 lakh", "50 thousand", "1 crore"
 *  Hinglish:     "do lakh", "teen lakh", "dedh lakh", "dhaai lakh",
 *                "saade teen lakh", "50 hazaar", "50 hazar"
 *  Hindi (Devanagari): "२ लाख", "दो लाख", "डेढ़ लाख", "ढाई लाख",
 *                       "तीन लाख", "पाँच लाख", "बीस हजार"
 *
 * Returns null if the input cannot be parsed with confidence ≥ 0.5.
 */

export interface ParsedAmount {
  /** Exact value in Indian Rupees */
  value: number;
  /** 0–1 confidence score */
  confidence: number;
  /** Human-readable formatted string: "₹2,00,000" */
  normalized: string;
}

// ─── Multipliers ───────────────────────────────────────────────────────────────
const LAKH   = 100_000;
const CRORE  = 10_000_000;
const KILO   = 1_000;

// ─── Devanagari digit map ──────────────────────────────────────────────────────
const DEVA_DIGIT: Record<string, string> = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
};

// ─── Word → numeric value (EN + Hinglish) ─────────────────────────────────────
const WORD_TO_NUM: Record<string, number> = {
  // English cardinals
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
  thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70,
  eighty: 80, ninety: 90,
  // Hinglish cardinals
  ek: 1, do: 2, dho: 2, teen: 3, char: 4, paanch: 5, panch: 5,
  chhe: 6, chhah: 6, saat: 7, sat: 7, aath: 8, nau: 9, nao: 9,
  das: 10, gyarah: 11, barah: 12, terah: 13, chaudah: 14,
  pandrah: 15, solah: 16, satrah: 17, atharah: 18, unees: 19,
  bees: 20, tees: 30, chalis: 40, pachas: 50,
};

// ─── Special fraction words → numeric multiplier ───────────────────────────────
const FRACTION_WORDS: Array<[RegExp, number]> = [
  [/\b(?:saade\s*teen|saadhe\s*teen)\b|साढ़े\s*तीन/i, 3.5],
  [/\b(?:saade\s*do|saadhe\s*do)\b|साढ़े\s*दो/i, 2.5],
  [/\bsaade\s*char\b/i, 4.5],
  [/\bsaade\s*paanch\b/i, 5.5],
  [/\b(?:dhaai|dhyai)\b|ढाई/i, 2.5],
  [/\b(?:dedh|derh|dhed|d[eē]ḍh)\b|डेढ़|डेढ/i, 1.5],
  [/\b(?:aadha|adha|aada)\b|आधा/i, 0.5],
];

// ─── Hindi Devanagari word → number ───────────────────────────────────────────
const DEVA_WORD_TO_NUM: Record<string, number> = {
  'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पाँच': 5, 'पांच': 5,
  'छह': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10,
  'ग्यारह': 11, 'बारह': 12, 'तेरह': 13, 'चौदह': 14, 'पंद्रह': 15,
  'सोलह': 16, 'सत्रह': 17, 'अठारह': 18, 'उन्नीस': 19,
  'बीस': 20, 'तीस': 30, 'चालीस': 40, 'पचास': 50,
  'साठ': 60, 'सत्तर': 70, 'अस्सी': 80, 'नब्बे': 90,
};

// ─── Unit matchers ───────────────────────────────────────────────────────────
const LAKH_WORDS     = /lakh|lac|लाख/i;
const CRORE_WORDS    = /crore|cr|करोड़|करोड/i;
const HAZAAR_WORDS   = /hazaar|hazar|hajar|हजार|हज़ार/i;
const K_WORDS        = /(?:^|\s|\d)k(?:\s|$|[^\w])/i;
const THOUSAND_WORDS = /thousand/i;

// ─── Formatter ────────────────────────────────────────────────────────────────
const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0,
});

function fmt(n: number): string { return INR.format(n); }

/** Replace Devanagari digits with ASCII digits */
function normalizeDeva(s: string): string {
  return s.replace(/[०-९]/g, (c) => DEVA_DIGIT[c] ?? c);
}

/** Detect unit and apply multiplier */
function applyUnit(num: number, text: string): number | null {
  if (LAKH_WORDS.test(text))   return Math.round(num * LAKH);
  if (CRORE_WORDS.test(text))  return Math.round(num * CRORE);
  if (HAZAAR_WORDS.test(text)) return Math.round(num * KILO);
  if (THOUSAND_WORDS.test(text) || K_WORDS.test(text)) return Math.round(num * KILO);
  return null;
}

/**
 * Parse a natural-language amount expression into a rupee value.
 * Works both on isolated expressions and sentences.
 */
export function parseAmount(input: string): ParsedAmount | null {
  if (!input || typeof input !== 'string') return null;

  // Step 1 — normalise Devanagari digits
  let s = normalizeDeva(input.trim());

  // Step 2 — check fraction phrases (saade teen, dhaai, dedh etc.)
  for (const [pattern, multiplier] of FRACTION_WORDS) {
    if (pattern.test(s)) {
      const value = applyUnit(multiplier, s);
      if (value !== null) return { value, confidence: 0.92, normalized: fmt(value) };
    }
  }

  // Step 3 — Devanagari word numbers (एक, दो, …)
  for (const [word, num] of Object.entries(DEVA_WORD_TO_NUM)) {
    if (s.includes(word)) {
      const value = applyUnit(num, s);
      if (value !== null) return { value, confidence: 0.93, normalized: fmt(value) };
    }
  }

  // Step 3b — Compound English word numbers (e.g. forty-five thousand)
  const compoundMatch = /\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[\s-]+(one|two|three|four|five|six|seven|eight|nine)\b/i.exec(s);
  if (compoundMatch) {
    const tens = WORD_TO_NUM[compoundMatch[1]!.toLowerCase()] ?? 0;
    const ones = WORD_TO_NUM[compoundMatch[2]!.toLowerCase()] ?? 0;
    const compoundVal = tens + ones;
    const val = applyUnit(compoundVal, s);
    if (val !== null) return { value: val, confidence: 0.94, normalized: fmt(val) };
  }

  // Step 4 — Hinglish & English single-word numbers (do, teen, fifty…)
  for (const [word, num] of Object.entries(WORD_TO_NUM)) {
    const re = new RegExp(`\\b${word}\\b`, 'i');
    if (re.test(s)) {
      const value = applyUnit(num, s);
      if (value !== null) return { value, confidence: 0.88, normalized: fmt(value) };
    }
  }

  // Step 5 — Explicit rupee sign with amount: e.g. "₹2,00,000" or "₹ 2 lakh"
  const rupeeMatch = /₹\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(lakh|lac|cr|crore|k|thousand|लाख|करोड़)?/i.exec(s);
  if (rupeeMatch) {
    const rawNumStr = (rupeeMatch[1] ?? '0').replace(/,/g, '');
    const num = parseFloat(rawNumStr);
    const unit = rupeeMatch[2];
    if (unit) {
      const value = applyUnit(num, unit);
      if (value !== null) return { value, confidence: 0.98, normalized: fmt(value) };
    } else if (num > 0) {
      return { value: Math.round(num), confidence: 0.98, normalized: fmt(Math.round(num)) };
    }
  }

  // Clean ₹ sign and commas for remaining regexes
  const cleaned = s.replace(/[₹]/g, '');

  // Step 6 — short suffix forms with ASCII suffixes: "2L", "2l", "2CR", "50K", "1.5L"
  const shortSuffix = /(?:^|\s|[^\w.])(\d+(?:\.\d+)?)\s*(l|lakh|lac|cr|crore|k|thousand)\b/i.exec(cleaned);
  if (shortSuffix) {
    const num = parseFloat(shortSuffix[1] ?? '0');
    const unit = (shortSuffix[2] ?? '').toLowerCase();
    let multiplier = 0;
    if (unit === 'l' || unit === 'lakh' || unit === 'lac') multiplier = LAKH;
    else if (unit === 'cr' || unit === 'crore')            multiplier = CRORE;
    else if (unit === 'k' || unit === 'thousand')          multiplier = KILO;
    if (multiplier) {
      const value = Math.round(num * multiplier);
      return { value, confidence: 0.96, normalized: fmt(value) };
    }
  }

  // Step 7 — number followed by unit anywhere in sentence (handles English, Hinglish, and Devanagari units)
  const numUnit = /(?:^|\s|[^\w.])(\d+(?:\.\d+)?)\s*(lakh|lac|crore|hazaar|hazar|hajar|thousand|k|cr|लाख|करोड़|करोड|हजार|हज़ार)/i.exec(cleaned);
  if (numUnit) {
    const num = parseFloat(numUnit[1] ?? '0');
    const unit = numUnit[2] ?? '';
    const value = applyUnit(num, unit);
    if (value !== null) return { value, confidence: 0.96, normalized: fmt(value) };
  }

  // Step 8 — plain numeric (e.g. "200000", "2,00,000", "50000")
  const plainMatch = /(?:^|\s|[^\w.])(\d{1,3}(?:,\d{2,3})+(?:\.\d+)?|\d{4,9})(?:\s|$|[^\w.])/i.exec(s);
  if (plainMatch) {
    const rawDigits = (plainMatch[1] ?? '').replace(/,/g, '');
    const plainNum = parseFloat(rawDigits);
    if (!isNaN(plainNum) && plainNum > 0) {
      return { value: Math.round(plainNum), confidence: 0.85, normalized: fmt(Math.round(plainNum)) };
    }
  }

  return null;
}
