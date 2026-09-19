'use client';

import React from 'react';
import { useJourneyStore } from '../../stores/journeyStore';
import { useUIStore } from '../../stores/uiStore';
import { ArrowRightIcon, CheckCircleIcon } from '../common/Icons';

export function NextStepBar() {
  const { products, state, progress } = useJourneyStore();
  const { selectedProductId } = useUIStore();

  if (products.length === 0 || progress < 0.5) return null;

  const selected = products.find((p) => p.id === selectedProductId) ?? products[0];
  if (!selected) return null;

  return (
    <div className="p-3 bg-[var(--color-ink-indigo)] text-white flex items-center justify-between gap-4 px-4 sm:px-6 shadow-lg z-20 border-t border-white/10">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[var(--color-leaf)] shrink-0">
          <CheckCircleIcon className="w-5 h-5" />
        </span>
        <div className="truncate text-xs sm:text-sm">
          <span className="font-semibold">{selected.name}</span>
          <span className="opacity-80 hidden sm:inline"> — {selected.keyConditions[0]}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => alert(`Starting application process for ${selected.name}...`)}
        className="shrink-0 bg-[var(--color-signal-cyan)] text-white font-semibold text-xs sm:text-sm px-4 py-2 rounded-xl hover:bg-[#009fd4] active:scale-95 transition-all flex items-center gap-1.5 shadow-md"
      >
        <span>Continue</span>
        <ArrowRightIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
