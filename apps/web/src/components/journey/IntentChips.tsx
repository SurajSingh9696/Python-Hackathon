'use client';

import React from 'react';
import { useJourneyStore } from '../../stores/journeyStore';
import { useUIStore } from '../../stores/uiStore';

const QUICK_CHIPS = {
  monthly_income: [
    { label: '₹25,000 / month', text: 'Meri monthly income lagbhag ₹25,000 hai' },
    { label: '₹35,000 / month', text: 'Meri salary ₹35,000 per month hai' },
    { label: '₹50,000 / month', text: 'Monthly take-home income ₹50,000 hai' },
    { label: '₹75,000 / month', text: 'Take home salary ₹75,000 monthly hai' },
  ],
  existing_obligations_monthly: [
    { label: 'Zero EMI (None)', text: 'Koi existing EMI ya loan nahi hai' },
    { label: '₹5,000 / month', text: '₹5,000 ki existing car/personal EMI hai' },
  ],
  default: [
    { label: '₹2 Lakh Education', text: 'Mujhe ₹2 lakh ka education loan chahiye' },
    { label: 'Moratorium details?', text: 'Education loan ka moratorium period kaise kaam karta hai?' },
    { label: 'Compare options', text: 'Kaunsa loan option mere liye sabse sahi hai?' },
  ],
};

export function IntentChips() {
  const { missingFields, sendMessage, isStreaming, profile } = useJourneyStore();

  if (isStreaming) return null;

  let chips = QUICK_CHIPS.default;
  if (missingFields.includes('monthly_income') && profile['amount']) {
    chips = QUICK_CHIPS.monthly_income;
  } else if (missingFields.includes('existing_obligations_monthly')) {
    chips = QUICK_CHIPS.existing_obligations_monthly;
  }

  return (
    <div className="flex flex-wrap gap-2 px-4 py-2" role="list" aria-label="Suggested quick answers">
      {chips.map((chip, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => sendMessage(chip.text)}
          className="text-xs px-3 py-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--color-signal-cyan)] hover:text-[var(--color-signal-cyan)] active:scale-95 transition-all shadow-sm font-medium"
          role="listitem"
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
