'use client';

import React from 'react';
import { useUIStore } from '../../stores/uiStore';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useUIStore();

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-1.5 rounded-[6px] border border-[var(--rule-line)] text-[var(--muted-foreground)] hover:text-[var(--ink-navy)] hover:bg-[var(--muted)] transition-colors inline-flex items-center justify-center"
      title={`Switch to ${theme === 'dark' ? 'Ledger Daylight' : 'Ledger Night'} mode`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
}
