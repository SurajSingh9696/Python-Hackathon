'use client';

import React from 'react';
import { useUIStore } from '../../stores/uiStore';
import { DICTIONARY } from '../../lib/i18n';
import { XMarkIcon, InfoIcon } from '../common/Icons';

export function TermExplainer() {
  const { activeTerm, explainTerm, language } = useUIStore();

  if (!activeTerm) return null;

  const key = activeTerm.toLowerCase().includes('moratorium')
    ? 'moratorium'
    : activeTerm.toLowerCase().includes('foir')
      ? 'foir'
      : 'reducing_rate';

  const termData = DICTIONARY.terms[key];
  const title = termData.title[language] ?? termData.title['en'];
  const explanation = termData.explanation[language] ?? termData.explanation['en'];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="term-title"
    >
      <div className="w-full max-w-md p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-2xl flex flex-col gap-4 animate-scaleUp">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[var(--color-signal-cyan)]">
            <InfoIcon className="w-5 h-5" />
            <h3 id="term-title" className="font-semibold text-base text-[var(--text-primary)]">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => explainTerm(null)}
            className="p-1.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-default)] transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-[var(--text-primary)] leading-relaxed">{explanation}</p>

        <div className="p-3 rounded-2xl bg-[var(--bg-surface-alt)] border border-[var(--border-default)] text-xs text-[var(--text-secondary)] flex flex-col gap-1">
          <span className="font-semibold text-[var(--text-primary)]">Key Takeaway</span>
          <span>
            {key === 'moratorium'
              ? 'You do not have to worry about principal EMI while studying. Repayment starts only after college.'
              : key === 'foir'
                ? 'Lenders prefer that less than 50% of your salary goes into total EMIs for safe repayment.'
                : 'Your interest cost decreases automatically each month as you pay down your loan.'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => explainTerm(null)}
          className="w-full py-2.5 rounded-xl bg-[var(--color-signal-cyan)] text-white font-semibold text-sm hover:bg-[#009fd4] active:scale-95 transition-all"
        >
          Got it, thanks!
        </button>
      </div>
    </div>
  );
}
