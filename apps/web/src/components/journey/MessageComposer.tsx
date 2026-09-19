'use client';

import React, { useState, useRef } from 'react';
import { useJourneyStore } from '../../stores/journeyStore';
import { useUIStore } from '../../stores/uiStore';
import { t } from '../../lib/i18n';
import { speechInput } from '../../lib/voiceEngine';
import { Mic, ArrowRight } from 'lucide-react';

export function MessageComposer() {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const { sendMessage, isStreaming } = useJourneyStore();
  const { language } = useUIStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isStreaming) return;
    if (isListening) {
      speechInput.stop();
      setIsListening(false);
    }
    const msg = text;
    setText('');
    await sendMessage(msg);
    inputRef.current?.focus();
  };

  const handleToggleVoice = () => {
    setVoiceError(null);

    if (isListening) {
      speechInput.stop();
      setIsListening(false);
      return;
    }

    if (!speechInput.isSupported()) {
      setVoiceError('Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.');
      setTimeout(() => setVoiceError(null), 4000);
      return;
    }

    const started = speechInput.start(language, {
      onStart: () => setIsListening(true),
      onResult: (transcript, isFinal) => {
        setText(transcript);
        if (isFinal) {
          setIsListening(false);
        }
      },
      onError: (err) => {
        setIsListening(false);
        setVoiceError(`Voice error: ${err}`);
        setTimeout(() => setVoiceError(null), 3000);
      },
      onEnd: () => setIsListening(false),
    });

    if (!started) {
      setIsListening(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 sm:p-4 bg-[var(--card)] border-t border-[var(--rule-line)] sticky bottom-0 z-30 flex flex-col gap-1.5"
      aria-label="Send message"
    >
      {/* Listening / Feedback Banner */}
      {isListening && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-[4px] bg-[var(--absent-red)]/10 border border-[var(--absent-red)]/30 text-[var(--absent-red)] text-xs font-mono animate-pulse max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--absent-red)] animate-ping" />
            <span>Listening... Bolie, hum record kar rahe hain</span>
          </div>
          <button
            type="button"
            onClick={handleToggleVoice}
            className="text-[11px] font-mono underline font-semibold hover:opacity-80"
          >
            Done
          </button>
        </div>
      )}

      {voiceError && (
        <div className="px-3 py-1 text-center text-xs font-mono text-[var(--absent-red)] bg-[var(--absent-red)]/10 border border-[var(--absent-red)]/20 rounded-[4px] max-w-4xl mx-auto w-full">
          {voiceError}
        </div>
      )}

      {/* The Ledger Input Container: 1px rule line, 6px radius, no shadows */}
      <div className="flex items-center gap-2.5 max-w-4xl mx-auto w-full bg-[var(--card)] border border-[var(--rule-line)] rounded-[6px] p-2 px-3 focus-within:outline focus-within:outline-2 focus-within:outline-[var(--roll-brass)] transition-colors">
        {/* Voice Input Microphone Button */}
        <button
          type="button"
          onClick={handleToggleVoice}
          disabled={isStreaming}
          className={`p-2 rounded-[4px] border transition-colors flex items-center justify-center shrink-0 ${
            isListening
              ? 'bg-[var(--absent-red)] text-white border-[var(--absent-red)] animate-pulse'
              : 'border-[var(--rule-line)] text-[var(--muted-foreground)] hover:text-[var(--ink-navy)] hover:bg-[var(--muted)]'
          }`}
          title={isListening ? 'Stop listening' : 'Speak to type (Hindi / English / Hinglish)'}
          aria-label={isListening ? 'Stop listening' : 'Voice typing'}
        >
          <Mic size={15} />
        </button>

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            isListening
              ? 'Listening to you... (Speak now)'
              : t('common', 'composerPlaceholder', language)
          }
          disabled={isStreaming}
          className="flex-1 bg-transparent border-none outline-none text-[var(--ink-navy)] placeholder:text-[var(--muted-foreground)] text-sm font-sans min-w-0 py-1"
          style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
          aria-label="Your response"
        />

        {/* Send Button: Icon on left, gap-1.5, size 15 */}
        <button
          type="submit"
          disabled={!text.trim() || isStreaming}
          className="shrink-0 bg-[var(--present-green)] hover:bg-[var(--present-green)]/90 text-white font-medium text-xs px-3.5 py-1.5 rounded-[4px] inline-flex items-center gap-1.5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          <ArrowRight size={14} />
          <span>{t('common', 'send', language)}</span>
        </button>
      </div>
    </form>
  );
}
