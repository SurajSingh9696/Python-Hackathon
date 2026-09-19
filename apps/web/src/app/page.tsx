import type { Metadata } from 'next';
import Link from 'next/link';
import { LandingForm } from '@/components/landing/LandingForm';
import { DemoBadge } from '@/components/common/DemoBadge';
import { SparklesIcon, ShieldCheckIcon, CheckCircleIcon } from '@/components/common/Icons';

export const metadata: Metadata = {
  title: 'Sahaj — Financial Journey Companion | Paytm',
  description: 'AI-guided financial journey for education loans, health insurance, and personal credit with deterministic math and transparent guidance.',
};

const CATEGORIES = [
  {
    icon: '🎓',
    title: 'Higher Education Loans',
    tag: 'Moratorium & 80E',
    tagColor: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
    accentColor: 'from-[#0F766E] to-[#22D3EE]',
    iconBg: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30',
    desc: 'Up to ₹1.5 Cr for India & abroad studies. Flexible repayment & 80E tax benefits.',
    query: 'Mujhe Germany me MS ke liye 30 lakh ka education loan chahiye, salary 75 hazar hai',
  },
  {
    icon: '🏥',
    title: 'Family Health Cover',
    tag: '100% Cashless',
    tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    accentColor: 'from-[#10B981] to-[#0F766E]',
    iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30',
    desc: '10,000+ network hospitals, zero room rent capping, instant claim guidance.',
    query: 'Family ke liye 10 lakh ka comprehensive health cover chahiye, 4 members hain',
  },
  {
    icon: '⚡',
    title: 'Instant Personal Credit',
    tag: 'From 10.5% p.a.',
    tagColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    accentColor: 'from-[#F59E0B] to-[#FBBF24]',
    iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30',
    desc: 'Calculated reducing EMI from 10.5% p.a. Zero hidden fees or foreclosure penalty.',
    query: 'Home improvement ke liye 5 lakh ka personal loan chahiye, lowest EMI options kya hain',
  },
  {
    icon: '🏢',
    title: 'MSME & Business Capital',
    tag: 'CGTMSE Covered',
    tagColor: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800',
    accentColor: 'from-[#06B6D4] to-[#0F766E]',
    iconBg: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30',
    desc: 'Working capital under CGTMSE guarantee with transparent eligibility calculation.',
    query: 'Business expansion ke liye 20 lakh working capital loan chahiye with flexible repayment',
  },
];

const TRUST_STATS = [
  { value: '₹2,500+ Cr', label: 'Guided & Calculated', icon: '💰', badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: '100%', label: 'Deterministic Math', icon: '⚡', badgeBg: 'bg-teal-50 text-teal-700 border-teal-200' },
  { value: '15+', label: 'RBI-Regulated Partners', icon: '🏛️', badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { value: '< 1 Sec', label: 'Instant Evaluation', icon: '⏱️', badgeBg: 'bg-amber-50 text-amber-700 border-amber-200' },
];

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-[var(--bg-page)] text-[var(--text-primary)]">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="h-16 px-4 md:px-8 flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-surface)]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <span
            className="font-display font-bold text-2xl tracking-tight text-[#0F766E] dark:text-[#14B8A6] flex items-center gap-1.5"
            style={{ fontVariationSettings: "'wdth' 125" }}
          >
            Sahaj
            <span className="text-xs px-2 py-0.5 rounded-md bg-[#22D3EE]/15 text-[#0F766E] dark:text-[#22D3EE] font-mono font-semibold">
              AI
            </span>
          </span>
          <span className="text-[var(--text-secondary)] text-sm font-medium hidden sm:inline border-l border-[var(--border-default)] pl-3">
            सहज
          </span>
        </div>

        <div className="flex items-center gap-3">
          <DemoBadge />
          <Link
            href="/journey"
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-[var(--border-default)] hover:border-[#0F766E]/40 hover:bg-[#0F766E]/5 transition-all hidden sm:inline-flex items-center gap-1 text-[#0F766E] dark:text-[#14B8A6]"
          >
            <span>Direct Console</span>
            <span>→</span>
          </Link>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-20 max-w-6xl mx-auto w-full">
        {/* Clean Fintech Trust Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white dark:bg-[#1E293B] border border-[#DDE8E6] dark:border-teal-900/40 shadow-sm text-xs font-semibold text-[#0F766E] dark:text-[#22D3EE] mb-8 hover:border-[#14B8A6] transition-all">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
          </span>
          <span>AI-Powered Financial Journey Companion</span>
          <span className="text-[#94A3B8]">·</span>
          <span className="text-[#F59E0B] font-medium">100% Deterministic Math</span>
        </div>

        {/* Headline */}
        <h1
          className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-center text-[var(--text-primary)] mb-4 max-w-3xl leading-[1.15] tracking-tight"
          style={{ fontVariationSettings: "'wdth' 115" }}
        >
          Finance that{' '}
          <span className="bg-gradient-to-r from-[#F59E0B] via-[#0F766E] to-[#22D3EE] bg-clip-text text-transparent">
            understands you
          </span>
        </h1>

        <p className="text-[var(--text-secondary)] text-center text-base md:text-xl mb-10 max-w-2xl leading-relaxed font-body">
          Tell us your goal in everyday words. We untangle policies, compute exact reducing-balance EMIs, and guide you through every milestone.
        </p>

        {/* Interactive Form with Voice Typing */}
        <LandingForm />

        {/* Language note */}
        <p className="mt-4 text-xs text-[var(--text-secondary)] text-center">
          Speak or type in English, Hindi (हिंदी) or Hinglish — voice recognition and responses enabled.
        </p>

        {/* ── Category Cards Grid ──────────────────────────────── */}
        <div className="w-full mt-16 md:mt-20">
          <div className="text-center mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E] dark:text-[#14B8A6]">
              Explore Popular Solutions
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] mt-1 font-display">
              Tailored assistance across your life milestones
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CATEGORIES.map((cat, i) => (
              <Link
                key={i}
                href={`/journey?q=${encodeURIComponent(cat.query)}`}
                className="relative p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-[#E2ECE9] dark:border-slate-700/80 hover:border-[#0F766E]/60 hover:shadow-md transition-all duration-200 flex flex-col justify-between group overflow-hidden"
              >
                {/* Vibrant accent stripe on top of card */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${cat.accentColor}`} />

                <div>
                  <div className="flex items-center justify-between mb-3.5 pt-1">
                    <div className={`w-10 h-10 rounded-xl ${cat.iconBg} flex items-center justify-center text-xl shadow-xs group-hover:scale-110 transition-transform`}>
                      {cat.icon}
                    </div>
                    <span className={`text-[10px] font-bold tracking-tight px-2.5 py-0.5 rounded-full border ${cat.tagColor}`}>
                      {cat.tag}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-[var(--text-primary)] group-hover:text-[#0F766E] dark:group-hover:text-[#14B8A6] transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                    {cat.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E2ECE9] dark:border-slate-700/60 flex items-center justify-between text-xs font-bold text-[#0F766E] dark:text-[#14B8A6]">
                  <span>Explore Plan</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Trust Metrics Row with Vibrant Badges ───────────── */}
        <div className="w-full mt-12 py-6 px-6 rounded-2xl bg-white dark:bg-[#1E293B] border border-[#E2ECE9] dark:border-slate-700/80 shadow-xs grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {TRUST_STATS.map((stat, i) => (
            <div key={i} className="flex flex-col items-center justify-center gap-1">
              <span className={`text-xs px-2 py-0.5 rounded-md border font-semibold ${stat.badgeBg} flex items-center gap-1 mb-1`}>
                <span>{stat.icon}</span>
                <span>Verified</span>
              </span>
              <span className="font-display font-bold text-2xl md:text-3xl text-[#0F766E] dark:text-[#22D3EE] tabular-nums">
                {stat.value}
              </span>
              <span className="text-xs text-[var(--text-secondary)] font-medium">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </main>

      {/* ── Realistic Fintech Footer ────────────────────────── */}
      <footer className="px-6 py-8 border-t border-[var(--border-default)] bg-[var(--bg-surface)] text-xs text-[var(--text-secondary)]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <span className="font-bold text-[var(--text-primary)]">Sahaj AI</span>
            <span>·</span>
            <span>One97 Communications Limited Partner Network</span>
            <span>·</span>
            <span>RBI-Regulated Lending &amp; IRDAI Insurance Framework</span>
          </div>

          <div className="flex items-center gap-4 text-center">
            <Link href="/journey" className="hover:text-[var(--color-signal-cyan)] transition-colors font-medium">
              Journey Console
            </Link>
            <span>·</span>
            <span className="opacity-80">256-Bit SSL Encrypted</span>
            <span>·</span>
            <span className="opacity-80">Zero Math Hallucination</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
