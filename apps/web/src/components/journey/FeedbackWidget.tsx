'use client';

import React, { useState } from 'react';
import { sendFeedback } from '../../lib/api';
import { ThumbUpIcon, ThumbDownIcon } from '../common/Icons';

export function FeedbackWidget({ messageId }: { messageId?: string }) {
  const [voted, setVoted] = useState<'up' | 'down' | null>(null);

  const handleVote = async (vote: 'up' | 'down') => {
    if (voted) return;
    setVoted(vote);
    try {
      await sendFeedback({
        messageId: messageId ?? 'demo-msg',
        vote,
      });
    } catch {
      // Ignore in demo
    }
  };

  if (voted) {
    return (
      <div className="text-[11px] text-[var(--color-leaf)] font-medium flex items-center gap-1 py-1">
        <span>✓ Thank you for your feedback!</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)] py-1">
      <span>Helpful?</span>
      <button
        type="button"
        onClick={() => handleVote('up')}
        className="p-1 rounded hover:bg-[var(--border-default)] hover:text-[var(--color-leaf)] transition-colors"
        aria-label="Thumbs up"
      >
        <ThumbUpIcon className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => handleVote('down')}
        className="p-1 rounded hover:bg-[var(--border-default)] hover:text-[var(--color-rose)] transition-colors"
        aria-label="Thumbs down"
      >
        <ThumbDownIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
