import type { Metadata, Viewport } from 'next';
import {
  IBM_Plex_Sans,
  IBM_Plex_Mono,
  Noto_Sans_Devanagari,
} from 'next/font/google';
import './globals.css';

/* ── Fonts: The Ledger Two-Font System ───────────────────────────── */
const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex-sans',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
});

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '500', '600'],
  variable: '--font-noto-devanagari',
  display: 'swap',
});

/* ── Metadata ───────────────────────────────────────────────────── */
export const metadata: Metadata = {
  title: {
    default: 'Sahaj — Financial Journey Companion',
    template: '%s | Sahaj',
  },
  description:
    "Don't make users understand finance. Make finance understand the user.",
  keywords: ['loan', 'education loan', 'insurance', 'EMI calculator', 'financial guidance'],
  robots: { index: true, follow: true },
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#EDF2E9' },
    { media: '(prefers-color-scheme: dark)', color: '#121A18' },
  ],
};

import { QueryProvider } from '../lib/queryClient';

/* ── Root Layout ────────────────────────────────────────────────── */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={[
        ibmPlexSans.variable,
        ibmPlexMono.variable,
        notoDevanagari.variable,
      ].join(' ')}
    >
      <head>
        {/* Preconnect to Google Fonts CDN */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased bg-[var(--ledger-paper)] text-[var(--ink-navy)] font-sans selection:bg-[var(--muted)] selection:text-[var(--ink-navy)]">
        {/* Dark mode init script — runs before paint to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const stored = localStorage.getItem('sahaj-theme');
                const theme = stored ?? 'light';
                document.documentElement.setAttribute('data-theme', theme);
              } catch(e) {}
            `,
          }}
        />
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
