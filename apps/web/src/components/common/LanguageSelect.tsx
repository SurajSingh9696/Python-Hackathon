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
    <div className="inline-flex rounded-xl bg-[var(--border-default)] p-0.5" role="radiogroup" aria-label="Select language">
      {LANGUAGES.map((l) => {
        const isSelected = language === l.key;
        return (
          <button
            key={l.key}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => setLanguage(l.key)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
              isSelected
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
}
