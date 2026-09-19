'use client';

import { create } from 'zustand';
import type { Language } from '../lib/i18n';

export type DrawerType = 'none' | 'behind-the-scenes' | 'why-this' | 'checklist' | 'compare';

interface UIState {
  language: Language;
  theme: 'light' | 'dark';
  activeDrawer: DrawerType;
  activeTerm: string | null;
  selectedProductId: string | null;
  isReminderOpen: boolean;
  isEscalationOpen: boolean;
  isVoiceAutoPlay: boolean;

  setLanguage: (lang: Language) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  openDrawer: (drawer: DrawerType) => void;
  closeDrawer: () => void;
  explainTerm: (term: string | null) => void;
  selectProduct: (id: string | null) => void;
  setReminderOpen: (open: boolean) => void;
  setEscalationOpen: (open: boolean) => void;
  setVoiceAutoPlay: (enabled: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  language: 'hinglish', // default Hinglish per demo brief
  theme: 'light',
  activeDrawer: 'none',
  activeTerm: null,
  selectedProductId: null,
  isReminderOpen: false,
  isEscalationOpen: false,
  isVoiceAutoPlay: true, // Default to interactive voice assistant on

  setLanguage: (language) => set({ language }),
  setTheme: (theme) => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      try {
        localStorage.setItem('sahaj-theme', theme);
      } catch {}
    }
    set({ theme });
  },
  openDrawer: (activeDrawer) => set({ activeDrawer }),
  closeDrawer: () => set({ activeDrawer: 'none' }),
  explainTerm: (activeTerm) => set({ activeTerm }),
  selectProduct: (selectedProductId) => set({ selectedProductId }),
  setReminderOpen: (isReminderOpen) => set({ isReminderOpen }),
  setEscalationOpen: (isEscalationOpen) => set({ isEscalationOpen }),
  setVoiceAutoPlay: (isVoiceAutoPlay) => set({ isVoiceAutoPlay }),
}));
