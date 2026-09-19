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
    <div className="self-start max-w-2xl p-4 rounded-2xl rounded-tl-sm bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-primary)] text-base leading-relaxed shadow-[var(--shadow-card)] flex flex-col gap-2 relative group">
      <FormatMessageContent content={message.content} onTermClick={onTermClick} />

      {/* Audio Playback Toolbar on Assistant Message */}
      <div className="flex items-center justify-between pt-2 mt-1 border-t border-[var(--border-default)]/60 text-xs text-[var(--text-secondary)]">
        <div className="flex items-center gap-2">
          {isSpeaking ? (
            <div className="flex items-center gap-1.5 text-[#0F766E] dark:text-[#22D3EE] font-medium">
              <span className="flex items-end gap-0.5 h-3">
                <span className="w-0.5 h-2 bg-[#0F766E] dark:bg-[#22D3EE] animate-pulse" />
                <span className="w-0.5 h-3.5 bg-[#0F766E] dark:bg-[#22D3EE] animate-ping" />
                <span className="w-0.5 h-1.5 bg-[#0F766E] dark:bg-[#22D3EE] animate-pulse" />
              </span>
              <span>Speaking response...</span>
            </div>
          ) : (
            <span className="text-[11px] opacity-70">Sahaj AI Verified</span>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleSpeak}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all text-xs font-medium ${
            isSpeaking
              ? 'bg-[#0F766E] text-white shadow-sm'
              : 'hover:bg-[#0F766E]/10 text-[var(--text-secondary)] hover:text-[#0F766E] dark:hover:text-[#22D3EE]'
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
              className="font-semibold text-[var(--color-signal-cyan)] hover:underline inline cursor-pointer"
              title={`Explain ${word}`}
            >
              {word}
            </button>
          );
        }
        return <strong key={i} className="font-semibold text-[var(--text-primary)]">{word}</strong>;
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

