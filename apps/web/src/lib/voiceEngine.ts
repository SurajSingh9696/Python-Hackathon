'use client';

/**
 * Sahaj Voice Engine
 *
 * Provides bidirectional voice support:
 * 1. Text-to-Speech (TTS): Speaks assistant responses using natural speech synthesis
 * 2. Speech-to-Text (STT): Transcribes user voice into text in English, Hindi, and Hinglish
 */

export interface VoiceEngineListener {
  onStart?: () => void;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

// ── Speech-to-Text (Voice Typing) ───────────────────────────────────────────

export class SpeechInputService {
  private recognition: any = null;
  private isListening = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
      }
    }
  }

  isSupported(): boolean {
    return !!this.recognition;
  }

  start(lang: 'en' | 'hi' | 'hinglish', listener: VoiceEngineListener): boolean {
    if (!this.recognition || this.isListening) return false;

    // Set recognition language
    this.recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';

    this.recognition.onstart = () => {
      this.isListening = true;
      listener.onStart?.();
    };

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalTranscript += item[0].transcript;
        } else {
          interim += item[0].transcript;
        }
      }

      const text = finalTranscript || interim;
      listener.onResult?.(text, !!finalTranscript);
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      listener.onError?.(event.error || 'Speech recognition error');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      listener.onEnd?.();
    };

    try {
      this.recognition.start();
      return true;
    } catch {
      this.isListening = false;
      return false;
    }
  }

  stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
}

// ── Text-to-Speech (Assistant Speaking) ─────────────────────────────────────

export class SpeechOutputService {
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  /**
   * Cleans markdown, formatting artifacts, and statutory legalese for natural spoken speech.
   */
  cleanTextForSpeech(text: string): string {
    return text
      .replace(/\*Disclaimer:[\s\S]*$/i, '') // Don't read the legal disclaimer out loud
      .replace(/\[SAHAJ_GUARD_OVERRIDE\][\s\S]*$/, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove markdown bold
      .replace(/\*([^*]+)\*/g, '$1')     // Remove italics
      .replace(/#{1,6}\s+/g, '')         // Remove headers
      .replace(/₹\s*([\d,]+)/g, '$1 rupees') // Pronounce ₹ as rupees
      .replace(/(\d+)k\b/gi, '$1 thousand')
      .replace(/(\d+)L\b/gi, '$1 lakh')
      .replace(/(\d+)Cr\b/gi, '$1 crore')
      .replace(/\s+/g, ' ')
      .trim();
  }

  speak(
    text: string,
    lang: 'en' | 'hi' | 'hinglish',
    onEnd?: () => void
  ): boolean {
    if (!this.isSupported()) return false;

    this.stop(); // cancel previous speaking

    const cleanText = this.cleanTextForSpeech(text);
    if (!cleanText) return false;

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Speed: Hindi at natural pace, Hinglish slightly slower for mixed-script clarity
    utterance.rate = lang === 'hi' ? 0.95 : 1.0;
    utterance.pitch = 1.0;

    // Attempt voice selection after voices load (some browsers lazy-load)
    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      let matchedVoice: SpeechSynthesisVoice | undefined;

      if (lang === 'hi') {
        // Prefer hi-IN voices, then any Hindi voice
        matchedVoice =
          voices.find((v) => v.lang === 'hi-IN') ||
          voices.find((v) => v.lang.startsWith('hi')) ||
          voices.find((v) => v.name.toLowerCase().includes('hindi'));
      }

      if (!matchedVoice) {
        // For Hinglish and English: prefer Indian English voices
        matchedVoice =
          voices.find((v) => v.lang === 'en-IN' && v.name.toLowerCase().includes('female')) ||
          voices.find((v) => v.lang === 'en-IN') ||
          voices.find((v) => v.lang.startsWith('en') && v.name.toLowerCase().includes('india')) ||
          voices.find((v) => v.lang.startsWith('en'));
      }

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
    };

    // Try setting voice immediately, then on voiceschanged if not yet loaded
    setVoice();
    if (!utterance.voice && window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.addEventListener('voiceschanged', setVoice, { once: true });
    }

    utterance.onend = () => {
      this.currentUtterance = null;
      onEnd?.();
    };

    utterance.onerror = () => {
      this.currentUtterance = null;
      onEnd?.();
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
    return true;
  }

  stop(): void {
    if (this.isSupported()) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  isSpeaking(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking;
  }
}

export const speechInput = new SpeechInputService();
export const speechOutput = new SpeechOutputService();
