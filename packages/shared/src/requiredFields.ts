/**
 * Required fields per domain with question templates and validation rules.
 *
 * Rules:
 * - Ask ONE minimal, highest-value question at a time (never re-ask known fields)
 * - Lending required: purpose, amount, monthly_income, existing_obligations_monthly
 * - Insurance required: insurance_type, age_band, members_to_cover
 */
import type { JourneyDomain } from './stateMachine.js';

export interface FieldDefinition {
  key: string;
  label: string;
  labelHi: string;
  labelHinglish: string;
  required: boolean;
  type: 'amount' | 'number' | 'enum' | 'boolean' | 'string';
  options?: string[];
  questionPrompt: {
    en: string;
    hi: string;
    hinglish: string;
  };
}

export const LENDING_FIELDS: FieldDefinition[] = [
  {
    key: 'purpose',
    label: 'Loan purpose',
    labelHi: 'ऋण का उद्देश्य',
    labelHinglish: 'Loan purpose',
    required: true,
    type: 'enum',
    options: ['education', 'personal', 'home', 'vehicle', 'business', 'other'],
    questionPrompt: {
      en: 'What do you need this loan for (e.g., education, personal, business)?',
      hi: 'आपको यह ऋण किस काम के लिए चाहिए (जैसे शिक्षा, व्यक्तिगत, व्यापार)?',
      hinglish: 'Aapko yeh loan kis cheez ke liye chahiye (jaise education, personal, business)?',
    },
  },
  {
    key: 'amount',
    label: 'Loan amount',
    labelHi: 'ऋण राशि',
    labelHinglish: 'Loan amount',
    required: true,
    type: 'amount',
    questionPrompt: {
      en: 'How much loan amount are you looking for?',
      hi: 'आपको कितनी ऋण राशि की आवश्यकता है?',
      hinglish: 'Aapko kitne loan amount ki zaroorat hai?',
    },
  },
  {
    key: 'monthly_income',
    label: 'Monthly income',
    labelHi: 'मासिक आय',
    labelHinglish: 'Monthly income',
    required: true,
    type: 'amount',
    questionPrompt: {
      en: 'What is your approximate monthly take-home income?',
      hi: 'आपकी अनुमानित मासिक इन-हैंड आय कितनी है?',
      hinglish: 'Aapki approximate monthly take-home income kitni hai?',
    },
  },
  {
    key: 'existing_obligations_monthly',
    label: 'Existing monthly EMIs',
    labelHi: 'मौजूदा मासिक ईएमआई',
    labelHinglish: 'Existing monthly EMIs',
    required: true,
    type: 'amount',
    questionPrompt: {
      en: 'Do you pay any existing monthly EMIs or loan obligations? If none, enter 0.',
      hi: 'क्या आप पहले से कोई मासिक ईएमआई भर रहे हैं? यदि नहीं, तो 0 बताएं।',
      hinglish: 'Kya aapki koi existing monthly EMI ya loan obligations hain? Agar nahi hai toh 0 bataiye.',
    },
  },
  {
    key: 'tenure_months_pref',
    label: 'Preferred tenure (months)',
    labelHi: 'पसंदीदा अवधि (महीने)',
    labelHinglish: 'Preferred tenure (months)',
    required: false,
    type: 'number',
    questionPrompt: {
      en: 'Do you have a preferred repayment tenure in months (e.g., 24, 36, 60)?',
      hi: 'क्या आपकी कोई पसंदीदा पुनर्भुगतान अवधि (महीनों में) है?',
      hinglish: 'Kya aapki koi preferred tenure hai months mein (jaise 24, 36, 60)?',
    },
  },
  {
    key: 'employment_type',
    label: 'Employment type',
    labelHi: 'रोजगार प्रकार',
    labelHinglish: 'Employment type',
    required: false,
    type: 'enum',
    options: ['salaried', 'self_employed', 'student', 'other'],
    questionPrompt: {
      en: 'What is your employment status (salaried, self-employed, or student)?',
      hi: 'आपकी रोजगार स्थिति क्या है (वेतनभोगी, स्व-नियोजित, या छात्र)?',
      hinglish: 'Aapka employment status kya hai (salaried, self-employed, ya student)?',
    },
  },
];

export const INSURANCE_FIELDS: FieldDefinition[] = [
  {
    key: 'insurance_type',
    label: 'Insurance type',
    labelHi: 'बीमा प्रकार',
    labelHinglish: 'Insurance type',
    required: true,
    type: 'enum',
    options: ['health', 'term', 'other'],
    questionPrompt: {
      en: 'Which type of insurance are you looking for: Health or Term life?',
      hi: 'आप किस प्रकार का बीमा चाहते हैं: स्वास्थ्य (Health) या मियादी (Term)?',
      hinglish: 'Aap kis tarah ka insurance dekh rahe hain: Health ya Term life?',
    },
  },
  {
    key: 'age_band',
    label: 'Age band',
    labelHi: 'आयु वर्ग',
    labelHinglish: 'Age band',
    required: true,
    type: 'enum',
    options: ['18-35', '36-45', '46-55', '56-65', '65+'],
    questionPrompt: {
      en: 'What is your age band (e.g., 18-35, 36-45, 46-55)?',
      hi: 'आपकी आयु किस वर्ग में आती है (जैसे 18-35, 36-45, 46-55)?',
      hinglish: 'Aapki age kis bracket mein aati hai (jaise 18-35, 36-45, 46-55)?',
    },
  },
  {
    key: 'members_to_cover',
    label: 'Members to cover',
    labelHi: 'कवर करने वाले सदस्य',
    labelHinglish: 'Members to cover',
    required: true,
    type: 'number',
    questionPrompt: {
      en: 'How many family members would you like to cover (including yourself)?',
      hi: 'आप अपने सहित कितने सदस्यों का बीमा कराना चाहते हैं?',
      hinglish: 'Aap apne sahit kitne family members ko cover karna chahte hain?',
    },
  },
  {
    key: 'coverage_pref',
    label: 'Coverage preference',
    labelHi: 'कवरेज प्राथमिकता',
    labelHinglish: 'Coverage preference',
    required: false,
    type: 'amount',
    questionPrompt: {
      en: 'What is your preferred sum insured or cover amount?',
      hi: 'आपकी पसंदीदा बीमा राशि (Sum Insured) कितनी है?',
      hinglish: 'Aap kitne sum insured ya cover amount ka plan chahte hain?',
    },
  },
  {
    key: 'budget_pref',
    label: 'Monthly budget',
    labelHi: 'मासिक बजट',
    labelHinglish: 'Monthly budget',
    required: false,
    type: 'amount',
    questionPrompt: {
      en: 'What is your approximate monthly or annual budget for premium?',
      hi: 'प्रीमियम के लिए आपका मासिक या वार्षिक बजट कितना है?',
      hinglish: 'Premium ke liye aapka approximate monthly ya annual budget kitna hai?',
    },
  },
  {
    key: 'pre_existing_conditions',
    label: 'Pre-existing conditions',
    labelHi: 'पहले से मौजूद बीमारियाँ',
    labelHinglish: 'Pre-existing conditions',
    required: false,
    type: 'enum',
    options: ['yes', 'no', 'prefer_not_to_say'],
    questionPrompt: {
      en: 'Are there any pre-existing medical conditions (Yes / No / Prefer not to say)?',
      hi: 'क्या पहले से कोई चिकित्सीय स्थिति है (हाँ / नहीं / बताना नहीं चाहते)?',
      hinglish: 'Kya pehle se koi medical condition hai (Yes / No / Prefer not to say)?',
    },
  },
];

export function getAllFields(domain: JourneyDomain): FieldDefinition[] {
  if (domain === 'lending') return LENDING_FIELDS;
  if (domain === 'insurance') return INSURANCE_FIELDS;
  return [];
}

export function getRequiredFields(domain: JourneyDomain): FieldDefinition[] {
  return getAllFields(domain).filter((f) => f.required);
}

export function getMissingFields(
  domain: JourneyDomain,
  profile: Record<string, unknown>
): FieldDefinition[] {
  return getRequiredFields(domain).filter(
    (f) =>
      profile[f.key] === undefined ||
      profile[f.key] === null ||
      profile[f.key] === '' ||
      (typeof profile[f.key] === 'number' && Number.isNaN(profile[f.key]))
  );
}

/**
 * Returns the single next most valuable missing field to ask the user.
 * Honors "Ask one minimal, highest-value question at a time".
 */
export function getNextQuestionField(
  domain: JourneyDomain,
  profile: Record<string, unknown>
): FieldDefinition | null {
  const missing = getMissingFields(domain, profile);
  return missing[0] ?? null;
}
