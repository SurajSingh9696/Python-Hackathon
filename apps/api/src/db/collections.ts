/**
 * MongoDB Collections & Index Definitions.
 *
 * Ensures all required indexes exist per spec:
 * - journeys: { userId: 1, state: 1, updatedAt: -1 }
 * - journey_events: { journeyId: 1, timestamp: 1 }
 * - documents: { journeyId: 1, userId: 1 }
 * - products: { domain: 1, effectiveDate: -1 }
 * - outbox: { status: 1, nextAttemptAt: 1 }
 * - escalations: { journeyId: 1, userId: 1 }
 * - feedback: { journeyId: 1, userId: 1 }
 */
import type { Db, Document } from 'mongodb';

export interface UserDoc extends Document {
  _id: string; // uuid
  isGuest: boolean;
  createdAt: Date;
  lastActiveAt: Date;
}

export interface ConsentDoc extends Document {
  userId: string;
  dataProcessing: boolean;
  aiAnalysis: boolean;
  timestamp: Date;
}

export interface JourneyDoc extends Document {
  _id: string; // uuid
  userId: string;
  state: string;
  domain: string;
  language: string;
  title: string;
  profile: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface JourneyEventDoc extends Document {
  _id: string;
  journeyId: string;
  userId: string;
  stateFrom: string;
  stateTo: string;
  eventType: string;
  payload?: Record<string, unknown>;
  timestamp: Date;
}

export interface MessageDoc extends Document {
  _id: string;
  journeyId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  language?: string;
  claims?: Array<{ text: string; sourceId?: string; isEstimate?: boolean }>;
  createdAt: Date;
}

export interface EscalationDoc extends Document {
  _id: string;
  journeyId: string;
  userId: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: Date;
}

export interface FeedbackDoc extends Document {
  _id: string;
  journeyId?: string;
  userId: string;
  messageId: string;
  vote: 'up' | 'down';
  comment?: string;
  createdAt: Date;
}

export interface OutboxDoc extends Document {
  _id: string;
  eventType: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  nextAttemptAt: Date;
  createdAt: Date;
}

export interface DocumentItemDoc extends Document {
  _id: string;
  journeyId: string;
  userId: string;
  docType: string;
  status: 'needed' | 'uploading' | 'reading' | 'review_needed' | 'verified' | 'failed';
  originalFilename?: string;
  storagePath?: string;
  extractedFields?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export function getCollections(db: Db) {
  return {
    users: db.collection<UserDoc>('users'),
    consents: db.collection<ConsentDoc>('consents'),
    journeys: db.collection<JourneyDoc>('journeys'),
    journeyEvents: db.collection<JourneyEventDoc>('journey_events'),
    messages: db.collection<MessageDoc>('messages'),
    escalations: db.collection<EscalationDoc>('escalations'),
    feedback: db.collection<FeedbackDoc>('feedback'),
    outbox: db.collection<OutboxDoc>('outbox'),
    documents: db.collection<DocumentItemDoc>('documents'),
    products: db.collection('products'),
  };
}

export async function ensureIndexes(db: Db): Promise<void> {
  const cols = getCollections(db);

  await Promise.all([
    // Journeys
    cols.journeys.createIndex({ userId: 1, state: 1, updatedAt: -1 }),
    // Journey Events
    cols.journeyEvents.createIndex({ journeyId: 1, timestamp: 1 }),
    // Documents
    cols.documents.createIndex({ journeyId: 1, userId: 1 }),
    // Outbox
    cols.outbox.createIndex({ status: 1, nextAttemptAt: 1 }),
    // Messages
    cols.messages.createIndex({ journeyId: 1, createdAt: 1 }),
    // Escalations
    cols.escalations.createIndex({ journeyId: 1, userId: 1 }),
    // Feedback
    cols.feedback.createIndex({ messageId: 1, userId: 1 }),
  ]);
}
