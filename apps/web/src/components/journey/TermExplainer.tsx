'use client';

import React from 'react';
import { useUIStore } from '../../stores/uiStore';
import { DICTIONARY } from '../../lib/i18n';
import { X, Info } from 'lucide-react';

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-up"
      role="dialog"
      aria-modal="true"
      aria-labelledby="term-title"
    >
      <div className="w-full max-w-md p-5 rounded-[6px] bg-[var(--card)] border border-[var(--rule-line)] flex flex-col gap-3 font-sans">
        <div className="flex items-center justify-between border-b border-[var(--rule-line)] pb-2">
          <div className="flex items-center gap-1.5 text-label">
            <Info size={14} className="text-[var(--roll-brass)]" />
            <h3 id="term-title" className="font-semibold text-xs text-[var(--ink-navy)]">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => explainTerm(null)}
            className="p-1 rounded-[4px] border border-[var(--rule-line)] text-[var(--muted-foreground)] hover:text-[var(--ink-navy)] hover:bg-[var(--muted)] transition-colors"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        <p className="text-xs text-[var(--ink-navy)] leading-relaxed">{explanation}</p>

        <div className="p-3 rounded-[4px] bg-[var(--ledger-paper)] border border-[var(--rule-line)] text-xs font-mono text-[var(--muted-foreground)] flex flex-col gap-1">
          <span className="text-label text-[10px]">Policy Summary</span>
          <span className="text-[11px] text-[var(--ink-navy)]">
            {key === 'moratorium'
              ? 'Zero principal EMI is charged during the educational period. Repayment commences after completion.'
              : key === 'foir'
                ? 'Under standard RBI prudential guidelines, lenders require total obligations to remain under 50% of monthly income.'
                : 'Interest accrues strictly on remaining unpaid principal balance, lowering monthly charges as principal is amortized.'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => explainTerm(null)}
          className="w-full py-1.5 rounded-[4px] border border-[var(--rule-line)] bg-[var(--muted)] text-[var(--ink-navy)] font-mono text-xs hover:bg-[var(--rule-line)]/50 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
