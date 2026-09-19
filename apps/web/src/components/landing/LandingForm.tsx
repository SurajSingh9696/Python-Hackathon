'use client';

import { useRef, useState } from 'react';
import { DemoRunner } from '../common/DemoRunner';
import { MicrophoneIcon } from '../common/Icons';
import { speechInput } from '../../lib/voiceEngine';

const EXAMPLE_PROMPTS = [
  { icon: '🎓', tag: 'Education', en: 'Education loan of ₹25L for MS abroad', query: 'Mujhe abroad MS ke liye ₹25 lakh ka education loan chahiye, salary ₹65,000 hai' },
  { icon: '🏥', tag: 'Health', en: 'Comprehensive health cover for family', query: 'Family ke liye ₹10 lakh ka health cover chahiye, 4 members hain' },
  { icon: '⚡', tag: 'Personal', en: 'Personal loan for home renovation', query: 'Home renovation ke liye ₹5 lakh personal loan chahiye urgent' },
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
        <div className="relative group w-full">
          {/* Subtle warm glow on hover */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#F59E0B]/30 via-[#0F766E]/20 to-[#22D3EE]/30 rounded-2xl opacity-0 group-hover:opacity-100 blur transition-opacity duration-300 pointer-events-none" />

          <div className="relative flex items-center gap-3 bg-white dark:bg-[#1E293B] border border-[#DDE8E6] dark:border-slate-700 rounded-2xl px-4 sm:px-5 py-3.5 shadow-sm hover:shadow-md focus-within:border-[#0F766E] focus-within:ring-4 focus-within:ring-[#0F766E]/10 transition-all duration-200">
            <input
              ref={inputRef}
              name="q"
              type="text"
              placeholder="Tell us what you need (or tap mic to speak)..."
              className="flex-1 bg-transparent outline-none text-[#17201F] dark:text-[#F8FAF9] placeholder:text-[#94A3B8] text-base md:text-lg font-normal min-w-0"
              aria-label="Describe your financial need"
              autoComplete="off"
              autoFocus
            />

            {/* Microphone Voice Typing Button */}
            <button
              type="button"
              onClick={handleToggleVoice}
              className={`p-2.5 rounded-xl transition-all ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse shadow-md'
                  : 'text-[#64748B] hover:text-[#0F766E] hover:bg-[#0F766E]/10 dark:hover:text-[#22D3EE]'
              }`}
              title={isRecording ? 'Listening... click to finish' : 'Speak your query (Voice Typing in Hindi/English)'}
              aria-label={isRecording ? 'Stop voice recording' : 'Start voice typing'}
            >
              <MicrophoneIcon className="w-5 h-5" />
            </button>

            <button
              type="submit"
              className="shrink-0 bg-[#0F766E] hover:bg-[#0D655E] text-white font-semibold text-sm px-6 py-2.5 rounded-xl active:scale-95 shadow-sm hover:shadow transition-all duration-150 focus-visible:outline-2 focus-visible:outline-[#0F766E]"
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

        {/* Vibrant Feature Micro-Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-[11px] font-semibold text-[#475569]">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            RBI Regulated Network
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 shadow-xs">
            <span>⚡</span>
            100% Math Guarantee
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 shadow-xs">
            <span>🎙️</span>
            Trilingual Voice AI
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
            <span>🔒</span>
            Zero Spam Policy
          </span>
        </div>

        {/* Quick prompt suggestions */}
        <div className="flex flex-col items-center gap-3 mt-6">
          <div className="flex flex-wrap gap-2 justify-center" role="list" aria-label="Example questions">
            {EXAMPLE_PROMPTS.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => fillPrompt(p.query)}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-white dark:bg-[#1E293B] hover:bg-[#0F766E]/5 border border-[#E2ECE9] dark:border-slate-700 hover:border-[#0F766E]/60 text-[#334155] dark:text-slate-200 hover:text-[#0F766E] transition-all shadow-xs flex items-center gap-1.5"
                role="listitem"
              >
                <span>{p.icon}</span>
                <span>{p.en}</span>
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

