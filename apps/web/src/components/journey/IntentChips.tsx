'use client';

import React from 'react';
import { useJourneyStore } from '../../stores/journeyStore';
import { useUIStore } from '../../stores/uiStore';
import type { Language } from '../../lib/i18n';

// ── Trilingual Quick-Reply Chips ────────────────────────────────────────────
const QUICK_CHIPS: Record<string, Record<Language, { label: string; text: string }[]>> = {
  monthly_income: {
    en: [
      { label: '₹25,000 / month', text: 'My monthly take-home income is approximately ₹25,000' },
      { label: '₹35,000 / month', text: 'My monthly salary is ₹35,000' },
      { label: '₹50,000 / month', text: 'My monthly take-home income is ₹50,000' },
      { label: '₹75,000 / month', text: 'My monthly salary is ₹75,000' },
    ],
    hi: [
      { label: '₹25,000 / माह', text: 'मेरी मासिक आय लगभग ₹25,000 है' },
      { label: '₹35,000 / माह', text: 'मेरा मासिक वेतन ₹35,000 है' },
      { label: '₹50,000 / माह', text: 'मेरी मासिक आय ₹50,000 है' },
      { label: '₹75,000 / माह', text: 'मेरा मासिक वेतन ₹75,000 है' },
    ],
    hinglish: [
      { label: '₹25,000 / month', text: 'Meri monthly income lagbhag ₹25,000 hai' },
      { label: '₹35,000 / month', text: 'Meri salary ₹35,000 per month hai' },
      { label: '₹50,000 / month', text: 'Monthly take-home income ₹50,000 hai' },
      { label: '₹75,000 / month', text: 'Take home salary ₹75,000 monthly hai' },
    ],
  },
  existing_obligations_monthly: {
    en: [
      { label: 'No existing EMI', text: 'I have no existing loans or EMIs currently' },
      { label: '₹5,000 / month', text: 'I have an existing EMI of ₹5,000 per month' },
      { label: '₹10,000 / month', text: 'I pay ₹10,000 per month in existing EMIs' },
    ],
    hi: [
      { label: 'कोई EMI नहीं', text: 'मेरी कोई मौजूदा EMI या लोन नहीं है' },
      { label: '₹5,000 / माह', text: 'मेरी ₹5,000 मासिक EMI है' },
      { label: '₹10,000 / माह', text: 'मेरी मौजूदा EMI ₹10,000 प्रति माह है' },
    ],
    hinglish: [
      { label: 'Zero EMI (None)', text: 'Koi existing EMI ya loan nahi hai' },
      { label: '₹5,000 / month', text: '₹5,000 ki existing car/personal EMI hai' },
      { label: '₹10,000 / month', text: '₹10,000 ki monthly EMI chal rahi hai' },
    ],
  },
  product_selected: {
    en: [
      { label: 'Start application', text: 'I want to proceed with SBI Global Ed-Vantage loan application' },
      { label: 'Explain documents', text: 'What documents do I need and where can I submit them?' },
      { label: 'Compare interest rates', text: 'Can you compare the interest rates in more detail?' },
    ],
    hi: [
      { label: 'आवेदन शुरू करें', text: 'मैं SBI Global Ed-Vantage लोन के लिए आवेदन करना चाहता हूं' },
      { label: 'दस्तावेज़ समझाएं', text: 'मुझे कौन से दस्तावेज़ चाहिए और कहाँ जमा करने हैं?' },
      { label: 'ब्याज दर तुलना', text: 'क्या आप ब्याज दरों की तुलना विस्तार से कर सकते हैं?' },
    ],
    hinglish: [
      { label: 'Application shuru karein', text: 'Main SBI Global Ed-Vantage loan ke liye apply karna chahta hoon' },
      { label: 'Documents samjhaiye', text: 'Kaun se documents chahiye aur kahan submit karne hain?' },
      { label: 'Interest rates compare karein', text: 'Kya aap interest rates aur fees detail mein compare kar sakte hain?' },
    ],
  },
  default: {
    en: [
      { label: 'Education Loan ₹25L', text: 'I need an education loan of ₹25 lakhs for MS abroad' },
      { label: 'What is moratorium?', text: 'Can you explain the moratorium period for education loans?' },
      { label: 'Best option for me?', text: 'Which loan option is best suited for my profile?' },
    ],
    hi: [
      { label: 'शिक्षा लोन ₹25L', text: 'मुझे विदेश में MS के लिए ₹25 लाख का शिक्षा लोन चाहिए' },
      { label: 'मोरेटोरियम क्या है?', text: 'शिक्षा लोन में मोरेटोरियम अवधि क्या होती है?' },
      { label: 'मेरे लिए बेस्ट विकल्प?', text: 'मेरी प्रोफ़ाइल के लिए कौन सा लोन सबसे अच्छा है?' },
    ],
    hinglish: [
      { label: '₹25L Education Loan', text: 'Mujhe abroad MS ke liye ₹25 lakh ka education loan chahiye' },
      { label: 'Moratorium kya hota hai?', text: 'Education loan ka moratorium period kaise kaam karta hai?' },
      { label: 'Mere liye best option?', text: 'Kaunsa loan option mere liye sabse sahi hai?' },
    ],
  },
};

export function IntentChips() {
  const { missingFields, sendMessage, isStreaming, profile, products } = useJourneyStore();
  const { language } = useUIStore();

  if (isStreaming) return null;

  let chipKey = 'default';
  if (missingFields.includes('monthly_income') && profile['amount']) {
    chipKey = 'monthly_income';
  } else if (missingFields.includes('existing_obligations_monthly')) {
    chipKey = 'existing_obligations_monthly';
  } else if (products.length > 0) {
    chipKey = 'product_selected';
  }

  const chips = (QUICK_CHIPS[chipKey]?.[language] ?? QUICK_CHIPS[chipKey]?.['hinglish'] ?? QUICK_CHIPS['default']!['hinglish']!);

  return (
    <div className="flex flex-wrap gap-1.5 px-4 py-2" role="list" aria-label="Suggested quick answers">
      {chips.map((chip, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => sendMessage(chip.text, language)}
          className="text-xs font-mono px-2.5 py-1 rounded-[4px] border border-[var(--rule-line)] bg-[var(--card)] text-[var(--ink-navy)] hover:border-[var(--roll-brass)] hover:bg-[var(--muted)] transition-colors"
          role="listitem"
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
