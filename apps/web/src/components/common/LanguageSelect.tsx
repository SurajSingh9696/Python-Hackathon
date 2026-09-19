'use client';

import React from 'react';
import { useUIStore } from '../../stores/uiStore';
import type { Language } from '../../lib/i18n';

const LANGUAGES: Array<{ key: Language; label: string; sub: string }> = [
  { key: 'hinglish', label: 'Hinglish', sub: 'हिंदी + English' },
  { key: 'hi', label: 'हिंदी', sub: 'Hindi' },
  { key: 'en', label: 'English', sub: 'English' },
];

export function LanguageSelect() {
  const { language, setLanguage } = useUIStore();

  return (
    <div className="inline-flex rounded-[6px] border border-[var(--rule-line)] bg-[var(--card)] p-0.5 font-mono text-xs" role="radiogroup" aria-label="Select language">
      {LANGUAGES.map((l) => {
        const isSelected = language === l.key;
        return (
          <button
            key={l.key}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => setLanguage(l.key)}
            className={`px-2 py-0.5 text-[11px] font-mono rounded-[4px] transition-colors ${
              isSelected
                ? 'bg-[var(--muted)] text-[var(--ink-navy)] font-semibold'
                : 'text-[var(--muted-foreground)] hover:text-[var(--ink-navy)]'
            }`}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
}
