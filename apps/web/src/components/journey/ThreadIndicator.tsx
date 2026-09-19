'use client';

import React from 'react';
import { useJourneyStore } from '../../stores/journeyStore';
import { Circle } from 'lucide-react';

export function ThreadIndicator({ className = '' }: { className?: string }) {
  const { progress, state, label } = useJourneyStore();
  const pct = Math.round(progress * 100);

  const p = Math.max(0, Math.min(1, progress));
  const curl1 = Math.round(30 * (1 - p * 0.8));
  const curl2 = Math.round(40 * (1 - p * 0.9));

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-label">
          <Circle size={6} className="fill-current text-[var(--present-green)] animate-pulse" />
          <span>Ledger Resolution</span>
        </div>
        <span className="font-mono font-medium text-[11px] px-2 py-0.5 rounded-[4px] border border-[var(--rule-line)] bg-[var(--card)] text-[var(--ink-navy)]">
          {pct}% COMPLETE
        </span>
      </div>

      <div className="relative h-12 w-full bg-[var(--card)] rounded-[6px] border border-[var(--rule-line)] p-2 overflow-hidden flex items-center">
        <svg
          viewBox="0 0 300 40"
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {/* Background guide track */}
          <path
            d="M 10 20 Q 75 10, 150 20 T 290 20"
            fill="none"
            stroke="var(--rule-line)"
            strokeWidth="2"
            strokeDasharray="3 3"
          />

          {/* Dynamic resolving thread */}
          <path
            d={`M 10 20 C ${75 - curl1} ${20 - curl2}, ${150 + curl1} ${20 + curl2}, 290 20`}
            fill="none"
            stroke="var(--present-green)"
            strokeWidth="3"
            strokeLinecap="round"
            className="transition-all duration-600 ease-out"
          />

          {/* Journey milestone nodes */}
          <circle cx="10" cy="20" r="4" fill="var(--present-green)" stroke="var(--card)" strokeWidth="2" />
          <circle cx="100" cy="20" r="4" fill={p >= 0.3 ? 'var(--present-green)' : 'var(--rule-line)'} stroke="var(--card)" strokeWidth="2" />
          <circle cx="200" cy="20" r="4" fill={p >= 0.6 ? 'var(--present-green)' : 'var(--rule-line)'} stroke="var(--card)" strokeWidth="2" />
          <circle cx="290" cy="20" r="4" fill={p >= 0.9 ? 'var(--roll-brass)' : 'var(--rule-line)'} stroke="var(--card)" strokeWidth="2" />
        </svg>
      </div>

      <div className="flex justify-between text-[10px] font-mono text-[var(--muted-foreground)] px-1">
        <span className={p >= 0.1 ? 'text-[var(--present-green)] font-semibold' : ''}>1. INTENT</span>
        <span className={p >= 0.3 ? 'text-[var(--present-green)] font-semibold' : ''}>2. PROFILE</span>
        <span className={p >= 0.6 ? 'text-[var(--present-green)] font-semibold' : ''}>3. COMPARE</span>
        <span className={p >= 0.9 ? 'text-[var(--roll-brass)] font-semibold' : ''}>4. AUDIT</span>
      </div>
    </div>
  );
}
