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
        <div className="flex items-center gap-1.5 font-bold text-[#0F766E] dark:text-[#22D3EE]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Journey Milestones</span>
        </div>
        <span className="tabular-nums font-bold text-[11px] px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300">
          {pct}% Resolved
        </span>
      </div>

      <div className="relative h-14 w-full bg-white dark:bg-[#1E293B] rounded-xl border border-[#E2ECE9] dark:border-slate-700 p-2 overflow-hidden flex items-center shadow-xs">
        <svg
          viewBox="0 0 300 50"
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="threadGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset={`${pct}%`} stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.25" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#06B6D4" floodOpacity="0.4"/>
            </filter>
          </defs>

          {/* Background guide track */}
          <path
            d="M 10 25 Q 75 10, 150 25 T 290 25"
            fill="none"
            stroke="#E2ECE9"
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
            filter="url(#glow)"
            className="transition-all duration-700 ease-out"
          />

          {/* Journey milestone nodes with colorful halos */}
          <circle cx="10" cy="25" r="5" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
          <circle cx="100" cy="25" r="5" fill={p >= 0.3 ? '#0F766E' : '#CBD5E1'} stroke="#FFFFFF" strokeWidth="2" />
          <circle cx="200" cy="25" r="5" fill={p >= 0.6 ? '#06B6D4' : '#CBD5E1'} stroke="#FFFFFF" strokeWidth="2" />
          <circle cx="290" cy="25" r="5" fill={p >= 0.9 ? '#F59E0B' : '#CBD5E1'} stroke="#FFFFFF" strokeWidth="2" />
        </svg>
      </div>

      <div className="flex justify-between text-[11px] font-semibold text-[#64748B] px-1">
        <span className="text-[#10B981]">1. Intent</span>
        <span className={p >= 0.3 ? 'text-[#0F766E]' : 'opacity-70'}>2. Profile</span>
        <span className={p >= 0.6 ? 'text-[#06B6D4]' : 'opacity-70'}>3. Compare</span>
        <span className={p >= 0.9 ? 'text-[#F59E0B]' : 'opacity-70'}>4. Sanction</span>
      </div>
    </div>
  );
}
