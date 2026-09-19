'use client';

import React, { useState } from 'react';
import { escalateJourney, type EscalateResponse } from '../../lib/api';
import { XMarkIcon, CheckCircleIcon, ShieldCheckIcon, AlertTriangleIcon } from '../common/Icons';

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="escalation-modal-title"
    >
      <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-3xl shadow-2xl p-6 flex flex-col gap-5 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="w-5 h-5 text-[var(--color-rust)]" />
            <h2 id="escalation-modal-title" className="text-base font-bold text-[var(--text-primary)]">
              Talk to a Human Specialist
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-default)] transition-colors"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {result ? (
          <div className="flex flex-col items-center text-center gap-3 py-4">
            <div className="w-12 h-12 rounded-full bg-[var(--color-leaf)]/10 text-[var(--color-leaf)] flex items-center justify-center">
              <CheckCircleIcon className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Specialist Dispatched</h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-xs leading-relaxed">
              {result.message}
            </p>
            <div className="text-[11px] font-mono text-[var(--text-secondary)] bg-[var(--bg-surface-alt)] p-2.5 rounded-xl border border-[var(--border-default)] flex flex-col gap-1 w-full text-left">
              <div><span className="font-semibold">Escalation Ref:</span> {result.escalationId}</div>
              <div><span className="font-semibold">Queue:</span> Noida Lending Desk (Priority)</div>
              <div><span className="font-semibold">Estimated Callback:</span> &lt; 15 mins</div>
            </div>
            <button
              type="button"
              onClick={() => {
                setResult(null);
                onClose();
              }}
              className="mt-2 w-full py-2.5 rounded-xl bg-[var(--color-signal-cyan)] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Back to Journey
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="p-3 rounded-2xl bg-[var(--color-rust)]/10 border border-[var(--color-rust)]/20 text-xs text-[var(--text-secondary)] flex items-start gap-2.5">
              <AlertTriangleIcon className="w-4 h-4 text-[var(--color-rust)] shrink-0 mt-0.5" />
              <span>
                Need dedicated advisory? Our certified credit specialists will review your journey and get in touch with you directly.
              </span>
            </div>

            {/* Reason Selection */}
            <div>
              <label className="text-xs font-semibold text-[var(--text-primary)] mb-1.5 block">
                Primary Reason
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-signal-cyan)] cursor-pointer"
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
              <label className="text-xs font-semibold text-[var(--text-primary)] mb-1.5 block">
                Additional Notes (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-signal-cyan)] resize-none"
                placeholder="Share any specific doubts or bank preferences..."
              />
            </div>

            {error && (
              <div className="text-xs text-[var(--color-rust)] bg-[var(--color-rust)]/10 p-2.5 rounded-xl border border-[var(--color-rust)]/20">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-[var(--border-default)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--border-default)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-[var(--color-rust)] text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Request Specialist'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
