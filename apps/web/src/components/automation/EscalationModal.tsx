'use client';

import React, { useState } from 'react';
import { escalateJourney, type EscalateResponse } from '../../lib/api';
import { X, CheckCircle2, LifeBuoy, AlertTriangle } from 'lucide-react';

interface EscalationModalProps {
  journeyId: string;
  isOpen: boolean;
  onClose: () => void;
}

const REASONS = [
  'Need help understanding complex loan clauses & collateral',
  'Document verification query or high-value exception',
  'Moratorium & customized repayment schedule request',
  'Interest subsidy (CSIS) eligibility check',
  'Other human specialist advice',
];

export function EscalationModal({ journeyId, isOpen, onClose }: EscalationModalProps) {
  const [reason, setReason] = useState(REASONS[0]!);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EscalateResponse | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await escalateJourney(journeyId, {
        reason,
        comment: comment.trim() || undefined,
      });
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to escalate journey');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-up"
      role="dialog"
      aria-modal="true"
      aria-labelledby="escalation-title"
    >
      <div className="w-full max-w-md p-5 rounded-[6px] bg-[var(--card)] border border-[var(--rule-line)] flex flex-col gap-4 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--rule-line)] pb-2.5">
          <div className="flex items-center gap-1.5 text-label">
            <LifeBuoy size={14} className="text-[var(--roll-brass)]" />
            <h3 id="escalation-title" className="font-semibold text-xs text-[var(--ink-navy)]">
              Human Specialist Escalation
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[4px] border border-[var(--rule-line)] text-[var(--muted-foreground)] hover:text-[var(--ink-navy)] hover:bg-[var(--muted)] transition-colors"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        {result ? (
          <div className="flex flex-col gap-3 py-2 font-mono">
            <div className="flex items-start gap-2 text-[var(--present-green)]">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-xs block text-[var(--ink-navy)]">Specialist Queued</span>
                <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                  {result.message}
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-[4px] bg-[var(--ledger-paper)] border border-[var(--rule-line)] text-[11px] flex flex-col gap-1 text-[var(--ink-navy)]">
              <div><span className="text-[var(--muted-foreground)]">REF:</span> {result.escalationId}</div>
              <div><span className="text-[var(--muted-foreground)]">DESK:</span> Priority Lending Verification</div>
            </div>

            <button
              type="button"
              onClick={() => {
                setResult(null);
                onClose();
              }}
              className="w-full py-1.5 rounded-[4px] border border-[var(--rule-line)] bg-[var(--muted)] text-[var(--ink-navy)] text-xs font-mono hover:bg-[var(--rule-line)]/50 transition-colors"
            >
              Back to Ledger
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="alert-card p-2.5 text-xs flex items-start gap-2">
              <AlertTriangle size={14} className="text-[var(--absent-red)] shrink-0 mt-0.5" />
              <span className="text-[var(--ink-navy)]">
                Our certified credit officers review your application parameters and verify exception handling directly.
              </span>
            </div>

            {/* Reason Selection */}
            <div>
              <label className="text-label mb-1 block">
                Primary Inquiry Reason
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-xs p-2 rounded-[4px] border border-[var(--rule-line)] bg-[var(--card)] text-[var(--ink-navy)] focus:outline focus:outline-2 focus:outline-[var(--roll-brass)] cursor-pointer font-sans"
              >
                {REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Additional details */}
            <div>
              <label className="text-label mb-1 block">
                Notes &amp; Particulars (Optional)
              </label>
              <div className="p-2 rounded-[4px] border border-[var(--rule-line)] bg-[var(--card)] focus-within:outline focus-within:outline-2 focus-within:outline-[var(--roll-brass)]">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="w-full text-xs bg-transparent border-none outline-none resize-none text-[var(--ink-navy)] font-sans"
                  style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                  placeholder="Provide specific institution requirements..."
                />
              </div>
            </div>

            {error && (
              <div className="alert-card p-2 text-xs font-mono">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-1 font-mono text-xs">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-1.5 rounded-[4px] border border-[var(--rule-line)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-1.5 rounded-[4px] bg-[var(--present-green)] hover:bg-[var(--present-green)]/90 text-white font-medium inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <LifeBuoy size={14} />
                <span>{isSubmitting ? 'Dispatching...' : 'Request Specialist'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
