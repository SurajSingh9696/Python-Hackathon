'use client';

import React, { useState } from 'react';
import { scheduleReminder, type ReminderResponse } from '../../lib/api';
import { Clock, X, CheckCircle2 } from 'lucide-react';

interface ReminderModalProps {
  journeyId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ReminderModal({ journeyId, isOpen, onClose }: ReminderModalProps) {
  const [channel, setChannel] = useState<'whatsapp' | 'sms' | 'push' | 'email'>('whatsapp');
  const [note, setNote] = useState('Review education loan comparison & upload admission letter');
  const [timing, setTiming] = useState<'tomorrow' | '3days' | '1week' | 'custom'>('tomorrow');
  const [customDate, setCustomDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReminderResponse | null>(null);

  if (!isOpen) return null;

  const calculateRemindAt = (): string => {
    const now = new Date();
    if (timing === 'tomorrow') {
      now.setDate(now.getDate() + 1);
      now.setHours(10, 0, 0, 0);
      return now.toISOString();
    }
    if (timing === '3days') {
      now.setDate(now.getDate() + 3);
      now.setHours(10, 0, 0, 0);
      return now.toISOString();
    }
    if (timing === '1week') {
      now.setDate(now.getDate() + 7);
      now.setHours(10, 0, 0, 0);
      return now.toISOString();
    }
    if (timing === 'custom' && customDate) {
      return new Date(customDate).toISOString();
    }
    return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      setError('Please enter a reminder note.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await scheduleReminder(journeyId, {
        note: note.trim(),
        channel,
        remindAt: calculateRemindAt(),
      });
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to schedule reminder');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-up"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reminder-title"
    >
      <div className="w-full max-w-md p-5 rounded-[6px] bg-[var(--card)] border border-[var(--rule-line)] flex flex-col gap-4 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--rule-line)] pb-2.5">
          <div className="flex items-center gap-1.5 text-label">
            <Clock size={14} className="text-[var(--roll-brass)]" />
            <h3 id="reminder-title" className="font-semibold text-xs text-[var(--ink-navy)]">
              Scheduled Audit Reminder
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
          /* Confirmation View */
          <div className="flex flex-col gap-3 py-2 font-mono">
            <div className="flex items-start gap-2 text-[var(--present-green)]">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-xs block text-[var(--ink-navy)]">Reminder Scheduled</span>
                <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                  {result.message}
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-[4px] bg-[var(--ledger-paper)] border border-[var(--rule-line)] text-[11px] flex flex-col gap-1 text-[var(--ink-navy)]">
              <div><span className="text-[var(--muted-foreground)]">CHANNEL:</span> {channel.toUpperCase()}</div>
              <div><span className="text-[var(--muted-foreground)]">SCHEDULED FOR:</span> {new Date(calculateRemindAt()).toLocaleString('en-IN')}</div>
              <div><span className="text-[var(--muted-foreground)]">EVENT ID:</span> {result.eventId}</div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-1.5 rounded-[4px] border border-[var(--rule-line)] bg-[var(--muted)] text-[var(--ink-navy)] text-xs font-mono hover:bg-[var(--rule-line)]/50 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          /* Input Form */
          <form onSubmit={handleSchedule} className="flex flex-col gap-3">
            {/* Channel selection */}
            <div>
              <label className="text-label mb-1 block">
                Dispatch Channel
              </label>
              <div className="grid grid-cols-4 gap-1.5 font-mono text-[11px]">
                {[
                  { id: 'whatsapp', label: 'WhatsApp' },
                  { id: 'sms', label: 'SMS' },
                  { id: 'push', label: 'Push' },
                  { id: 'email', label: 'Email' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setChannel(item.id as typeof channel)}
                    className={`py-1.5 px-1 text-center rounded-[4px] border transition-colors ${
                      channel === item.id
                        ? 'border-[var(--present-green)] bg-[var(--present-green)]/10 text-[var(--present-green)] font-semibold'
                        : 'border-[var(--rule-line)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Timing Presets */}
            <div>
              <label className="text-label mb-1 block">
                Reminder Time
              </label>
              <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px]">
                {[
                  { id: 'tomorrow', label: 'Tomorrow 10 AM' },
                  { id: '3days', label: 'In 3 Days' },
                  { id: '1week', label: 'In 1 Week' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTiming(t.id as typeof timing)}
                    className={`p-1.5 rounded-[4px] border text-center transition-colors ${
                      timing === t.id
                        ? 'border-[var(--present-green)] bg-[var(--present-green)]/10 font-semibold text-[var(--present-green)]'
                        : 'border-[var(--rule-line)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Note text */}
            <div>
              <label className="text-label mb-1 block">
                Record Details
              </label>
              <div className="p-2 rounded-[4px] border border-[var(--rule-line)] bg-[var(--card)] focus-within:outline focus-within:outline-2 focus-within:outline-[var(--roll-brass)]">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="w-full text-xs bg-transparent border-none outline-none resize-none text-[var(--ink-navy)] font-sans"
                  style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                  placeholder="What should the ledger remind you about?"
                />
              </div>
            </div>

            {error && (
              <div className="alert-card p-2 text-xs font-mono">
                {error}
              </div>
            )}

            {/* Action Buttons: Icon to the LEFT, gap-1.5, size 14 */}
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
                <Clock size={14} />
                <span>{isSubmitting ? 'Scheduling...' : 'Set Reminder'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
