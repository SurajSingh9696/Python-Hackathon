'use client';

import React, { useState } from 'react';
import { sendFeedback } from '../../lib/api';
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react';

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
      <div className="text-[10px] font-mono text-[var(--present-green)] inline-flex items-center gap-1 py-1">
        <Check size={12} />
        <span>Feedback recorded</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--muted-foreground)] py-1">
      <span>AUDIT RATING:</span>
      <button
        type="button"
        onClick={() => handleVote('up')}
        className="p-1 rounded-[4px] border border-[var(--rule-line)] hover:bg-[var(--muted)] hover:text-[var(--present-green)] transition-colors inline-flex items-center"
        aria-label="Accurate calculation"
      >
        <ThumbsUp size={12} />
      </button>
      <button
        type="button"
        onClick={() => handleVote('down')}
        className="p-1 rounded-[4px] border border-[var(--rule-line)] hover:bg-[var(--muted)] hover:text-[var(--absent-red)] transition-colors inline-flex items-center"
        aria-label="Needs review"
      >
        <ThumbsDown size={12} />
      </button>
    </div>
  );
}
