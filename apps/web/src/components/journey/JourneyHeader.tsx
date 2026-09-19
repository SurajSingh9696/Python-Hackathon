'use client';

import React from 'react';
import Link from 'next/link';
import { useJourneyStore } from '../../stores/journeyStore';
import { useUIStore } from '../../stores/uiStore';
import { DemoBadge } from '../common/DemoBadge';
import { ThemeToggle } from '../common/ThemeToggle';
import { LanguageSelect } from '../common/LanguageSelect';
import {
  ChevronLeft,
  Clock,
  LifeBuoy,
  Sparkles,
  Volume2,
  VolumeX,
  Circle,
} from 'lucide-react';
import { speechOutput } from '../../lib/voiceEngine';

export function JourneyHeader() {
  const { state, label, domain, progress } = useJourneyStore();
  const { openDrawer, activeDrawer, setReminderOpen, setEscalationOpen, isVoiceAutoPlay, setVoiceAutoPlay } = useUIStore();

  const progressPct = Math.round(progress * 100);

  return (
    <header className="h-14 px-3 sm:px-6 flex items-center justify-between border-b border-[var(--rule-line)] bg-[var(--card)] sticky top-0 z-40">
      {/* Left: Nav Back & Journey Session Status */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="font-mono font-bold text-base text-[var(--ink-navy)] hover:text-[var(--present-green)] transition-colors inline-flex items-center gap-1"
        >
          <ChevronLeft size={16} />
          <span>Sahaj</span>
          <span className="hidden sm:inline font-serif text-sm text-[var(--muted-foreground)] tracking-wider ml-1 select-none" lang="hi">· सहज</span>
        </Link>

        {/* Live Ledger Session Dot */}
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] border border-[var(--rule-line)] bg-[var(--card)] text-[10px] font-mono text-[var(--ink-navy)]">
          <Circle size={7} className="fill-current text-[var(--present-green)] animate-pulse" />
          <span>LIVE</span>
        </span>

        {/* Domain & Stage Tag */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-0.5 rounded-[6px] border border-[var(--rule-line)] bg-[var(--card)] text-xs font-mono">
          <span className="capitalize font-semibold text-[var(--ink-navy)]">{domain}</span>
          <span className="text-[var(--rule-line)]">|</span>
          <span className="text-[var(--muted-foreground)]">{label}</span>
          <span className="text-[10px] px-1 py-0.2 rounded bg-[var(--muted)] text-[var(--ink-navy)] font-bold">
            {progressPct}%
          </span>
        </div>
      </div>

      {/* Right: Ledger Action Controls */}
      <div className="flex items-center gap-2">
        {/* Remind Me */}
        <button
          type="button"
          onClick={() => setReminderOpen(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-medium bg-[var(--card)] border border-[var(--rule-line)] text-[var(--ink-navy)] hover:bg-[var(--muted)] transition-colors"
          title="Schedule automated ledger reminder"
        >
          <Clock size={14} />
          <span className="hidden lg:inline">Remind</span>
        </button>

        {/* Human Specialist Escalation */}
        <button
          type="button"
          onClick={() => setEscalationOpen(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-medium bg-[var(--card)] border border-[var(--rule-line)] text-[var(--ink-navy)] hover:bg-[var(--muted)] transition-colors"
          title="Connect with human specialist"
        >
          <LifeBuoy size={14} />
          <span className="hidden lg:inline">Specialist</span>
        </button>

        {/* Behind The Scenes / Audit Trace */}
        <button
          type="button"
          onClick={() => openDrawer(activeDrawer === 'behind-the-scenes' ? 'none' : 'behind-the-scenes')}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-medium transition-colors border ${
            activeDrawer === 'behind-the-scenes'
              ? 'bg-[var(--ink-navy)] text-[var(--card)] border-[var(--ink-navy)]'
              : 'bg-[var(--card)] border-[var(--rule-line)] text-[var(--ink-navy)] hover:bg-[var(--muted)]'
          }`}
          title="View verified sources, deterministic formulas, and retrieval trace"
        >
          <Sparkles size={14} />
          <span className="hidden md:inline">Trace</span>
        </button>

        {/* Audio Assistant Toggle */}
        <button
          type="button"
          onClick={() => {
            if (isVoiceAutoPlay) {
              speechOutput.stop();
            }
            setVoiceAutoPlay(!isVoiceAutoPlay);
          }}
          className={`p-1.5 rounded-[6px] border text-xs transition-colors inline-flex items-center justify-center ${
            isVoiceAutoPlay
              ? 'bg-[var(--present-green)]/15 border-[var(--present-green)] text-[var(--present-green)]'
              : 'border-[var(--rule-line)] text-[var(--muted-foreground)] hover:text-[var(--ink-navy)] hover:bg-[var(--muted)]'
          }`}
          title={isVoiceAutoPlay ? 'Voice Narration: Active (Click to mute)' : 'Voice Narration: Muted (Click to enable)'}
          aria-label={isVoiceAutoPlay ? 'Mute Voice Assistant' : 'Enable Voice Assistant'}
        >
          {isVoiceAutoPlay ? <Volume2 size={14} /> : <VolumeX size={14} />}
        </button>

        <LanguageSelect />
        <ThemeToggle />
        <DemoBadge className="hidden xl:inline-flex" />
      </div>
    </header>
  );
}
