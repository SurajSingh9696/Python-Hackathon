'use client';

import React from 'react';
import Link from 'next/link';
import { useJourneyStore } from '../../stores/journeyStore';
import { useUIStore } from '../../stores/uiStore';
import { DemoBadge } from '../common/DemoBadge';
import { ThemeToggle } from '../common/ThemeToggle';
import { LanguageSelect } from '../common/LanguageSelect';
import { SparklesIcon, ClockIcon, SupportIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '../common/Icons';
import { speechOutput } from '../../lib/voiceEngine';

export function JourneyHeader() {
  const { state, label, domain, progress } = useJourneyStore();
  const { openDrawer, activeDrawer, setReminderOpen, setEscalationOpen, isVoiceAutoPlay, setVoiceAutoPlay } = useUIStore();

  const progressPct = Math.round(progress * 100);

  return (
    <header className="h-14 px-3 sm:px-6 flex items-center justify-between border-b border-[#E2ECE9] dark:border-slate-800 bg-white/95 dark:bg-[#132825]/95 backdrop-blur-md sticky top-0 z-40">
      {/* Left: Brand / Back */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="font-display font-bold text-lg text-[#0F766E] dark:text-[#14B8A6] hover:opacity-80 transition-opacity flex items-center gap-1.5"
          style={{ fontVariationSettings: "'wdth' 125" }}
        >
          <span className="text-[#06B6D4]">←</span> Sahaj
        </Link>

        {/* Live Session Pill */}
        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          SESSION ACTIVE
        </span>

        {/* State Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-[#1E293B] border border-[#E2ECE9] dark:border-slate-700 text-xs shadow-xs">
          <span className="capitalize font-semibold text-[#0F766E] dark:text-[#14B8A6]">{domain}</span>
          <span className="text-[#94A3B8]">·</span>
          <span className="text-[#475569] dark:text-slate-300 font-medium">{label}</span>
          <span className="px-1.5 py-0.5 rounded-md bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 font-bold text-[10px]">
            {progressPct}%
          </span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Remind Me */}
        <button
          type="button"
          onClick={() => setReminderOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#1E293B] border border-[#E2ECE9] dark:border-slate-700 text-[#334155] dark:text-slate-200 hover:border-[#0F766E]/40 hover:bg-teal-50/50 shadow-xs transition-all"
          title="Schedule an automated journey reminder via WhatsApp or SMS"
        >
          <ClockIcon className="w-3.5 h-3.5 text-[#0F766E] dark:text-[#22D3EE]" />
          <span className="hidden lg:inline">Remind Me</span>
        </button>

        {/* Human Specialist Escalation */}
        <button
          type="button"
          onClick={() => setEscalationOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#1E293B] border border-[#E2ECE9] dark:border-slate-700 text-[#334155] dark:text-slate-200 hover:border-[#F59E0B]/50 hover:bg-amber-50/50 shadow-xs transition-all"
          title="Connect with a human loan specialist"
        >
          <SupportIcon className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span className="hidden lg:inline">Specialist</span>
        </button>

        <button
          type="button"
          onClick={() => openDrawer(activeDrawer === 'behind-the-scenes' ? 'none' : 'behind-the-scenes')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeDrawer === 'behind-the-scenes'
              ? 'bg-[#0F766E] text-white shadow-sm'
              : 'bg-white dark:bg-[#1E293B] border border-[#E2ECE9] dark:border-slate-700 text-[#334155] dark:text-slate-200 hover:border-[#06B6D4]/50 hover:bg-cyan-50/50 shadow-xs'
          }`}
          title="See verified sources, retrieval trace, and deterministic calculations"
        >
          <SparklesIcon className="w-3.5 h-3.5 text-[#06B6D4]" />
          <span className="hidden md:inline">Behind the scenes</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (isVoiceAutoPlay) {
              speechOutput.stop();
            }
            setVoiceAutoPlay(!isVoiceAutoPlay);
          }}
          className={`p-2 rounded-xl border text-xs font-medium transition-all ${
            isVoiceAutoPlay
              ? 'bg-[#0F766E]/10 border-[#0F766E]/30 text-[#0F766E] dark:text-[#22D3EE]'
              : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[#0F766E]'
          }`}
          title={isVoiceAutoPlay ? 'Voice Assistant Narration: ON (Click to Mute)' : 'Voice Assistant Narration: MUTED (Click to Enable)'}
          aria-label={isVoiceAutoPlay ? 'Mute Voice Assistant' : 'Enable Voice Assistant'}
        >
          {isVoiceAutoPlay ? (
            <SpeakerWaveIcon className="w-4 h-4" />
          ) : (
            <SpeakerXMarkIcon className="w-4 h-4" />
          )}
        </button>

        <LanguageSelect />
        <ThemeToggle />
        <DemoBadge className="hidden xl:inline-flex" />
      </div>
    </header>
  );
}
