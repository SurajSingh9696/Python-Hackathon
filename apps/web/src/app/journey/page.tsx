'use client';

import React, { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useJourneyStore } from '../../stores/journeyStore';
import { JourneyHeader } from '../../components/journey/JourneyHeader';
import { ChatStream } from '../../components/journey/ChatStream';
import { MessageComposer } from '../../components/journey/MessageComposer';
import { IntentChips } from '../../components/journey/IntentChips';
import { ThreadIndicator } from '../../components/journey/ThreadIndicator';
import { AffordabilityArc } from '../../components/journey/AffordabilityArc';
import { CompareSheet } from '../../components/journey/CompareSheet';
import { DocChecklist } from '../../components/journey/DocChecklist';
import { TermExplainer } from '../../components/journey/TermExplainer';
import { WhyThisDrawer } from '../../components/journey/WhyThisDrawer';
import { NextStepBar } from '../../components/journey/NextStepBar';
import { FeedbackWidget } from '../../components/journey/FeedbackWidget';
import { ReminderModal } from '../../components/automation/ReminderModal';
import { EscalationModal } from '../../components/automation/EscalationModal';
import { JudgeChecklist } from '../../components/automation/JudgeChecklist';
import { DevFailureDrill } from '../../components/automation/DevFailureDrill';
import { useUIStore } from '../../stores/uiStore';

function JourneyContent() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get('q');
  const isJudgeMode = searchParams.get('judge') === '1';
  const isDevMode = searchParams.get('dev') === '1';
  const { initJourney, journeyId, products, affordability, checklist } = useJourneyStore();
  const { isReminderOpen, isEscalationOpen, setReminderOpen, setEscalationOpen } = useUIStore();

  useEffect(() => {
    if (!journeyId) {
      void initJourney(initialPrompt ?? undefined);
    }
  }, [journeyId, initialPrompt, initJourney]);

  const hasFinancialData = products.length > 0 || affordability !== null || checklist.length > 0;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[var(--ledger-paper)] text-[var(--ink-navy)] font-sans">
      {/* Header */}
      <JourneyHeader />

      {/* Main Layout: The Ledger Two-Column Record System */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden max-w-7xl w-full mx-auto animate-fade-up">
        {/* Left Column: Conversation Stream & Input */}
        <section
          className="flex-1 flex flex-col min-w-0 h-[calc(100dvh-3.5rem)] md:border-r border-[var(--rule-line)] bg-[var(--ledger-paper)]"
          aria-label="Journey Conversation"
        >
          {/* Thread Progress for mobile */}
          <div className="md:hidden px-4 pt-3">
            <ThreadIndicator className="bg-[var(--card)] p-3 rounded-[6px] border border-[var(--rule-line)]" />
          </div>

          {/* Conversation history & streaming tokens */}
          <ChatStream />

          {/* Context-aware suggestion chips */}
          <IntentChips />

          {/* Message feedback & input bar */}
          <div className="px-4">
            <FeedbackWidget />
          </div>

          <MessageComposer />
        </section>

        {/* Right Column: Ledger Financial Tools & Records */}
        <aside
          className="w-full md:w-[420px] lg:w-[460px] h-auto md:h-[calc(100dvh-3.5rem)] overflow-y-auto p-4 sm:p-5 flex flex-col gap-4 bg-[var(--card)]/40 border-l md:border-l-0 border-[var(--rule-line)]"
          aria-label="Financial Tools and Policies"
        >
          {/* Thread Resolution Indicator */}
          <div className="hidden md:block">
            <ThreadIndicator className="bg-[var(--card)] p-3 rounded-[6px] border border-[var(--rule-line)]" />
          </div>

          {/* Repayment Capacity & Affordability */}
          <AffordabilityArc />

          {/* Verified Product Options Table */}
          <CompareSheet />

          {/* Document Verification Checklist */}
          <DocChecklist />

          {!hasFinancialData && (
            <div className="p-6 rounded-[6px] bg-[var(--card)] border border-dashed border-[var(--rule-line)] text-center text-xs text-[var(--muted-foreground)] flex flex-col gap-2 my-auto font-mono">
              <span className="font-semibold text-[var(--ink-navy)] uppercase tracking-wider text-[11px]">Records Pending Verification</span>
              <p>
                Provide your goal and income details to populate the ledger with exact reducing EMIs, debt-ratio metrics, and required documentation.
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* Sticky Bottom Action */}
      <NextStepBar />

      {/* Popovers & Modals */}
      <TermExplainer />
      <WhyThisDrawer />

      {/* Phase 8 Automation Modals & Overlays */}
      {journeyId && (
        <>
          <ReminderModal
            journeyId={journeyId}
            isOpen={isReminderOpen}
            onClose={() => setReminderOpen(false)}
          />
          <EscalationModal
            journeyId={journeyId}
            isOpen={isEscalationOpen}
            onClose={() => setEscalationOpen(false)}
          />
        </>
      )}

      {/* Judge Evaluation & Chaos Failure Drill (Activated via ?judge=1 or ?dev=1) */}
      {isJudgeMode && <JudgeChecklist />}
      {isDevMode && <DevFailureDrill />}
    </div>
  );
}

export default function JourneyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] flex items-center justify-center bg-[var(--bg-page)] text-sm text-[var(--text-secondary)]">
          Loading your financial journey...
        </div>
      }
    >
      <JourneyContent />
    </Suspense>
  );
}
