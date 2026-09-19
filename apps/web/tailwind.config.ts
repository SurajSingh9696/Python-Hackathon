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
      // ── AttendX Design System: "The Ledger" Palette ──────────
      colors: {
        'ledger-paper':     '#EDF2E9',  // Primary background: soft greenish off-white
        'card':             '#F5F8F2',  // Cards, popovers, elevated containers
        'popover':          '#F5F8F2',
        'ink-navy':         '#1E2A33',  // Primary text: deep slate navy
        'rule-line':        '#B9CBB0',  // Muted sage green: ALL borders & dividers
        'border':           '#B9CBB0',
        'muted':            '#D8E4D3',  // Subtle hover states, secondary background
        'secondary':        '#D8E4D3',
        'muted-foreground': '#5A7260',  // Secondary text, labels, subtext
        'present-green':    '#2F6B4F',  // Attended / Safe / Success
        'absent-red':       '#B33A2E',  // Missed / Risk / Destructive
        'roll-brass':       '#A9822F',  // Accent: brass rings, tags, highlights
        'paper-sand':       '#EDF2E9',

        // Backward compatibility mappings with Ledger palette
        'sahaj-teal':       '#2F6B4F',
        'sahaj-teal-light': '#3E8262',
        'sahaj-cyan':       '#2F6B4F',
        'sahaj-orange':     '#A9822F',
        'sahaj-amber':      '#A9822F',
        'sahaj-offwhite':   '#F5F8F2',
        'sahaj-charcoal':   '#1E2A33',
        'sahaj-slate':      '#5A7260',
        'sahaj-border':     '#B9CBB0',
        'sahaj-emerald':    '#2F6B4F',
        'sahaj-red':        '#B33A2E',

        'ink-indigo':       '#1E2A33',
        'deep-night':       '#121A18',
        'signal-cyan':      '#2F6B4F',
        'saffron-thread':   '#A9822F',
        'mist':             '#EDF2E9',
        'slate':            '#5A7260',
        'leaf':             '#2F6B4F',
        'rose':             '#B33A2E',
      },

      // ── Typography: IBM Plex Sans & IBM Plex Mono ────────────
      fontFamily: {
        sans: ['var(--font-ibm-plex-sans)', 'var(--font-noto-devanagari)', 'sans-serif'],
        display: ['var(--font-ibm-plex-mono)', 'ui-monospace', 'monospace'],
        body: ['var(--font-ibm-plex-sans)', 'var(--font-noto-devanagari)', 'sans-serif'],
        mono: ['var(--font-ibm-plex-mono)', 'ui-monospace', 'monospace'],
      },

      // ── Spacing / layout ─────────────────────────────────────
      maxWidth: {
        prose: '68ch',
        'journey-panel': '380px',
      },

      // ── Animation: Subtle 12px entrance ──────────────────────
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'thread-idle': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-3px)' },
        },
        'pulse-node': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.8', transform: 'scale(1.08)' },
        },
        'draw-in': {
          from: { strokeDashoffset: '1' },
          to:   { strokeDashoffset: '0' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.35s ease both',
        'fade-up': 'fadeUp 0.35s ease both',
        'thread-idle': 'thread-idle 6s ease-in-out infinite',
        'pulse-node':  'pulse-node 2s ease-in-out infinite',
        'draw-in':     'draw-in 0.6s ease-out forwards',
        shimmer:       'shimmer 1.5s linear infinite',
      },

      // ── Gradients ─────────────────────────────────────────────
      backgroundImage: {
        'thread-gradient':
          'linear-gradient(135deg, #A9822F 0%, #2F6B4F 100%)',
        'sahaj-signature':
          'linear-gradient(135deg, #A9822F 0%, #2F6B4F 100%)',
        'teal-gradient':
          'linear-gradient(135deg, #2F6B4F 0%, #3E8262 100%)',
      },

      // ── Border radius: 0.375rem / 6px sharp but friendly ─────
      borderRadius: {
        DEFAULT: '0.375rem',
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.375rem',
        xl: '0.375rem',
        '2xl': '0.375rem',
        card: '0.375rem', // 6px
        chip: '999px',
      },

      // ── Box shadow: AVOIDED ENTIRELY in Ledger ────────────────
      boxShadow: {
        none: 'none',
        card: 'none',
        'card-hover': 'none',
        'glow-cyan': 'none',
        'glow-orange': 'none',
        'glow-teal': 'none',
      },
    },
  },
  plugins: [],
};

export default config;
