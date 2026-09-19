'use client';

import React from 'react';
import { useJourneyStore } from '../../stores/journeyStore';
import { useUIStore } from '../../stores/uiStore';
import { formatINR } from '@sahaj/shared';

export function AffordabilityArc() {
  const { affordability } = useJourneyStore();
  const { explainTerm } = useUIStore();

  if (!affordability) return null;

  const { foirPct, headroomMonthly, band, assumptions } = affordability;
  const clampedFoir = Math.max(0, Math.min(100, foirPct));
  const isSafe = band === 'comfortable';
  const isWarning = band === 'stretched';

  const fillColor = isSafe
    ? 'bg-[var(--present-green)]'
    : isWarning
    ? 'bg-[var(--roll-brass)]'
    : 'bg-[var(--absent-red)]';

  const statusTextColor = isSafe
    ? 'text-[var(--present-green)]'
    : isWarning
    ? 'text-[var(--roll-brass)]'
    : 'text-[var(--absent-red)]';

  return (
    <div className="flex flex-col gap-3 p-4 rounded-[6px] bg-[var(--card)] border border-[var(--rule-line)]">
      <div className="flex items-center justify-between border-b border-[var(--rule-line)] pb-2">
        <span className="text-label">
          Debt Service Ratio (FOIR)
        </span>
        <button
          type="button"
          onClick={() => explainTerm('foir')}
          className="text-xs font-mono text-[var(--roll-brass)] hover:underline cursor-pointer"
        >
          [RULE DETAILS]
        </button>
      </div>

      {/* Threshold Bar (AttendX Specification) */}
      <div className="flex flex-col gap-1.5 pt-1">
        <div className="flex items-baseline justify-between font-mono">
          <span className="text-xs text-[var(--muted-foreground)]">Fixed Obligation Burden</span>
          <span className={`text-sm font-bold tabular-nums ${statusTextColor}`}>
            {foirPct}%
          </span>
        </div>

        {/* 1px-bordered progress track with 50% RBI guideline tick */}
        <div className="relative w-full h-3 bg-[var(--muted)]/50 rounded-[4px] border border-[var(--rule-line)] overflow-hidden">
          <div
            className={`h-full ${fillColor} threshold-bar-fill`}
            style={{ width: `${clampedFoir}%` }}
          />
          {/* Regulatory 50% FOIR Safety Threshold Tick */}
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-[var(--roll-brass)]"
            style={{ left: '50%' }}
            title="50% RBI Prudential Limit"
          />
        </div>

        <div className="flex justify-between items-center text-[10px] font-mono text-[var(--muted-foreground)]">
          <span>0%</span>
          <span className="text-[var(--roll-brass)]">50% PRUDENTIAL LIMIT</span>
          <span>100%</span>
        </div>
      </div>

      {/* Numerical Ledger Breakdown */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--rule-line)] font-mono text-xs">
        <div className="flex flex-col">
          <span className="text-[10px] text-[var(--muted-foreground)] uppercase">Monthly Headroom</span>
          <span className="font-bold text-[var(--ink-navy)] tabular-nums text-sm">
            {formatINR(headroomMonthly)}
          </span>
        </div>

        <div className="flex flex-col text-right">
          <span className="text-[10px] text-[var(--muted-foreground)] uppercase">Calculated EMI</span>
          <span className="font-semibold text-[var(--ink-navy)] tabular-nums text-sm">
            {formatINR(assumptions['newEmi'] ?? 0)}/mo
          </span>
        </div>
      </div>
    </div>
  );
}
