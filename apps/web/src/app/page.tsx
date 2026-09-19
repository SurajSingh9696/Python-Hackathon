import type { Metadata } from 'next';
import Link from 'next/link';
import { LandingForm } from '@/components/landing/LandingForm';
import { DemoBadge } from '@/components/common/DemoBadge';
import { ExternalLink, Circle, CheckCircle2, ShieldCheck, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sahaj — Financial Journey Companion | The Ledger',
  description: 'AI-guided financial journey for education loans, health insurance, and personal credit with deterministic math and transparent guidance.',
};

const CATEGORIES = [
  {
    code: 'EDU-80E',
    title: 'Higher Education Loans',
    tag: 'Moratorium & 80E',
    tagClass: 'text-[var(--present-green)] bg-[var(--present-green)]/10 border-[var(--present-green)]/30',
    desc: 'Up to ₹1.5 Cr for India & abroad studies. Complete moratorium & 80E tax deduction schedules.',
    query: 'Mujhe Germany me MS ke liye 30 lakh ka education loan chahiye, salary 75 hazar hai',
  },
  {
    code: 'HLT-100',
    title: 'Family Health Cover',
    tag: '100% Cashless',
    tagClass: 'text-[var(--present-green)] bg-[var(--present-green)]/10 border-[var(--present-green)]/30',
    desc: '10,000+ network hospitals, zero room rent capping, instant hospital claim guidance.',
    query: 'Family ke liye 10 lakh ka comprehensive health cover chahiye, 4 members hain',
  },
  {
    code: 'PL-105',
    title: 'Instant Personal Credit',
    tag: 'From 10.5% p.a.',
    tagClass: 'text-[var(--roll-brass)] bg-[var(--roll-brass)]/10 border-[var(--roll-brass)]/30',
    desc: 'Exact reducing EMI from 10.5% p.a. Zero hidden fees or early foreclosure penalties.',
    query: 'Home improvement ke liye 5 lakh ka personal loan chahiye, lowest EMI options kya hain',
  },
  {
    code: 'MSME-CGT',
    title: 'MSME & Business Capital',
    tag: 'CGTMSE Covered',
    tagClass: 'text-[var(--roll-brass)] bg-[var(--roll-brass)]/10 border-[var(--roll-brass)]/30',
    desc: 'Collateral-free working capital under CGTMSE guarantee with transparent eligibility verification.',
    query: 'Business expansion ke liye 20 lakh working capital loan chahiye with flexible repayment',
  },
];

const TRUST_STATS = [
  { value: '₹2,500+ Cr', label: 'Calculated & Guided', subtext: 'Exact reducing math' },
  { value: '100%', label: 'Deterministic Accuracy', subtext: 'Zero hallucinated EMIs' },
  { value: '15+', label: 'RBI-Regulated Partners', subtext: 'Institutional trust' },
  { value: '< 1 Sec', label: 'Verification Latency', subtext: 'Sub-second checks' },
];

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-[var(--ledger-paper)] text-[var(--ink-navy)] font-sans">
      {/* ── Header: Crisp Ledger Top Bar ─────────────────────────────── */}
      <header className="h-14 px-4 sm:px-8 flex items-center justify-between border-b border-[var(--rule-line)] bg-[var(--card)] sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <span className="font-mono font-bold text-xl tracking-tight text-[var(--ink-navy)] flex items-center gap-2">
            Sahaj
            <span className="roll-chip text-[10px]">
              LEDGER v0.1
            </span>
          </span>
          <span className="text-[var(--muted-foreground)] text-xs font-mono hidden sm:inline border-l border-[var(--rule-line)] pl-3">
            RECORD BOOK
          </span>
        </div>

        <div className="flex items-center gap-3">
          <DemoBadge />
          <Link
            href="/journey"
            className="text-xs font-medium px-3 py-1.5 rounded-[6px] border border-[var(--rule-line)] hover:bg-[var(--muted)] transition-colors inline-flex items-center gap-1.5 text-[var(--ink-navy)]"
          >
            <ExternalLink size={14} />
            <span>Direct Console</span>
          </Link>
        </div>
      </header>

      {/* ── Hero Content: The Ledger Academic Layout ───────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-16 max-w-5xl mx-auto w-full animate-fade-up">
        {/* Academic Status Chip */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[6px] bg-[var(--card)] border border-[var(--rule-line)] text-xs text-[var(--ink-navy)] mb-8 font-mono">
          <Circle size={8} className="fill-current text-[var(--present-green)] animate-pulse" />
          <span className="font-medium">FINANCIAL RECORD COMPANION</span>
          <span className="text-[var(--rule-line)]">|</span>
          <span className="text-[var(--roll-brass)]">DETERMINISTIC MATH</span>
        </div>

        {/* Primary Heading */}
        <h1 className="font-sans text-3xl sm:text-4xl md:text-5xl font-semibold text-center text-[var(--ink-navy)] mb-3 max-w-2xl leading-tight tracking-tight">
          Finance that understands the user
        </h1>

        <p className="text-[var(--muted-foreground)] text-center text-sm md:text-base mb-8 max-w-xl leading-relaxed">
          State your goal in plain words. We verify regulatory policies, compute precise reducing-balance schedules, and document every milestone cleanly.
        </p>

        {/* The Ledger Input Container */}
        <LandingForm />

        {/* Trilingual Note */}
        <p className="mt-3 text-[11px] font-mono text-[var(--muted-foreground)] text-center">
          Available in English, Hindi (हिंदी) and Hinglish · Real-time speech and transcription
        </p>

        {/* ── Category Records ─────────────────────────────────────────── */}
        <div className="w-full mt-14 md:mt-16">
          <div className="flex items-center justify-between border-b border-[var(--rule-line)] pb-2 mb-4">
            <span className="text-label">
              Standard Loan &amp; Policy Categories
            </span>
            <span className="text-xs font-mono text-[var(--muted-foreground)]">
              4 RECORDS LOADED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {CATEGORIES.map((cat, i) => (
              <Link
                key={i}
                href={`/journey?q=${encodeURIComponent(cat.query)}`}
                className="p-4 rounded-[6px] bg-[var(--card)] border border-[var(--rule-line)] hover:border-[var(--roll-brass)] hover:bg-[var(--card)] transition-colors flex flex-col justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-medium text-[var(--muted-foreground)]">
                      [{cat.code}]
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] border ${cat.tagClass}`}>
                      {cat.tag}
                    </span>
                  </div>

                  <h3 className="font-medium text-sm text-[var(--ink-navy)] group-hover:text-[var(--present-green)] transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1.5 leading-relaxed">
                    {cat.desc}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-[var(--rule-line)] flex items-center justify-between text-xs font-mono text-[var(--ink-navy)]">
                  <span>View Terms</span>
                  <span className="group-hover:translate-x-0.5 transition-transform text-[var(--roll-brass)]">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Trust Stats Table / Ledger Row ──────────────────────────── */}
        <div className="w-full mt-8 rounded-[6px] bg-[var(--card)] border border-[var(--rule-line)] grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[var(--rule-line)]">
          {TRUST_STATS.map((stat, i) => (
            <div key={i} className="p-4 flex flex-col items-center justify-center text-center">
              <span className="text-display text-2xl sm:text-3xl text-[var(--ink-navy)] mb-1">
                {stat.value}
              </span>
              <span className="text-label text-[10px]">
                {stat.label}
              </span>
              <span className="text-[11px] font-mono text-[var(--muted-foreground)] mt-0.5">
                {stat.subtext}
              </span>
            </div>
          ))}
        </div>
      </main>

      {/* ── Footer: Academic Record Registry ─────────────────────────── */}
      <footer className="px-6 py-6 border-t border-[var(--rule-line)] bg-[var(--card)] text-xs text-[var(--muted-foreground)] mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 font-mono">
          <div className="flex flex-wrap items-center gap-2 text-center md:text-left">
            <span className="font-semibold text-[var(--ink-navy)]">Sahaj AI</span>
            <span>·</span>
            <span>The Ledger Architecture</span>
            <span>·</span>
            <span>RBI-Regulated Framework</span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/journey" className="hover:text-[var(--ink-navy)] transition-colors underline">
              Console
            </Link>
            <span>·</span>
            <span>Deterministic Engine</span>
            <span>·</span>
            <span>256-Bit SSL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
