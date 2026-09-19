'use client';

import { useRef, useState } from 'react';
import { DemoRunner } from '../common/DemoRunner';
import { MicrophoneIcon } from '../common/Icons';
import { speechInput } from '../../lib/voiceEngine';

const EXAMPLE_PROMPTS = [
  { en: 'Education loan of ₹25 lakh for MS abroad', query: 'Mujhe abroad MS ke liye ₹25 lakh ka education loan chahiye, salary ₹65,000 hai' },
  { en: 'Comprehensive health cover for family', query: 'Family ke liye ₹10 lakh ka health cover chahiye, 4 members hain' },
  { en: 'Personal loan for home renovation', query: 'Home renovation ke liye ₹5 lakh personal loan chahiye urgent' },
];

export function LandingForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedText, setRecordedText] = useState('');

  function fillPrompt(text: string) {
    if (inputRef.current) {
      inputRef.current.value = text;
      inputRef.current.focus();
    }
  }

  const handleToggleVoice = () => {
    if (isRecording) {
      speechInput.stop();
      setIsRecording(false);
      return;
    }

    const started = speechInput.start('hinglish', {
      onStart: () => setIsRecording(true),
      onResult: (transcript) => {
        if (inputRef.current) {
          inputRef.current.value = transcript;
        }
        setRecordedText(transcript);
      },
      onError: (err) => {
        console.warn('Voice input error:', err);
        setIsRecording(false);
      },
      onEnd: () => {
        setIsRecording(false);
      },
    });

    if (!started) {
      alert('Microphone access is unavailable or speech recognition is not supported in this browser.');
    }
  };

  return (
    <div className="w-full max-w-2xl flex flex-col items-center">
      <form action="/journey" method="GET" className="w-full" aria-label="Start your financial journey">
        <div className="relative group">
          {/* Subtle glowing ambient border in warm orange to cyan */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#F59E0B] to-[#22D3EE] rounded-2xl opacity-25 group-hover:opacity-45 blur transition duration-300 pointer-events-none" />

          <div className="relative flex items-center gap-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl px-4 py-3 shadow-[var(--shadow-card)] group-hover:shadow-[var(--shadow-card-hover)] focus-within:border-[#0F766E] focus-within:ring-2 focus-within:ring-[#0F766E]/20 transition-all">
            <input
              ref={inputRef}
              name="q"
              type="text"
              placeholder="Tell us what you need (or tap mic to speak)..."
              className="flex-1 bg-transparent outline-none text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] text-base md:text-lg min-w-0"
              aria-label="Describe your financial need"
              autoComplete="off"
              autoFocus
            />

            {/* Microphone Voice Typing Button */}
            <button
              type="button"
              onClick={handleToggleVoice}
              className={`p-2 rounded-xl transition-all ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[#0F766E] hover:bg-[#0F766E]/10'
              }`}
              title={isRecording ? 'Listening... click to finish' : 'Speak your query (Voice Typing in Hindi/English)'}
              aria-label={isRecording ? 'Stop voice recording' : 'Start voice typing'}
            >
              <MicrophoneIcon className="w-5 h-5" />
            </button>

            <button
              type="submit"
              className="shrink-0 bg-[#0F766E] hover:bg-[#115E59] text-white font-semibold text-sm px-5 py-2.5 rounded-xl active:scale-95 shadow-md shadow-[#0F766E]/25 transition-all focus-visible:outline-2 focus-visible:outline-[#0F766E]"
              aria-label="Start journey"
            >
              Let&apos;s go →
            </button>
          </div>
        </div>

        {/* Live Voice Recording Status */}
        {isRecording && (
          <div className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-red-600 dark:text-red-400 animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span>Listening... Speak your goal in English or Hindi</span>
          </div>
        )}

        {/* Quick prompt suggestions */}
        <div className="flex flex-col items-center gap-3 mt-6">
          <div className="flex flex-wrap gap-2 justify-center" role="list" aria-label="Example questions">
            {EXAMPLE_PROMPTS.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => fillPrompt(p.query)}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-[var(--bg-surface)] hover:bg-[#0F766E]/5 border border-[var(--border-default)] hover:border-[#0F766E]/60 text-[var(--text-secondary)] hover:text-[#0F766E] transition-all shadow-sm"
                role="listitem"
              >
                {p.en}
              </button>
            ))}
          </div>

          <div className="pt-2">
            <DemoRunner />
          </div>
        </div>
      </form>
    </div>
  );
}

