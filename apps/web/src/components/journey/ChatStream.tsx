'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useJourneyStore, type ChatMessage } from '../../stores/journeyStore';
import { useUIStore } from '../../stores/uiStore';
import { Sparkles, AlertTriangle, Volume2, VolumeX, CheckCircle2, Circle } from 'lucide-react';
import { speechOutput } from '../../lib/voiceEngine';

export function ChatStream() {
  const { messages, streamingText, isStreaming, currentStage, stageMessage } = useJourneyStore();
  const { explainTerm, language, isVoiceAutoPlay } = useUIStore();
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const wasStreamingRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, stageMessage]);

  // Auto voice narration
  useEffect(() => {
    if (wasStreamingRef.current && !isStreaming) {
      const latestAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
      if (latestAssistant && isVoiceAutoPlay && speechOutput.isSupported()) {
        setSpeakingMessageId(latestAssistant.id);
        speechOutput.speak(latestAssistant.content, language, () => {
          setSpeakingMessageId(null);
        });
      }
    }
    wasStreamingRef.current = isStreaming;
  }, [isStreaming, messages, isVoiceAutoPlay, language]);

  useEffect(() => {
    return () => {
      speechOutput.stop();
    };
  }, []);

  const handleToggleSpeak = (msg: ChatMessage) => {
    if (speakingMessageId === msg.id) {
      speechOutput.stop();
      setSpeakingMessageId(null);
    } else {
      speechOutput.stop();
      setSpeakingMessageId(msg.id);
      speechOutput.speak(msg.content, language, () => {
        setSpeakingMessageId(null);
      });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-4" aria-live="polite" aria-label="Conversation with Sahaj">
      {messages.length === 0 && !isStreaming && (
        <div className="my-auto flex flex-col items-center justify-center text-center max-w-md mx-auto gap-3 py-10 text-[var(--muted-foreground)]">
          <div className="w-10 h-10 rounded-[6px] border border-[var(--rule-line)] bg-[var(--card)] text-[var(--ink-navy)] flex items-center justify-center">
            <Sparkles size={18} />
          </div>
          <span className="text-label">Active Financial Ledger</span>
          <p className="text-xs font-mono">
            State your education loan, EMI query, or health insurance need. Every recommendation will be audited and cataloged with deterministic calculations.
          </p>
        </div>
      )}

      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          onTermClick={explainTerm}
          isSpeaking={speakingMessageId === msg.id}
          onToggleSpeak={() => handleToggleSpeak(msg)}
        />
      ))}

      {/* Streaming bubble */}
      {isStreaming && (
        <div className="flex flex-col gap-1.5 max-w-2xl animate-fade-up">
          {stageMessage && (
            <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--roll-brass)] px-1">
              <Circle size={8} className="fill-current animate-pulse" />
              <span>{stageMessage}</span>
            </div>
          )}

          {streamingText && (
            <div className="p-4 rounded-[6px] bg-[var(--card)] border border-[var(--rule-line)] text-[var(--ink-navy)] text-sm leading-relaxed">
              <FormatMessageContent content={streamingText} onTermClick={explainTerm} />
              <span className="inline-block w-1.5 h-3.5 ml-1 bg-[var(--roll-brass)] animate-ping" aria-hidden="true" />
            </div>
          )}
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

function MessageBubble({
  message,
  onTermClick,
  isSpeaking,
  onToggleSpeak,
}: {
  message: ChatMessage;
  onTermClick: (term: string) => void;
  isSpeaking?: boolean;
  onToggleSpeak?: () => void;
}) {
  const isUser = message.role === 'user';
  const isEscalation = message.role === 'escalation';

  if (isEscalation) {
    return (
      <div className="alert-card p-3.5 rounded-[6px] max-w-2xl flex items-start gap-2.5 text-xs font-mono">
        <AlertTriangle size={16} className="text-[var(--absent-red)] shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-[var(--absent-red)] uppercase tracking-wider">
            Escalation Notice
          </span>
          <p className="text-[var(--ink-navy)] leading-relaxed">{message.content}</p>
        </div>
      </div>
    );
  }

  if (isUser) {
    return (
      <div className="self-end max-w-xl p-3 px-3.5 rounded-[6px] bg-[var(--ink-navy)] text-[var(--card)] text-sm font-sans">
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    );
  }

  return (
    <div className="self-start max-w-2xl p-4 rounded-[6px] bg-[var(--card)] border border-[var(--rule-line)] text-[var(--ink-navy)] text-sm leading-relaxed flex flex-col gap-2 relative">
      {/* Ledger Header Line */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[var(--rule-line)] text-xs">
        <div className="flex items-center gap-1.5 text-label">
          <Circle size={6} className="fill-current text-[var(--present-green)]" />
          <span>Sahaj Companion</span>
        </div>
        <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
          100% DETERMINISTIC
        </span>
      </div>

      <FormatMessageContent content={message.content} onTermClick={onTermClick} />

      {/* Audio Toolbar on Assistant Message */}
      <div className="flex items-center justify-between pt-2 mt-1 border-t border-[var(--rule-line)] text-xs">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--muted-foreground)]">
          <CheckCircle2 size={12} className="text-[var(--present-green)]" />
          <span>Audited Guidance</span>
        </div>

        <button
          type="button"
          onClick={onToggleSpeak}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] border font-mono text-[11px] transition-colors ${
            isSpeaking
              ? 'bg-[var(--present-green)] text-white border-[var(--present-green)]'
              : 'border-[var(--rule-line)] bg-[var(--card)] text-[var(--ink-navy)] hover:bg-[var(--muted)]'
          }`}
          title={isSpeaking ? 'Stop narration' : 'Read aloud'}
        >
          {isSpeaking ? (
            <>
              <VolumeX size={13} />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Volume2 size={13} />
              <span>Read Aloud</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function FormatMessageContent({
  content,
  onTermClick,
}: {
  content: string;
  onTermClick: (term: string) => void;
}) {
  const parts = content.split(/\*Disclaimer:/i);
  const main = parts[0] ?? '';
  const disclaimer = parts.length > 1 ? parts.slice(1).join('') : null;

  const renderInline = (text: string) => {
    const boldTokens = text.split(/(\*\*[^*]+\*\*)/g);
    return boldTokens.map((token, i) => {
      if (token.startsWith('**') && token.endsWith('**')) {
        const word = token.slice(2, -2);
        const lower = word.toLowerCase();
        if (lower.includes('moratorium') || lower.includes('foir') || lower.includes('emi')) {
          return (
            <button
              key={i}
              type="button"
              onClick={() => onTermClick(lower)}
              className="roll-chip mx-0.5 hover:bg-[var(--roll-brass)] hover:text-white transition-colors cursor-pointer"
              title={`Explain ${word}`}
            >
              <span>{word}</span>
            </button>
          );
        }
        return <strong key={i} className="font-semibold text-[var(--ink-navy)]">{word}</strong>;
      }
      return <span key={i}>{token}</span>;
    });
  };

  return (
    <>
      <div className="whitespace-pre-wrap">{renderInline(main)}</div>
      {disclaimer && (
        <p className="text-[11px] font-mono text-[var(--muted-foreground)] italic border-t border-[var(--rule-line)] pt-1.5 mt-1">
          *Disclaimer:{disclaimer}
        </p>
      )}
    </>
  );
}
