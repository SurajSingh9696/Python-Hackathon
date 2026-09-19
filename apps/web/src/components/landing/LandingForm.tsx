'use client';

import { useRef, useState } from 'react';
import { DemoRunner } from '../common/DemoRunner';
import { Mic, ArrowRight, ShieldCheck, CheckCircle2, Zap, Lock } from 'lucide-react';
import { speechInput } from '../../lib/voiceEngine';

const EXAMPLE_PROMPTS = [
  { code: 'EDU-MS', en: 'Education loan of ₹25L for MS abroad', query: 'Mujhe abroad MS ke liye ₹25 lakh ka education loan chahiye, salary ₹65,000 hai' },
  { code: 'HLT-FAM', en: 'Comprehensive health cover for family', query: 'Family ke liye ₹10 lakh ka health cover chahiye, 4 members hain' },
  { code: 'PL-RENO', en: 'Personal loan for home renovation', query: 'Home renovation ke liye ₹5 lakh personal loan chahiye urgent' },
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
        {/* Ledger Input Box: 1px Rule Line, 6px Radius, No Shadows */}
        <div className="relative w-full">
          <div className="flex items-center gap-3 bg-[var(--card)] border border-[var(--rule-line)] rounded-[6px] px-4 py-3 focus-within:outline focus-within:outline-2 focus-within:outline-[var(--roll-brass)] transition-colors">
            <input
              ref={inputRef}
              name="q"
              type="text"
              placeholder="State your financial requirement (or click mic to speak)..."
              className="flex-1 bg-transparent border-none outline-none text-[var(--ink-navy)] placeholder:text-[var(--muted-foreground)] text-sm md:text-base font-sans min-w-0"
              style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
              aria-label="Describe your financial need"
              autoComplete="off"
              autoFocus
            />

            {/* Microphone Voice Button */}
            <button
              type="button"
              onClick={handleToggleVoice}
              className={`p-2 rounded-[6px] border transition-colors inline-flex items-center justify-center ${
                isRecording
                  ? 'bg-[var(--absent-red)] text-white border-[var(--absent-red)] animate-pulse'
                  : 'border-[var(--rule-line)] text-[var(--muted-foreground)] hover:text-[var(--ink-navy)] hover:bg-[var(--muted)]'
              }`}
              title={isRecording ? 'Listening... click to finish' : 'Speak requirement (Hindi / English / Hinglish)'}
              aria-label={isRecording ? 'Stop voice recording' : 'Start voice typing'}
            >
              <Mic size={16} />
            </button>

            {/* Submit Ledger Button (Icon on left, gap-1.5, size 16) */}
            <button
              type="submit"
              className="shrink-0 bg-[var(--present-green)] hover:bg-[var(--present-green)]/90 text-white font-medium text-xs sm:text-sm px-4 py-2 rounded-[6px] inline-flex items-center gap-1.5 transition-colors"
              aria-label="Start journey"
            >
              <ArrowRight size={15} />
              <span>Begin Journey</span>
            </button>
          </div>
        </div>

        {/* Live Voice Recording Status */}
        {isRecording && (
          <div className="mt-3 flex items-center justify-center gap-2 text-xs font-mono text-[var(--absent-red)] animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[var(--absent-red)]" />
            <span>Recording voice query... Speak now</span>
          </div>
        )}

        {/* Academic Ledger Micro-Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-[11px] font-mono text-[var(--muted-foreground)]">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[var(--card)] border border-[var(--rule-line)] text-[var(--ink-navy)]">
            <ShieldCheck size={13} className="text-[var(--present-green)]" />
            <span>RBI-Regulated Partner Network</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[var(--card)] border border-[var(--rule-line)] text-[var(--ink-navy)]">
            <Zap size={13} className="text-[var(--roll-brass)]" />
            <span>100% Deterministic Math</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[var(--card)] border border-[var(--rule-line)] text-[var(--ink-navy)]">
            <Lock size={13} className="text-[var(--muted-foreground)]" />
            <span>Strict Privacy &amp; Zero Spam</span>
          </span>
        </div>

        {/* Quick prompt suggestions */}
        <div className="flex flex-col items-center gap-3 mt-6">
          <div className="flex items-center gap-2 text-label">
            Sample Ledger Entries
          </div>

          <div className="flex flex-wrap gap-2 justify-center" role="list" aria-label="Example questions">
            {EXAMPLE_PROMPTS.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => fillPrompt(p.query)}
                className="px-3 py-1.5 rounded-[6px] text-xs font-mono bg-[var(--card)] hover:bg-[var(--muted)] border border-[var(--rule-line)] hover:border-[var(--roll-brass)] text-[var(--ink-navy)] transition-colors inline-flex items-center gap-1.5"
                role="listitem"
              >
                <span className="text-[var(--muted-foreground)] text-[10px]">[{p.code}]</span>
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
