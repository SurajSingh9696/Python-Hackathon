'use client';

import React from 'react';
import { useJourneyStore } from '../../stores/journeyStore';
import { useUIStore } from '../../stores/uiStore';
import { XMarkIcon, ShieldCheckIcon, SparklesIcon } from '../common/Icons';

import { KnowledgeTraceGraph } from './KnowledgeTraceGraph';

export function WhyThisDrawer() {
  const { activeDrawer, closeDrawer } = useUIStore();
  const { trace, citations, affordability, profile } = useJourneyStore();

  if (activeDrawer !== 'behind-the-scenes') return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      <div className="w-full max-w-lg h-full bg-[var(--bg-surface)] border-l border-[var(--border-default)] shadow-2xl p-6 flex flex-col gap-6 overflow-y-auto animate-slideInRight">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-4">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-[var(--color-signal-cyan)]" />
            <h2 id="drawer-title" className="text-base font-bold text-[var(--text-primary)]">
              Behind the Scenes
            </h2>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="p-1.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-default)] transition-colors"
            aria-label="Close drawer"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Adapter Mode & Latency Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-default)]">
            <span className="text-[11px] text-[var(--text-secondary)] block">Knowledge Engine</span>
            <span className="text-sm font-semibold capitalize text-[var(--color-signal-cyan)]">
              {trace?.adapterMode ?? 'Cognee Graph'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-default)]">
            <span className="text-[11px] text-[var(--text-secondary)] block">Retrieval Latency</span>
            <span className="text-sm font-semibold tabular-nums text-[var(--color-leaf)]">
              {trace?.retrievalMs ?? 35} ms
            </span>
          </div>
        </div>

        {/* Deterministic Math Audit */}
        <div className="flex flex-col gap-2 p-4 rounded-2xl bg-[var(--bg-surface-alt)] border border-[var(--border-default)]">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
            <ShieldCheckIcon className="w-4 h-4 text-[var(--color-leaf)]" />
            <span>Deterministic Math (Zero LLM Calculation)</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            All rates, EMIs, and affordability FOIR metrics are computed strictly with reducing-balance financial formulas. The AI only explains the verified output.
          </p>
          {affordability && (
            <div className="text-[11px] font-mono bg-[var(--bg-surface)] p-2.5 rounded-lg border border-[var(--border-default)] flex flex-col gap-1 text-[var(--text-primary)]">
              <div>Income: ₹{Number(affordability.assumptions['income']).toLocaleString('en-IN')}/mo</div>
              <div>Calculated EMI: ₹{Number(affordability.assumptions['newEmi']).toLocaleString('en-IN')}/mo</div>
              <div>FOIR: {affordability.foirPct}% ({affordability.band})</div>
            </div>
          )}
        </div>

        {/* Interactive Animated SVG Knowledge Retrieval Graph */}
        <KnowledgeTraceGraph
          nodes={trace?.nodes ?? []}
          edges={trace?.edges ?? []}
          adapterMode={trace?.adapterMode ?? 'Cognee Graph'}
          retrievalMs={trace?.retrievalMs ?? 35}
        />


        {/* Citations & Policy Sources */}
        {citations.length > 0 && (
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Grounded Citations ({citations.length})
            </h3>
            <div className="flex flex-col gap-2.5">
              {citations.map((c, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-default)] text-xs flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between font-semibold text-[var(--text-primary)]">
                    <span>{c.source}</span>
                    <span className="text-[10px] text-[var(--text-secondary)]">v{c.version}</span>
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    Provider: {c.provider} · Effective: {c.effectiveDate}
                  </div>
                  {c.excerpt && (
                    <p className="text-xs italic text-[var(--text-secondary)] mt-1 border-t border-[var(--border-default)] pt-1">
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
          className="mt-auto w-full py-2.5 rounded-xl bg-[var(--border-default)] text-[var(--text-primary)] font-semibold text-sm hover:bg-[var(--border-strong)] transition-colors"
        >
          Close Drawer
        </button>
      </div>
    </div>
  );
}
