'use client';

import React from 'react';
import { useJourneyStore } from '../../stores/journeyStore';
import { useUIStore } from '../../stores/uiStore';
import { formatINR, formatPct, emi } from '@sahaj/shared';
import { CheckCircle2, ShieldCheck, Check } from 'lucide-react';

export function CompareSheet() {
  const { products, profile } = useJourneyStore();
  const { selectedProductId, selectProduct, explainTerm } = useUIStore();

  if (products.length === 0) return null;

  const loanAmount = (profile['amount'] as number) || 200000;
  const tenureMonths = 36;

  return (
    <div className="flex flex-col gap-2 p-4 rounded-[6px] bg-[var(--card)] border border-[var(--rule-line)]">
      <div className="flex items-center justify-between border-b border-[var(--rule-line)] pb-2">
        <span className="text-label">
          Verified Option Ledger ({products.length})
        </span>
        <span className="text-[11px] font-mono text-[var(--muted-foreground)]">
          PRINCIPAL: ₹{loanAmount.toLocaleString('en-IN')} / 36M
        </span>
      </div>

      {/* The Stats Table (AttendX Specification) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="text-label">Product / Bank</th>
              <th className="text-label text-right">Rate</th>
              <th className="text-label text-right">Monthly EMI</th>
              <th className="text-label text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((prod) => {
              const isSelected = selectedProductId === prod.id || (!selectedProductId && prod.id === products[0]?.id);
              const computedEmi = Math.round(emi(loanAmount, prod.annualRateMin, tenureMonths));

              return (
                <tr
                  key={prod.id}
                  onClick={() => selectProduct(prod.id)}
                  className={`border-b border-[var(--rule-line)] cursor-pointer transition-colors ${
                    isSelected ? 'bg-[var(--muted)]/50' : 'hover:bg-[var(--muted)]/20'
                  }`}
                >
                  <td className="py-2.5 px-3">
                    <div className="font-medium text-xs text-[var(--ink-navy)]">
                      {prod.name}
                    </div>
                    {prod.moratoriumAvailable && (
                      <div className="inline-flex items-center gap-1 text-[10px] font-mono text-[var(--present-green)] mt-0.5">
                        <ShieldCheck size={12} />
                        <span>{prod.moratoriumMaxMonths}mo Moratorium</span>
                      </div>
                    )}
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs font-semibold text-[var(--present-green)]">
                    {formatPct(prod.annualRateMin)}
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs font-bold text-[var(--ink-navy)]">
                    {formatINR(computedEmi)}
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectProduct(prod.id);
                      }}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-mono transition-colors ${
                        isSelected
                          ? 'bg-[var(--present-green)] text-white'
                          : 'border border-[var(--rule-line)] bg-[var(--card)] text-[var(--ink-navy)] hover:bg-[var(--muted)]'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check size={13} />
                          <span>Active</span>
                        </>
                      ) : (
                        <span>Select</span>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
