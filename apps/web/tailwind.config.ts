import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      // ── Design token colours (Warm Fintech Palette) ──────────
      colors: {
        'sahaj-teal':       '#0F766E',  // Primary / Brand Deep Teal
        'sahaj-teal-light': '#14B8A6',  // Primary Bright Teal
        'sahaj-cyan':       '#22D3EE',  // Clarity / AI Accent
        'sahaj-orange':     '#F59E0B',  // Journey / Energy Warm Orange
        'sahaj-amber':      '#FBBF24',  // Amber Highlight
        'sahaj-offwhite':   '#F8FAF9',  // Warm Off-White
        'sahaj-charcoal':   '#17201F',  // Deep Charcoal text
        'sahaj-slate':      '#64748B',  // Slate secondary
        'sahaj-border':     '#DDE8E6',  // Soft Teal-Gray border
        'sahaj-emerald':    '#10B981',  // Success
        'sahaj-red':        '#EF4444',  // Error

        // Aliases for compatibility with existing classes:
        'ink-indigo':     '#0F766E',  // Deep Teal
        'deep-night':     '#0C1A18',  // Deep forest dark teal
        'signal-cyan':    '#22D3EE',  // Bright Cyan
        'saffron-thread': '#F59E0B',  // Warm Orange
        mist:             '#F8FAF9',  // Warm off-white
        slate:            '#64748B',  // Slate
        leaf:             '#10B981',  // Emerald
        rose:             '#EF4444',  // Red
      },

      // ── Typography ───────────────────────────────────────────
      fontFamily: {
        display: ['var(--font-anek-latin)', 'var(--font-anek-devanagari)', 'sans-serif'],
        body: ['var(--font-instrument-sans)', 'var(--font-noto-devanagari)', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },

      // ── Spacing / layout ─────────────────────────────────────
      maxWidth: {
        prose: '68ch',
        'journey-panel': '380px',
      },

      // ── Animation ────────────────────────────────────
      keyframes: {
        'thread-idle': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%':       { transform: 'translateY(-6px) rotate(0.5deg)' },
          '66%':       { transform: 'translateY(4px) rotate(-0.5deg)' },
        },
        'pulse-node': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.7', transform: 'scale(1.15)' },
        },
        'draw-in': {
          from: { strokeDashoffset: '1' },
          to:   { strokeDashoffset: '0' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'thread-idle': 'thread-idle 6s ease-in-out infinite',
        'pulse-node':  'pulse-node 2s ease-in-out infinite',
        'draw-in':     'draw-in 0.6s ease-out forwards',
        'fade-up':     'fade-up 0.4s ease-out forwards',
        shimmer:       'shimmer 1.5s linear infinite',
      },

      // ── Gradients (Warm Fintech & Thread) ─────────────────────
      backgroundImage: {
        'thread-gradient':
          'linear-gradient(135deg, #F59E0B 0%, #22D3EE 100%)',
        'sahaj-signature':
          'linear-gradient(135deg, #F59E0B 0%, #22D3EE 100%)',
        'teal-gradient':
          'linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)',
        'shimmer-gradient':
          'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
      },

      // ── Border radius ────────────────────────────────────────
      borderRadius: {
        card: '0.875rem', // 14px
        chip: '999px',
      },

      // ── Box shadow ───────────────────────────────────────────
      boxShadow: {
        card:  '0 2px 12px rgba(15, 118, 110, 0.06), 0 1px 3px rgba(15, 118, 110, 0.04)',
        'card-hover': '0 6px 24px rgba(15, 118, 110, 0.12), 0 2px 6px rgba(15, 118, 110, 0.08)',
        'glow-cyan':  '0 0 16px rgba(34, 211, 238, 0.35)',
        'glow-orange': '0 0 16px rgba(245, 158, 11, 0.35)',
        'glow-teal':  '0 0 16px rgba(15, 118, 110, 0.35)',
      },
    },
  },
  plugins: [],
};

export default config;
