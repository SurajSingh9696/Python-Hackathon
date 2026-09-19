/**
 * Live Sarvam AI Adapter
 * Calls the actual Sarvam AI REST API (api.sarvam.ai).
 *
 * Endpoints used:
 * - POST /translate
 * - POST /transliterate
 * - POST /speech-to-text
 * - POST /text-to-speech
 * - POST /parse  (DocAI)
 */
import type {
  SarvamAdapter,
  TranslateOptions,
  TranslateResult,
  TransliterateOptions,
  TransliterateResult,
  STTOptions,
  STTResult,
  TTSOptions,
  TTSResult,
  DocAIOptions,
  DocAIResult,
} from './types.js';

interface SarvamConfig {
  apiKey: string;
  baseUrl: string;
  timeoutMs: number;
}

export class LiveSarvamAdapter implements SarvamAdapter {
  constructor(private readonly cfg: SarvamConfig) {}

  private async post<T>(path: string, body: unknown): Promise<T> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.cfg.timeoutMs);

    let response: Response;
    try {
      response = await fetch(`${this.cfg.baseUrl}${path}`, {
        method: 'POST',
        signal: ctrl.signal,
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': this.cfg.apiKey,
        },
        body: JSON.stringify(body),
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`[Sarvam] ${path} failed (${response.status}): ${text.slice(0, 200)}`);
    }

    return response.json() as Promise<T>;
  }

  async translate(opts: TranslateOptions): Promise<TranslateResult> {
    const res = await this.post<{ translated_text: string }>('/translate', {
      input: opts.text,
      source_language_code: opts.sourceLang,
      target_language_code: opts.targetLang,
      speaker_gender: 'Female',
      mode: opts.speakerStyle ?? 'formal',
      model: 'mayura:v1',
      enable_preprocessing: true,
    });
    return {
      translatedText: res.translated_text,
      sourceLang: opts.sourceLang,
      targetLang: opts.targetLang,
    };
  }

  async transliterate(opts: TransliterateOptions): Promise<TransliterateResult> {
    const res = await this.post<{ transliterated_text: string }>('/transliterate', {
      input: opts.text,
      source_language_code: opts.sourceLang,
      target_language_code: opts.targetLang,
    });
    return { transliteratedText: res.transliterated_text };
  }

  async stt(opts: STTOptions): Promise<STTResult> {
    const res = await this.post<{ transcript: string; confidence: number }>('/speech-to-text', {
      audio: opts.audioBase64,
      language_code: opts.language,
      model: 'saarika:v2',
    });
    return {
      transcript: res.transcript,
      confidence: res.confidence ?? 0.9,
      language: opts.language,
    };
  }

  async tts(opts: TTSOptions): Promise<TTSResult> {
    const res = await this.post<{ audio: string; duration_ms: number }>('/text-to-speech', {
      inputs: [opts.text],
      target_language_code: opts.language,
      speaker: opts.speaker ?? 'meera',
      pitch: 0,
      pace: 1.0,
      loudness: 1.5,
      speech_sample_rate: 22050,
      enable_preprocessing: true,
      model: 'bulbul:v2',
    });
    return {
      audioBase64: res.audio,
      mimeType: 'audio/wav',
      durationMs: res.duration_ms,
    };
  }

  async docAI(opts: DocAIOptions): Promise<DocAIResult> {
    const res = await this.post<{
      extracted_fields: Record<string, string | number | null>;
      confidence: number;
      raw_text: string;
    }>('/parse', {
      document: opts.documentBase64,
      document_type: opts.documentType,
      file_type: opts.mimeType,
    });
    return {
      extractedFields: res.extracted_fields ?? {},
      confidence: res.confidence ?? 0.85,
      rawText: res.raw_text ?? '',
      documentType: opts.documentType,
    };
  }
}
