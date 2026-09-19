'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useJourneyStore, type ChatMessage } from '../../stores/journeyStore';
import { useUIStore } from '../../stores/uiStore';
import { SparklesIcon, AlertTriangleIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '../common/Icons';
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

  // Voice narration: When streaming finishes, automatically speak the latest assistant response
  useEffect(() => {
    if (wasStreamingRef.current && !isStreaming) {
      // Find latest assistant message
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

  // Cleanup speech on unmount
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
    <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-5" aria-live="polite" aria-label="Conversation with Sahaj">
      {messages.length === 0 && !isStreaming && (
        <div className="my-auto flex flex-col items-center justify-center text-center max-w-sm mx-auto gap-3 py-12 text-[var(--text-secondary)]">
          <div className="w-12 h-12 rounded-full bg-[var(--color-signal-cyan)]/10 text-[var(--color-signal-cyan)] flex items-center justify-center">
            <SparklesIcon className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">How can Sahaj help you today?</h2>
          <p className="text-sm">
            Ask for an education loan, compare EMIs, check moratorium policies, or evaluate health insurance options in your words.
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
        <div className="flex flex-col gap-2 max-w-2xl">
          {/* Stage badge */}
          {stageMessage && (
            <div className="flex items-center gap-2 text-xs text-[var(--color-signal-cyan)] animate-pulse px-1">
              <span className="w-2 h-2 rounded-full bg-[var(--color-signal-cyan)]" />
              <span>{stageMessage}</span>
            </div>
          )}

          {streamingText && (
            <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-[var(--shadow-card)] text-[var(--text-primary)] text-base leading-relaxed">
              <FormatMessageContent content={streamingText} onTermClick={explainTerm} />
              <span className="inline-block w-1.5 h-4 ml-1 bg-[var(--color-signal-cyan)] animate-ping" aria-hidden="true" />
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
      <div className="p-4 rounded-2xl bg-[#FFF5F5] dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-200 max-w-2xl flex items-start gap-3 text-sm">
        <AlertTriangleIcon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
          <span className="font-semibold">Priority Review Notice</span>
          <p>{message.content}</p>
        </div>
      </div>
    );
  }

  if (isUser) {
    return (
      <div className="self-end max-w-xl p-3.5 px-4 rounded-2xl rounded-tr-sm bg-[#0F766E] text-white text-base shadow-sm">
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    );
  }

  return (
    <div className="self-start max-w-2xl p-4 sm:p-5 rounded-2xl rounded-tl-sm bg-white dark:bg-[#132825] border border-[#E2ECE9] dark:border-teal-900/50 text-[#111827] dark:text-[#F0FDF4] text-base leading-relaxed shadow-xs flex flex-col gap-2.5 relative group">
      {/* Assistant Header Pill */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[#E2ECE9] dark:border-teal-900/40 text-xs">
        <div className="flex items-center gap-2 font-bold text-[#0F766E] dark:text-[#22D3EE]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Sahaj Intelligence</span>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800">
          Deterministic 100%
        </span>
      </div>

      <FormatMessageContent content={message.content} onTermClick={onTermClick} />

      {/* Audio Playback Toolbar on Assistant Message */}
      <div className="flex items-center justify-between pt-2 mt-1 border-t border-[#E2ECE9] dark:border-teal-900/40 text-xs text-[#64748B]">
        <div className="flex items-center gap-2">
          {isSpeaking ? (
            <div className="flex items-center gap-1.5 text-[#0F766E] dark:text-[#22D3EE] font-semibold">
              <span className="flex items-end gap-0.5 h-3.5">
                <span className="w-1 h-2 bg-[#10B981] animate-pulse rounded-full" />
                <span className="w-1 h-3.5 bg-[#0F766E] animate-ping rounded-full" />
                <span className="w-1 h-1.5 bg-[#06B6D4] animate-pulse rounded-full" />
              </span>
              <span>Speaking audio...</span>
            </div>
          ) : (
            <span className="text-[11px] font-medium text-[#64748B] flex items-center gap-1">
              <span className="text-emerald-600">✓</span> Verified Guidance
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleSpeak}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all text-xs font-semibold ${
            isSpeaking
              ? 'bg-[#0F766E] text-white shadow-xs'
              : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800'
          }`}
          title={isSpeaking ? 'Stop speaking' : 'Read response aloud'}
        >
          {isSpeaking ? (
            <>
              <SpeakerXMarkIcon className="w-3.5 h-3.5" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <SpeakerWaveIcon className="w-3.5 h-3.5 text-[#0F766E] dark:text-[#22D3EE]" />
              <span>Listen</span>
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
  // Split disclaimer if present
  const parts = content.split(/\*Disclaimer:/i);
  const main = parts[0] ?? '';
  const disclaimer = parts.length > 1 ? parts.slice(1).join('') : null;

  // Highlight keywords like moratorium, FOIR
  const renderInline = (text: string) => {
    // Basic bold parsing **word**
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
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 hover:bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 font-bold border border-teal-200 dark:border-teal-800 text-xs transition-all mx-0.5 cursor-pointer shadow-xs"
              title={`Explain ${word}`}
            >
              <span>💡</span>
              <span>{word}</span>
            </button>
          );
        }
        return <strong key={i} className="font-bold text-[#111827] dark:text-[#F0FDF4]">{word}</strong>;
      }
      return <span key={i}>{token}</span>;
    });
  };

  return (
    <>
      <div className="whitespace-pre-wrap">{renderInline(main)}</div>
      {disclaimer && (
        <p className="text-xs text-[var(--text-secondary)] italic border-t border-[var(--border-default)] pt-2 mt-1">
          *Disclaimer:{disclaimer}
        </p>
      )}
    </>
  );
}

