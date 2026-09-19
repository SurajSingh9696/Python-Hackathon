/**
 * Trilingual dictionary and translation helpers for Sahaj Web.
 * Supported languages: en | hi | hinglish
 */

export type Language = 'en' | 'hi' | 'hinglish';

export const DICTIONARY = {
  common: {
    brandName: { en: 'Sahaj', hi: 'सहज', hinglish: 'Sahaj' },
    tagline: {
      en: 'Finance that understands you',
      hi: 'वित्त जो आपको समझे',
      hinglish: 'Finance jo aapko samjhe',
    },
    demoBadge: {
      en: 'Paytm Verified · 256-Bit SSL',
      hi: 'पेटीएम सत्यापित · 256-बिट सुरक्षित',
      hinglish: 'Paytm Verified · 256-Bit SSL',
    },
    askPlaceholder: {
      en: 'What do you need money or cover for?',
      hi: 'आपको किस लिए राशि या बीमा चाहिए?',
      hinglish: 'Aapko kis cheez ke liye paise ya cover chahiye?',
    },
    composerPlaceholder: {
      en: 'Type your answer or question here...',
      hi: 'यहाँ अपना उत्तर या प्रश्न लिखें...',
      hinglish: 'Yahan apna jawab ya sawal likhein...',
    },
    send: { en: 'Send', hi: 'भेजें', hinglish: 'Send' },
    calculating: { en: 'Calculating...', hi: 'गणना की जा रही है...', hinglish: 'Calculate ho raha hai...' },
    retrieving: { en: 'Checking verified terms...', hi: 'सत्यापित नियम जांचे जा रहे हैं...', hinglish: 'Verified rules check ho rahe hain...' },
    understanding: { en: 'Understanding your goal...', hi: 'आपके लक्ष्य को समझा जा रहा है...', hinglish: 'Aapka goal samajh rahe hain...' },
    generating: { en: 'Preparing recommendation...', hi: 'सिफारिश तैयार की जा रही है...', hinglish: 'Recommendation ban rahi hai...' },
    whyThis: { en: 'Why this?', hi: 'यह क्यों?', hinglish: 'Yeh kyu?' },
    behindTheScenes: { en: 'Behind the Scenes', hi: 'पर्दे के पीछे', hinglish: 'Behind the Scenes' },
    continue: { en: 'Continue Application', hi: 'आवेदन जारी रखें', hinglish: 'Application continue karein' },
    viewChecklist: { en: 'Document Checklist', hi: 'दस्तावेज़ सूची', hinglish: 'Document Checklist' },
    affordabilityHeadline: { en: 'Affordability Analysis', hi: 'वहनीयता विश्लेषण', hinglish: 'Affordability Analysis' },
    foirLabel: { en: 'FOIR (Income Committed)', hi: 'आय प्रतिबद्धता (FOIR)', hinglish: 'FOIR (Income Committed)' },
    headroomLabel: { en: 'Monthly Headroom', hi: 'मासिक बचत शेष', hinglish: 'Monthly Headroom' },
    bandComfortable: { en: 'Comfortable', hi: 'सुरक्षित', hinglish: 'Comfortable' },
    bandStretched: { en: 'Stretched', hi: 'मध्यम तनाव', hinglish: 'Stretched' },
    bandHigh: { en: 'High Risk', hi: 'उच्च जोखिम', hinglish: 'High Risk' },
    compareOptions: { en: 'Verified Loan Options', hi: 'सत्यापित ऋण विकल्प', hinglish: 'Verified Loan Options' },
    monthlyEmi: { en: 'Estimated EMI', hi: 'अनुमानित ईएमआई', hinglish: 'Estimated EMI' },
    interestRate: { en: 'Interest Rate', hi: 'ब्याज दर', hinglish: 'Interest Rate' },
    moratorium: { en: 'Moratorium', hi: 'मोरेटोरियम', hinglish: 'Moratorium' },
    feedbackHelpful: { en: 'Was this helpful?', hi: 'क्या यह सहायक था?', hinglish: 'Kya yeh helpful tha?' },
    feedbackThanks: { en: 'Thank you for your feedback!', hi: 'आपकी प्रतिक्रिया के लिए धन्यवाद!', hinglish: 'Feedback ke liye shukriya!' },
    escalationNotice: {
      en: 'A specialist team member will review your request.',
      hi: 'एक विशेषज्ञ सदस्य आपके अनुरोध की समीक्षा करेंगे।',
      hinglish: 'Ek specialist team member aapki request review karenge.',
    },
  },
  terms: {
    moratorium: {
      title: { en: 'Moratorium Period', hi: 'मोरेटोरियम अवधि', hinglish: 'Moratorium Period' },
      explanation: {
        en: 'A repayment holiday during your course period + 6 months where you do not need to pay the principal EMI.',
        hi: 'पढ़ाई की अवधि + 6 महीने के दौरान ईएमआई की मूल राशि न चुकाने की छूट। इस दौरान केवल साधारण ब्याज लगता है।',
        hinglish: 'Course duration + 6 months tak EMI ka principal amount nahi bharna hota, sirf simple interest lagta hai.',
      },
    },
    foir: {
      title: { en: 'FOIR (Fixed Obligation to Income Ratio)', hi: 'एफओआईआर अनुपात', hinglish: 'FOIR Ratio' },
      explanation: {
        en: 'The percentage of your monthly income that goes towards paying existing loans and new EMIs. Banks prefer it under 50%.',
        hi: 'आपकी मासिक आय का वह प्रतिशत जो पुरानी और नई ईएमआई भरने में जाता है। बैंक इसे 50% से कम पसंद करते हैं।',
        hinglish: 'Aapki monthly income ka kitna hissa EMIs bharne mein jaata hai. Banks 50% se kam ko safe maante hain.',
      },
    },
    reducing_rate: {
      title: { en: 'Reducing Balance Rate', hi: 'घटती शेष ब्याज दर', hinglish: 'Reducing Balance Rate' },
      explanation: {
        en: 'Interest is charged only on the remaining loan balance, reducing with each monthly repayment.',
        hi: 'ब्याज केवल बची हुई ऋण राशि पर लगता है, जो हर महीने ईएमआई भरने के साथ घटती जाती है।',
        hinglish: 'Biyaj sirf bachi hui principal amount pe lagta hai, har mahine EMI bharne se kam hota rehta hai.',
      },
    },
  },
} as const;

export function t(
  section: keyof typeof DICTIONARY,
  key: string,
  lang: Language = 'en'
): string {
  const sec = DICTIONARY[section] as Record<string, Record<Language, string>> | undefined;
  if (!sec || !sec[key]) return key;
  return sec[key][lang] ?? sec[key]['en'] ?? key;
}
