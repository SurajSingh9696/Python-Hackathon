/**
 * Sarvam AI Adapter Interface
 * Covers: translate, transliterate, STT, TTS, Document AI
 */

export type SarvamLanguage =
  | 'en-IN'
  | 'hi-IN'
  | 'ta-IN'
  | 'te-IN'
  | 'kn-IN'
  | 'ml-IN'
  | 'mr-IN'
  | 'gu-IN'
  | 'bn-IN'
  | 'pa-IN';

export interface TranslateOptions {
  text: string;
  sourceLang: SarvamLanguage;
  targetLang: SarvamLanguage;
  /** Optional speaker style for tone-preserving translation */
  speakerStyle?: 'formal' | 'casual';
}

export interface TranslateResult {
  translatedText: string;
  sourceLang: SarvamLanguage;
  targetLang: SarvamLanguage;
}

export interface TransliterateOptions {
  text: string;
  sourceLang: SarvamLanguage;
  targetLang: SarvamLanguage;
}

export interface TransliterateResult {
  transliteratedText: string;
}

export interface STTOptions {
  /** Base64-encoded audio blob */
  audioBase64: string;
  /** Audio MIME type */
  mimeType: 'audio/wav' | 'audio/mp3' | 'audio/ogg' | 'audio/webm';
  language: SarvamLanguage;
}

export interface STTResult {
  transcript: string;
  confidence: number;
  language: SarvamLanguage;
}

export interface TTSOptions {
  text: string;
  language: SarvamLanguage;
  /** Speaker voice name. Default: 'meera' */
  speaker?: string;
}

export interface TTSResult {
  /** Base64-encoded WAV audio */
  audioBase64: string;
  mimeType: 'audio/wav';
  durationMs: number;
}

export interface DocAIOptions {
  /** Base64-encoded document (PDF, PNG, JPEG) */
  documentBase64: string;
  mimeType: 'application/pdf' | 'image/png' | 'image/jpeg';
  /** Document type hint for field extraction */
  documentType: 'income_proof' | 'admission_letter' | 'id_proof' | 'bank_statement' | 'generic';
}

export interface DocAIResult {
  extractedFields: Record<string, string | number | null>;
  confidence: number;
  rawText: string;
  documentType: string;
}

export interface SarvamAdapter {
  translate(opts: TranslateOptions): Promise<TranslateResult>;
  transliterate(opts: TransliterateOptions): Promise<TransliterateResult>;
  stt(opts: STTOptions): Promise<STTResult>;
  tts(opts: TTSOptions): Promise<TTSResult>;
  docAI(opts: DocAIOptions): Promise<DocAIResult>;
}
