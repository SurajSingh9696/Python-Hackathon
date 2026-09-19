import type { Metadata, Viewport } from 'next';
import {
  Anek_Latin,
  Anek_Devanagari,
  Instrument_Sans,
  Noto_Sans_Devanagari,
} from 'next/font/google';
import './globals.css';

/* ── Fonts ──────────────────────────────────────────────────────── */
const anekLatin = Anek_Latin({
  subsets: ['latin'],
  axes: ['wdth'],            // Variable width axis — used on hero headline
  variable: '--font-anek-latin',
  display: 'swap',
});

const anekDevanagari = Anek_Devanagari({
  subsets: ['devanagari'],
  axes: ['wdth'],
  variable: '--font-anek-devanagari',
  display: 'swap',
});

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument-sans',
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
    { media: '(prefers-color-scheme: light)', color: '#F1F5FA' },
    { media: '(prefers-color-scheme: dark)', color: '#071633' },
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
        anekLatin.variable,
        anekDevanagari.variable,
        instrumentSans.variable,
        notoDevanagari.variable,
      ].join(' ')}
    >
      <head>
        {/* Preconnect to Google Fonts CDN */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased bg-[var(--bg-page)] text-[var(--text-primary)]">
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
