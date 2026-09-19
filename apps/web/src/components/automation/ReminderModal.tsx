'use client';

import React, { useState } from 'react';
import { scheduleReminder, type ReminderResponse } from '../../lib/api';
import { XMarkIcon, CheckCircleIcon, ClockIcon } from '../common/Icons';

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reminder-modal-title"
    >
      <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-3xl shadow-2xl p-6 flex flex-col gap-5 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
          <div className="flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-[var(--color-signal-cyan)]" />
            <h2 id="reminder-modal-title" className="text-base font-bold text-[var(--text-primary)]">
              Set Journey Reminder
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
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Reminder Scheduled!</h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-xs">
              {result.message}
            </p>
            <div className="text-[11px] font-mono text-[var(--text-secondary)] bg-[var(--bg-surface-alt)] px-3 py-1.5 rounded-lg border border-[var(--border-default)]">
              Outbox Delivery ID: {result.eventId.slice(0, 12)}...
            </div>
            <button
              type="button"
              onClick={() => {
                setResult(null);
                onClose();
              }}
              className="mt-2 w-full py-2.5 rounded-xl bg-[var(--color-signal-cyan)] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSchedule} className="flex flex-col gap-4">
            {/* Channel Choice */}
            <div>
              <label className="text-xs font-semibold text-[var(--text-primary)] mb-1.5 block">
                Notification Channel
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
                  { id: 'sms', label: 'SMS', icon: '📱' },
                  { id: 'push', label: 'Push', icon: '🔔' },
                  { id: 'email', label: 'Email', icon: '✉️' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setChannel(item.id as typeof channel)}
                    className={`py-2 px-1 text-center rounded-xl border text-xs font-medium transition-all flex flex-col items-center gap-1 ${
                      channel === item.id
                        ? 'border-[var(--color-signal-cyan)] bg-[var(--color-signal-cyan)]/10 text-[var(--color-signal-cyan)]'
                        : 'border-[var(--border-default)] hover:border-[var(--border-strong)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Timing Presets */}
            <div>
              <label className="text-xs font-semibold text-[var(--text-primary)] mb-1.5 block">
                When to remind you?
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { id: 'tomorrow', label: 'Tomorrow 10 AM' },
                  { id: '3days', label: 'In 3 Days' },
                  { id: '1week', label: 'In 1 Week' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTiming(t.id as typeof timing)}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      timing === t.id
                        ? 'border-[var(--color-signal-cyan)] bg-[var(--color-signal-cyan)]/10 font-semibold text-[var(--color-signal-cyan)]'
                        : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Note text */}
            <div>
              <label className="text-xs font-semibold text-[var(--text-primary)] mb-1.5 block">
                Reminder Note
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="w-full text-xs p-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-signal-cyan)] resize-none"
                placeholder="What should we remind you about?"
              />
            </div>

            {error && (
              <div className="text-xs text-[var(--color-rust)] bg-[var(--color-rust)]/10 p-2.5 rounded-xl border border-[var(--color-rust)]/20">
                {error}
              </div>
            )}

            {/* Submit */}
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
                className="flex-1 py-2.5 rounded-xl bg-[var(--color-signal-cyan)] text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSubmitting ? 'Scheduling...' : 'Set Reminder'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
