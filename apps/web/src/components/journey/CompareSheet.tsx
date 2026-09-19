'use client';

import React from 'react';
import { useJourneyStore } from '../../stores/journeyStore';
import { useUIStore } from '../../stores/uiStore';
import { formatINR, formatPct, emi } from '@sahaj/shared';
import { CheckCircleIcon, ShieldCheckIcon } from '../common/Icons';

export function CompareSheet() {
  const { products, profile } = useJourneyStore();
  const { selectedProductId, selectProduct, explainTerm } = useUIStore();

  if (products.length === 0) return null;

  const loanAmount = (profile['amount'] as number) || 200000;
  const tenureMonths = 36;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
          Verified Loan Options ({products.length})
        </h3>
        <span className="text-[11px] text-[var(--text-secondary)]">For ₹{loanAmount.toLocaleString('en-IN')} over 36 mo</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {products.map((prod) => {
          const isSelected = selectedProductId === prod.id || (!selectedProductId && prod.id === products[0]?.id);
          const computedEmi = Math.round(emi(loanAmount, prod.annualRateMin, tenureMonths));

          return (
            <div
              key={prod.id}
              onClick={() => selectProduct(prod.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                isSelected
                  ? 'border-[var(--color-signal-cyan)] bg-[var(--bg-surface)] ring-2 ring-[#00B9F1]/20 shadow-md'
                  : 'border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)]'
              }`}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-sm text-[var(--text-primary)] leading-snug">
                    {prod.name}
                  </h4>
                  {isSelected && (
                    <span className="shrink-0 text-[var(--color-signal-cyan)]">
                      <CheckCircleIcon className="w-4 h-4" />
                    </span>
                  )}
                </div>

                {/* Primary numbers */}
                <div className="flex items-baseline justify-between border-b border-[var(--border-default)] pb-2 mt-1">
                  <div>
                    <span className="text-xs text-[var(--text-secondary)] block">Monthly EMI</span>
                    <span className="text-lg font-bold tabular-nums text-[var(--color-ink-indigo)] dark:text-[var(--text-primary)]">
                      {formatINR(computedEmi)}
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)]">/mo</span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-[var(--text-secondary)] block">Rate</span>
                    <span className="text-sm font-semibold tabular-nums text-[var(--color-leaf)]">
                      {formatPct(prod.annualRateMin)}
                    </span>
                  </div>
                </div>

                {/* Moratorium Badge */}
                {prod.moratoriumAvailable && (
                  <div className="flex items-center gap-1.5 text-xs text-[var(--color-leaf)] bg-[var(--color-leaf)]/10 px-2 py-1 rounded-lg">
                    <ShieldCheckIcon className="w-3.5 h-3.5" />
                    <span>{prod.moratoriumMaxMonths} mo Moratorium</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        explainTerm('moratorium');
                      }}
                      className="ml-auto underline text-[10px] opacity-80"
                    >
                      Info
                    </button>
                  </div>
                )}

                {/* Conditions list */}
                <ul className="text-xs text-[var(--text-secondary)] flex flex-col gap-1 mt-1">
                  {prod.keyConditions.slice(0, 2).map((c, i) => (
                    <li key={i} className="flex items-start gap-1.5 leading-tight">
                      <span className="text-[var(--color-signal-cyan)]">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Select button */}
              <button
                type="button"
                className={`w-full py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  isSelected
                    ? 'bg-[var(--color-signal-cyan)] text-white'
                    : 'bg-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--color-signal-cyan)]/10'
                }`}
              >
                {isSelected ? 'Selected' : 'Select Option'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
