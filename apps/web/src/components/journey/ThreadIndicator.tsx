'use client';

import React from 'react';
import { useJourneyStore } from '../../stores/journeyStore';

export function ThreadIndicator({ className = '' }: { className?: string }) {
  const { progress, state, label } = useJourneyStore();
  const pct = Math.round(progress * 100);

  // SVG path transitions from tangled curves to smooth curve as progress advances
  // At progress = 0: high wave amplitude and tangling
  // At progress = 1: smooth straight-line journey with verified points
  const p = Math.max(0, Math.min(1, progress));
  const curl1 = Math.round(40 * (1 - p * 0.8));
  const curl2 = Math.round(50 * (1 - p * 0.9));

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-[var(--text-primary)]">Journey Thread</span>
        <span className="tabular-nums font-medium text-[var(--color-signal-cyan)]">{pct}% Resolved</span>
      </div>

      <div className="relative h-14 w-full bg-[var(--bg-surface-alt)] rounded-xl border border-[var(--border-default)] p-2 overflow-hidden flex items-center">
        <svg
          viewBox="0 0 300 50"
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="threadGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--thread-unresolved)" />
              <stop offset={`${pct}%`} stopColor="var(--thread-resolved)" />
              <stop offset="100%" stopColor="var(--color-slate)" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Background guide track */}
          <path
            d="M 10 25 Q 75 10, 150 25 T 290 25"
            fill="none"
            stroke="var(--border-default)"
            strokeWidth="3"
            strokeDasharray="4 4"
          />

          {/* Dynamic resolving thread */}
          <path
            d={`M 10 25 C ${75 - curl1} ${25 - curl2}, ${150 + curl1} ${25 + curl2}, 290 25`}
            fill="none"
            stroke="url(#threadGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />

          {/* Journey milestone nodes */}
          <circle cx="10" cy="25" r="4" fill="var(--color-leaf)" />
          <circle cx="100" cy="25" r="4" fill={p >= 0.3 ? 'var(--color-leaf)' : 'var(--color-slate)'} />
          <circle cx="200" cy="25" r="4" fill={p >= 0.6 ? 'var(--color-leaf)' : 'var(--color-slate)'} />
          <circle cx="290" cy="25" r="4" fill={p >= 0.9 ? 'var(--color-signal-cyan)' : 'var(--color-slate)'} />
        </svg>
      </div>

      <div className="flex justify-between text-[10px] text-[var(--text-secondary)] px-1">
        <span>Intent</span>
        <span>Profile</span>
        <span>Options</span>
        <span>Apply</span>
      </div>
    </div>
  );
}
