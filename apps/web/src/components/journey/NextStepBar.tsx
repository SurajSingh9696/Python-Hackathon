'use client';

import React from 'react';
import { useJourneyStore } from '../../stores/journeyStore';
import { useUIStore } from '../../stores/uiStore';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export function NextStepBar() {
  const { products, state, progress } = useJourneyStore();
  const { selectedProductId } = useUIStore();

  if (products.length === 0 || progress < 0.5) return null;

  const selected = products.find((p) => p.id === selectedProductId) ?? products[0];
  if (!selected) return null;

  return (
    <div className="p-2.5 bg-[var(--card)] text-[var(--ink-navy)] flex items-center justify-between gap-4 px-4 sm:px-6 border-t border-[var(--rule-line)] z-20 font-mono">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[var(--present-green)] shrink-0">
          <CheckCircle2 size={16} />
        </span>
        <div className="truncate text-xs">
          <span className="font-semibold text-[var(--ink-navy)]">{selected.name}</span>
          <span className="text-[var(--muted-foreground)] hidden sm:inline"> — {selected.keyConditions[0]}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => alert(`Starting application process for ${selected.name}...`)}
        className="shrink-0 bg-[var(--present-green)] hover:bg-[var(--present-green)]/90 text-white font-medium text-xs px-3.5 py-1.5 rounded-[4px] inline-flex items-center gap-1.5 transition-colors"
      >
        <ArrowRight size={14} />
        <span>Continue Application</span>
      </button>
    </div>
  );
}
