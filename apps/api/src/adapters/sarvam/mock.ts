/**
 * Mock Sarvam Adapter
 * Returns deterministic in-memory responses — no external API calls.
 * Used in test and demo mode.
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

// Minimal phrase-level lookup table (en → hi)
const EN_TO_HI: Record<string, string> = {
  'What is your monthly income?': 'आपकी मासिक आय कितनी है?',
  'How much loan do you need?': 'आपको कितने ऋण की आवश्यकता है?',
  'Moratorium period': 'मोरेटोरियम अवधि',
  'Please provide your admission letter.': 'कृपया अपना प्रवेश पत्र प्रदान करें।',
  'Education loan': 'शिक्षा ऋण',
  'Health insurance': 'स्वास्थ्य बीमा',
};

// Hinglish transliteration lookup
const HI_TO_HINGLISH: Record<string, string> = {
  'आपकी मासिक आय कितनी है?': 'Aapki monthly aay kitni hai?',
  'शिक्षा ऋण': 'Shiksha Loan',
  'मोरेटोरियम अवधि': 'Moratorium avdhi',
};

export class MockSarvamAdapter implements SarvamAdapter {
  async translate(opts: TranslateOptions): Promise<TranslateResult> {
    await new Promise((r) => setTimeout(r, 10));
    const translated =
      opts.targetLang === 'hi-IN'
        ? (EN_TO_HI[opts.text] ?? `[HI: ${opts.text}]`)
        : `[EN: ${opts.text}]`;
    return { translatedText: translated, sourceLang: opts.sourceLang, targetLang: opts.targetLang };
  }

  async transliterate(opts: TransliterateOptions): Promise<TransliterateResult> {
    await new Promise((r) => setTimeout(r, 5));
    const transliterated =
      opts.sourceLang === 'hi-IN'
        ? (HI_TO_HINGLISH[opts.text] ?? `[Hinglish: ${opts.text}]`)
        : opts.text;
    return { transliteratedText: transliterated };
  }

  async stt(_opts: STTOptions): Promise<STTResult> {
    await new Promise((r) => setTimeout(r, 20));
    return {
      transcript: 'Mujhe 2 lakh ka education loan chahiye',
      confidence: 0.95,
      language: 'hi-IN',
    };
  }

  async tts(opts: TTSOptions): Promise<TTSResult> {
    await new Promise((r) => setTimeout(r, 15));
    // Return a minimal valid WAV header (44 bytes, silent audio)
    const wavHeader = Buffer.from([
      0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45, 0x66, 0x6d, 0x74,
      0x20, 0x10, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x44, 0xac, 0x00, 0x00, 0x88, 0x58,
      0x01, 0x00, 0x02, 0x00, 0x10, 0x00, 0x64, 0x61, 0x74, 0x61, 0x00, 0x00, 0x00, 0x00,
    ]);
    return {
      audioBase64: wavHeader.toString('base64'),
      mimeType: 'audio/wav',
      durationMs: Math.ceil(opts.text.length * 60),
    };
  }

  async docAI(opts: DocAIOptions): Promise<DocAIResult> {
    await new Promise((r) => setTimeout(r, 30));
    const mockFields: Record<string, DocAIResult['extractedFields']> = {
      income_proof: { name: 'Rahul Kumar', monthly_income: 35000, employer: 'Infosys Ltd', pan: 'ABCDE1234F' },
      admission_letter: {
        student_name: 'Priya Sharma',
        institution: 'IIT Bombay',
        course: 'B.Tech Computer Science',
        fee_annual: 180000,
        start_date: '2026-07-15',
      },
      id_proof: { name: 'Rahul Kumar', aadhaar_last4: '4521', dob: '1998-03-10' },
      bank_statement: { average_balance: 28000, account_number_last4: '7832', bank: 'HDFC Bank' },
      generic: { raw_content: 'Document extracted successfully' },
    };
    return {
      extractedFields: mockFields[opts.documentType] ?? mockFields['generic']!,
      confidence: 0.88,
      rawText: `Mock OCR text for ${opts.documentType} document`,
      documentType: opts.documentType,
    };
  }
}
