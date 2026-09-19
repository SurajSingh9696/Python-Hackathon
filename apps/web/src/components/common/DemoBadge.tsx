import React from 'react';

export function DemoBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-[var(--color-leaf)]/10 text-[var(--color-leaf)] border border-[var(--color-leaf)]/25 select-none ${className}`}
      role="status"
      aria-label="Security and verification status"
    >
      <span className="w-2 h-2 rounded-full bg-[var(--color-leaf)] animate-pulse" aria-hidden="true" />
      <span>Paytm Verified · 256-Bit SSL</span>
    </span>
  );
}
