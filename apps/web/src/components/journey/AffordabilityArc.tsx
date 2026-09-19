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

  // Arc calculation: 180 degrees semi-circle
  // Value between 0% and 100%
  const clampedFoir = Math.max(0, Math.min(100, foirPct));
  const angle = (clampedFoir / 100) * 180;
  const strokeDashoffset = 188.5 * (1 - clampedFoir / 100);

  const bandColors = {
    comfortable: 'text-[var(--color-leaf)] stroke-[var(--color-leaf)]',
    stretched: 'text-[var(--color-saffron-thread)] stroke-[var(--color-saffron-thread)]',
    high: 'text-[var(--color-rose)] stroke-[var(--color-rose)]',
  };

  const bandLabels = {
    comfortable: 'Comfortable',
    stretched: 'Moderate / Stretched',
    high: 'High Burden',
  };

  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
          Repayment Capacity
        </h3>
        <button
          type="button"
          onClick={() => explainTerm('foir')}
          className="text-xs text-[var(--color-signal-cyan)] hover:underline font-medium cursor-pointer"
        >
          What is FOIR?
        </button>
      </div>

      <div className="flex items-center gap-4">
        {/* SVG Semi-Circle Gauge */}
        <div className="relative w-24 h-14 flex items-end justify-center shrink-0">
          <svg viewBox="0 0 100 55" className="w-full h-full overflow-visible">
            {/* Background Arc */}
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke="var(--border-default)"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Foreground Progress Arc */}
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              className={bandColors[band]}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray="125.6"
              strokeDashoffset={125.6 * (1 - clampedFoir / 100)}
            />
          </svg>
          <span className="absolute bottom-0 text-sm font-bold tabular-nums text-[var(--text-primary)]">
            {foirPct}%
          </span>
        </div>

        {/* Breakdown details */}
        <div className="flex flex-col text-xs gap-1 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-secondary)]">Status</span>
            <span className={`font-semibold capitalize ${bandColors[band]}`}>{bandLabels[band]}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-secondary)]">Monthly Headroom</span>
            <span className="font-semibold text-[var(--text-primary)] tabular-nums">
              {formatINR(headroomMonthly)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
            <span>New EMI</span>
            <span className="tabular-nums">{formatINR(assumptions['newEmi'] ?? 0)}/mo</span>
          </div>
        </div>
      </div>
    </div>
  );
}
