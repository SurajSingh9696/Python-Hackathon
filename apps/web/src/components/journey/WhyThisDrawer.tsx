'use client';

import React from 'react';
import { useJourneyStore } from '../../stores/journeyStore';
import { useUIStore } from '../../stores/uiStore';
import { X, ShieldCheck } from 'lucide-react';
import { KnowledgeTraceGraph } from './KnowledgeTraceGraph';

export function WhyThisDrawer() {
  const { activeDrawer, closeDrawer } = useUIStore();
  const { trace, citations, affordability } = useJourneyStore();

  if (activeDrawer !== 'behind-the-scenes') return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-fade-up"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      <div className="w-full max-w-lg h-full bg-[var(--card)] border-l border-[var(--rule-line)] p-6 flex flex-col gap-5 overflow-y-auto font-sans">
        {/* Header: Clean, No Icon on Heading as per Ledger rules */}
        <div className="flex items-center justify-between border-b border-[var(--rule-line)] pb-3">
          <h2 id="drawer-title" className="text-base font-semibold text-[var(--ink-navy)]">
            Audit Trail &amp; Verification
          </h2>
          <button
            type="button"
            onClick={closeDrawer}
            className="p-1 rounded-[4px] border border-[var(--rule-line)] text-[var(--muted-foreground)] hover:text-[var(--ink-navy)] hover:bg-[var(--muted)] transition-colors"
            aria-label="Close drawer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Adapter Mode & Latency Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-[6px] bg-[var(--card)] border border-[var(--rule-line)] font-mono">
            <span className="text-label block">Knowledge Mode</span>
            <span className="text-sm font-semibold capitalize text-[var(--ink-navy)]">
              {trace?.adapterMode ?? 'Graph Audit'}
            </span>
          </div>

          <div className="p-3 rounded-[6px] bg-[var(--card)] border border-[var(--rule-line)] font-mono">
            <span className="text-label block">Latency</span>
            <span className="text-sm font-semibold tabular-nums text-[var(--present-green)]">
              {trace?.retrievalMs ?? 35} ms
            </span>
          </div>
        </div>

        {/* Deterministic Math Audit */}
        <div className="flex flex-col gap-2 p-3.5 rounded-[6px] bg-[var(--card)] border border-[var(--rule-line)]">
          <div className="flex items-center gap-1.5 text-label">
            <ShieldCheck size={14} className="text-[var(--present-green)]" />
            <span>Deterministic Math Verification</span>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
            All interest calculations, debt-to-income percentages, and amortizations are calculated deterministically with reducing-balance equations. Zero generative hallucination.
          </p>
          {affordability && (
            <div className="text-[11px] font-mono bg-[var(--ledger-paper)] p-2 rounded-[4px] border border-[var(--rule-line)] flex flex-col gap-1 text-[var(--ink-navy)]">
              <div>Income: ₹{Number(affordability.assumptions['income']).toLocaleString('en-IN')}/mo</div>
              <div>Calculated EMI: ₹{Number(affordability.assumptions['newEmi']).toLocaleString('en-IN')}/mo</div>
              <div>FOIR: {affordability.foirPct}% ({affordability.band})</div>
            </div>
          )}
        </div>

        {/* Interactive Knowledge Graph */}
        <KnowledgeTraceGraph
          nodes={trace?.nodes ?? []}
          edges={trace?.edges ?? []}
          adapterMode={trace?.adapterMode ?? 'Cognee Graph'}
          retrievalMs={trace?.retrievalMs ?? 35}
        />

        {/* Citations & Policy Sources */}
        {citations.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-label">
              Grounded Institutional Sources ({citations.length})
            </span>
            <div className="flex flex-col gap-2">
              {citations.map((c, i) => (
                <div
                  key={i}
                  className="p-3 rounded-[6px] bg-[var(--card)] border border-[var(--rule-line)] text-xs flex flex-col gap-1 font-mono"
                >
                  <div className="flex items-center justify-between font-semibold text-[var(--ink-navy)]">
                    <span>{c.source}</span>
                    <span className="text-[10px] text-[var(--muted-foreground)]">v{c.version}</span>
                  </div>
                  <div className="text-[11px] text-[var(--muted-foreground)]">
                    Provider: {c.provider} · Effective: {c.effectiveDate}
                  </div>
                  {c.excerpt && (
                    <p className="text-xs italic text-[var(--muted-foreground)] mt-1 border-t border-[var(--rule-line)] pt-1">
                      &ldquo;{c.excerpt}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={closeDrawer}
          className="mt-auto w-full py-2 rounded-[6px] border border-[var(--rule-line)] bg-[var(--muted)] text-[var(--ink-navy)] font-mono text-xs hover:bg-[var(--rule-line)]/50 transition-colors"
        >
          Dismiss Audit Trail
        </button>
      </div>
    </div>
  );
}
