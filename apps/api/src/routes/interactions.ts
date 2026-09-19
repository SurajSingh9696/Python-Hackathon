/**
 * Interaction, Feedback, Explanation, Escalation, and Privacy Routes.
 *
 * Implements:
 * - POST   /api/feedback
 * - POST   /api/explain (Glossary lookup in EN / HI / Hinglish)
 * - POST   /api/escalate
 * - POST   /api/consent
 * - DELETE /api/me (GDPR / Data minimization wipe)
 * - POST   /api/voice/stt (Voice input adapter stub)
 * - POST   /api/voice/tts (Voice readout adapter stub)
 * - POST   /api/journeys/:id/documents (Upload stub)
 * - POST   /api/documents/:id/extract (Document AI extract stub)
 */
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { FeedbackSchema, ConsentSchema } from '@sahaj/shared';
import { journeyRepo } from '../repositories/journeyRepository.js';
import { getCollections } from '../db/collections.js';
import { getDb, getMongoStatus } from '../db/connection.js';

// ── Synthetic Financial Glossary ──────────────────────────────────────────────
const GLOSSARY: Record<string, { en: string; hi: string; hinglish: string }> = {
  emi: {
    en: 'Equated Monthly Instalment — a fixed amount paid by a borrower to a lender at a specified date each calendar month.',
    hi: 'समान मासिक किस्त — वह निश्चित राशि जो उधारकर्ता हर महीने एक तय तारीख पर ऋणदाता को चुकाता है।',
    hinglish: 'Equated Monthly Instalment — har mahine ki fixed rashi jo aap apne loan ko chukane ke liye dete hain.',
  },
  moratorium: {
    en: 'A payment holiday during which you do not have to pay the regular EMI. For education loans, this typically covers your entire study period plus 6 months.',
    hi: 'भुगतान अवकाश (मोरेटोरियम) — वह अवधि जिसके दौरान आपको नियमित ईएमआई नहीं देनी होती। शिक्षा ऋण में यह पढ़ाई की पूरी अवधि और उसके बाद 6 महीने तक हो सकता है।',
    hinglish: 'Ek payment holiday jisme aapko padhai ke dauran principal EMI nahi deni hoti; padhai khatam hone ke 6 mahine baad EMI shuru hoti hai.',
  },
  foir: {
    en: 'Fixed Obligation to Income Ratio — the proportion of your monthly income that goes toward paying loan EMIs. Lenders prefer this to stay below 50%.',
    hi: 'आय के अनुपात में निश्चित देनदारी (FOIR) — आपकी मासिक आय का वह प्रतिशत जो ऋण की किस्तों में जाता है। बैंक इसे 50% से कम रखना पसंद करते हैं।',
    hinglish: 'FOIR ka matlab hai aapki monthly income ka kitna hissa existing aur nayi EMI mein ja raha hai. Lenders ise 50% se kam dekhna chahte hain.',
  },
  'co-applicant': {
    en: 'A secondary person (usually a parent or spouse) who applies for the loan with you and shares legal repayment responsibility.',
    hi: 'सह-आवेदक — वह अतिरिक्त व्यक्ति (जैसे माता-पिता या जीवनसाथी) जो आपके साथ ऋण के लिए आवेदन करता है और पुनर्भुगतान की संयुक्त जिम्मेदारी लेता है।',
    hinglish: 'Co-applicant ek secondary applicant hota hai (jaise parent ya guardian) jo student ke saath milkar loan apply karta hai.',
  },
  'processing fee': {
    en: 'A one-time upfront fee charged by the lender to process and verify your loan application, typically 0.5% to 2% plus GST.',
    hi: 'प्रोसेसिंग शुल्क — ऋण आवेदन के सत्यापन और प्रसंस्करण के लिए बैंक द्वारा एक बार लिया जाने वाला प्रशासनिक शुल्क।',
    hinglish: 'Ek one-time administrative fee jo bank loan application process karne ke liye leta hai (usually 0.5% se 2% + GST).',
  },
};

export const interactionsRoutes: FastifyPluginAsync = async (app) => {
  // ── POST /api/feedback ─────────────────────────────────────────
  app.post('/feedback', async (request, reply) => {
    const body = FeedbackSchema.parse(request.body);
    const status = getMongoStatus();

    if (status.connected) {
      const cols = getCollections(getDb());
      await cols.feedback.insertOne({
        _id: uuidv4(),
        userId: request.userId,
        messageId: body.messageId,
        vote: body.vote,
        ...(body.comment !== undefined ? { comment: body.comment } : {}),
        createdAt: new Date(),
      });
    }

    return reply.status(200).send({ status: 'ok', recorded: true });
  });

  // ── POST /api/explain ──────────────────────────────────────────
  app.post('/explain', async (request, reply) => {
    const BodySchema = z.object({
      term: z.string().min(1),
      language: z.enum(['en', 'hi', 'hinglish']).optional().default('en'),
    });

    const body = BodySchema.parse(request.body);
    const key = body.term.toLowerCase().trim();
    const entry = GLOSSARY[key] ?? {
      en: `${body.term} is a standard financial term. Please verify specific details with your financial provider.`,
      hi: `${body.term} एक वित्तीय शब्द है। विस्तृत जानकारी के लिए अपने ऋणदाता से संपर्क करें।`,
      hinglish: `${body.term} ek financial term hai. Iski details lender ke guidelines mein mention hoti hain.`,
    };

    return reply.send({
      term: body.term,
      explanation: entry[body.language],
      language: body.language,
      source: 'Sahaj Verified Financial Glossary v1.0',
    });
  });

  // ── POST /api/escalate ─────────────────────────────────────────
  app.post('/escalate', async (request, reply) => {
    const BodySchema = z.object({
      journeyId: z.string().min(1),
      reason: z.string().min(1),
    });

    const body = BodySchema.parse(request.body);
    // Verify ownership
    await journeyRepo.getById(body.journeyId, request.userId);

    const status = getMongoStatus();
    if (status.connected) {
      const cols = getCollections(getDb());
      await cols.escalations.insertOne({
        _id: uuidv4(),
        journeyId: body.journeyId,
        userId: request.userId,
        reason: body.reason,
        status: 'pending',
        createdAt: new Date(),
      });
    }

    return reply.send({
      status: 'escalated',
      ticketId: `ESC-${Date.now().toString().slice(-6)}`,
      message: 'Your case has been forwarded to a senior advisor. You will receive an update shortly.',
    });
  });

  // ── POST /api/consent ──────────────────────────────────────────
  app.post('/consent', async (request, reply) => {
    const body = ConsentSchema.parse(request.body);
    const status = getMongoStatus();

    if (status.connected) {
      const cols = getCollections(getDb());
      await cols.consents.updateOne(
        { userId: request.userId },
        {
          $set: {
            userId: request.userId,
            dataProcessing: body.dataProcessing,
            aiAnalysis: body.aiAnalysis,
            timestamp: new Date(body.timestamp),
          },
        },
        { upsert: true }
      );
    }

    return reply.send({ status: 'consent_recorded', userId: request.userId });
  });

  // ── DELETE /api/me ─────────────────────────────────────────────
  app.delete('/me', async (request, reply) => {
    await journeyRepo.wipeUser(request.userId);

    // Clear session cookie
    reply.clearCookie('sahaj_session', { path: '/' });

    return reply.send({
      status: 'wiped',
      message: 'All user data, financial profiles, and journey history have been completely deleted.',
      userId: request.userId,
    });
  });

  // ── POST /api/voice/stt ────────────────────────────────────────
  app.post('/voice/stt', async (_request, reply) => {
    // Stub voice endpoint for mock mode
    return reply.send({
      transcript: 'Mujhe do lakh ki zarurat hai apni education ke liye',
      confidence: 0.94,
      language: 'hinglish',
      mode: 'mock',
    });
  });

  // ── POST /api/voice/tts ────────────────────────────────────────
  app.post('/voice/tts', async (_request, reply) => {
    return reply.send({
      audioUrl: '/audio/demo-response.mp3',
      format: 'mp3',
      mode: 'mock',
    });
  });


  // ── POST /api/documents/:id/extract (Extraction stub) ───────────
  app.post('/documents/:id/extract', async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);

    return reply.send({
      documentId: params.id,
      status: 'review_needed',
      docType: 'income_proof',
      extractedFields: [
        { key: 'employer', label: 'Employer Name', value: 'Apex Tech Solutions Pvt Ltd', confidence: 0.96, needsReview: false },
        { key: 'grossIncome', label: 'Gross Monthly Income', value: 35000, confidence: 0.95, needsReview: false },
        { key: 'netIncome', label: 'Net Take-home Income', value: 30000, confidence: 0.93, needsReview: false },
        { key: 'pan', label: 'PAN Number (Masked)', value: 'XXXXXX4812', confidence: 0.62, needsReview: true }, // Deliberately low confidence for review UI demo
      ],
    });
  });
};
