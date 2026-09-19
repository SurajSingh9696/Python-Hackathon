'use client';

import React, { useState, useRef } from 'react';
import { useJourneyStore } from '../../stores/journeyStore';
import { useUIStore } from '../../stores/uiStore';
import { t } from '../../lib/i18n';
import { speechInput } from '../../lib/voiceEngine';
import { MicrophoneIcon } from '../common/Icons';

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
      className="p-3 sm:p-4 bg-[var(--bg-surface)]/95 backdrop-blur-md border-t border-[var(--border-default)] sticky bottom-0 z-30 flex flex-col gap-1.5"
      aria-label="Send message"
    >
      {/* Listening / Feedback Banner */}
      {isListening && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium animate-pulse max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span>Listening... Bolie, hum sun rahe hain</span>
          </div>
          <button
            type="button"
            onClick={handleToggleVoice}
            className="text-[11px] underline font-semibold hover:opacity-80"
          >
            Done
          </button>
        </div>
      )}

      {voiceError && (
        <div className="px-3 py-1 text-center text-xs text-[var(--color-rust)] bg-[var(--color-rust)]/10 rounded-lg max-w-4xl mx-auto w-full">
          {voiceError}
        </div>
      )}

      <div className="flex items-center gap-2 max-w-4xl mx-auto w-full bg-[var(--bg-surface-alt)] border border-[var(--border-default)] rounded-2xl p-1.5 px-3 shadow-[var(--shadow-card)] focus-within:border-[#0F766E] focus-within:ring-2 focus-within:ring-[#0F766E]/20 transition-all">
        {/* Voice Input Microphone Button */}
        <button
          type="button"
          onClick={handleToggleVoice}
          disabled={isStreaming}
          className={`p-2 rounded-xl transition-all flex items-center justify-center shrink-0 ${
            isListening
              ? 'bg-red-500 text-white shadow-md animate-pulse scale-105'
              : 'text-[var(--text-secondary)] hover:text-[#0F766E] hover:bg-[#0F766E]/10'
          }`}
          title={isListening ? 'Stop listening' : 'Speak to type (Hindi / English / Hinglish)'}
          aria-label={isListening ? 'Stop listening' : 'Voice typing'}
        >
          <MicrophoneIcon className="w-4 h-4" />
        </button>

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            isListening
              ? 'Listening to you...'
              : t('common', 'composerPlaceholder', language)
          }
          disabled={isStreaming}
          className="flex-1 bg-transparent outline-none text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] text-sm sm:text-base min-w-0 py-1"
          aria-label="Your response"
        />

        {/* Send Button in Sahaj Deep Teal */}
        <button
          type="submit"
          disabled={!text.trim() || isStreaming}
          className="shrink-0 bg-[#0F766E] hover:bg-[#115E59] text-white font-semibold text-xs sm:text-sm px-4 py-2 rounded-xl active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          aria-label="Send message"
        >
          {t('common', 'send', language)}
        </button>
      </div>
    </form>
  );
}
