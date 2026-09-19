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
    <header className="h-14 px-3 sm:px-6 flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-surface)]/90 backdrop-blur-md sticky top-0 z-40">
      {/* Left: Brand / Back */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="font-display font-semibold text-lg text-[#0F766E] dark:text-[#14B8A6] hover:opacity-80 transition-opacity flex items-center gap-1.5"
          style={{ fontVariationSettings: "'wdth' 125" }}
        >
          <span className="text-[#22D3EE]">←</span> Sahaj
        </Link>

        {/* State Badge */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[var(--border-default)] text-xs">
          <span className="capitalize font-medium text-[var(--text-primary)]">{domain}</span>
          <span className="text-[var(--text-secondary)]">·</span>
          <span className="text-[var(--text-secondary)]">{label}</span>
          <span className="text-[#0F766E] dark:text-[#22D3EE] font-semibold">{progressPct}%</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Remind Me */}
        <button
          type="button"
          onClick={() => setReminderOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-[var(--border-default)] text-[var(--text-primary)] hover:bg-[#0F766E]/10 transition-all"
          title="Schedule an automated journey reminder via WhatsApp or SMS"
        >
          <ClockIcon className="w-3.5 h-3.5 text-[#0F766E] dark:text-[#22D3EE]" />
          <span className="hidden lg:inline">Remind Me</span>
        </button>

        {/* Human Specialist Escalation */}
        <button
          type="button"
          onClick={() => setEscalationOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-[var(--border-default)] text-[var(--text-primary)] hover:bg-[#F59E0B]/10 transition-all"
          title="Connect with a human loan specialist"
        >
          <SupportIcon className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span className="hidden lg:inline">Specialist</span>
        </button>

        <button
          type="button"
          onClick={() => openDrawer(activeDrawer === 'behind-the-scenes' ? 'none' : 'behind-the-scenes')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
            activeDrawer === 'behind-the-scenes'
              ? 'bg-[#0F766E] text-white shadow-sm'
              : 'bg-[var(--border-default)] text-[var(--text-primary)] hover:bg-[#0F766E]/10'
          }`}
          title="See verified sources, retrieval trace, and deterministic calculations"
        >
          <SparklesIcon className="w-3.5 h-3.5" />
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
