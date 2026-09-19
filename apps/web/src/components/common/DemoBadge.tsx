import React from 'react';
import { Circle } from 'lucide-react';

export function DemoBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono rounded-[6px] bg-[var(--card)] text-[var(--ink-navy)] border border-[var(--rule-line)] select-none ${className}`}
      role="status"
      aria-label="Security and verification status"
    >
      <Circle size={6} className="fill-current text-[var(--present-green)] animate-pulse" aria-hidden="true" />
      <span>AUDITED · 256-BIT SSL</span>
    </span>
  );
}
