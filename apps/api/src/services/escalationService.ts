/**
 * Escalation Service — Phase 4
 *
 * Handles:
 * 1. Automatic escalation from guardrails (banned words, fraud keywords)
 * 2. Manual escalation from user request
 * 3. Knowledge conflict escalation (contradictory policy docs)
 *
 * Records escalation to MongoDB escalations collection.
 * Emits SSE escalation event via stream.
 * Sends outbox webhook (async, non-blocking).
 */
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/connection.js';
import type { SseStream } from '../http/sse.js';

export type EscalationReason =
  | 'user_request'
  | 'banned_phrase'
  | 'escalation_keyword'
  | 'knowledge_conflict'
  | 'injection_attempt'
  | 'high_risk_amount'
  | 'complaint';

export interface EscalationRecord {
  id: string;
  journeyId: string;
  userId: string;
  reason: EscalationReason;
  trigger: string;
  message: string;
  createdAt: Date;
  status: 'open' | 'resolved';
}

const ESCALATION_MESSAGES: Record<EscalationReason, string> = {
  user_request:
    'A specialist will review your request and follow up with you. Your concern has been noted and prioritised.',
  banned_phrase:
    'We noticed a sensitive term in our response. We are connecting you with a specialist for accurate guidance.',
  escalation_keyword:
    'A specialist team member will review your request. We have noted your concern and flagged it for priority human review.',
  knowledge_conflict:
    'A discrepancy between policy documents was identified. We recommend verifying these terms with a qualified advisor.',
  injection_attempt:
    'Your request could not be processed as submitted. Please rephrase your question about financial products.',
  high_risk_amount:
    'For large loan amounts above ₹25L, we recommend speaking with a specialist. Your journey has been saved.',
  complaint:
    'We take your complaint seriously. A senior specialist will contact you within 2 business hours.',
};

export async function escalate(params: {
  journeyId: string;
  userId: string;
  reason: EscalationReason;
  trigger: string;
  stream?: SseStream;
}): Promise<EscalationRecord> {
  const { journeyId, userId, reason, trigger, stream } = params;
  const message = ESCALATION_MESSAGES[reason];

  const record: EscalationRecord = {
    id: uuidv4(),
    journeyId,
    userId,
    reason,
    trigger,
    message,
    createdAt: new Date(),
    status: 'open',
  };

  // Persist to MongoDB (non-blocking on failure)
  void (async () => {
    try {
      const db = getDb();
      if (db) {
        await db.collection('escalations').insertOne({
          ...record,
          _id: record.id as unknown as import('mongodb').ObjectId,
        });
        // Outbox pattern: also record for webhook delivery
        await db.collection('outbox').insertOne({
          _id: uuidv4() as unknown as import('mongodb').ObjectId,
          event: 'escalation_created',
          payload: record,
          createdAt: new Date(),
          delivered: false,
          retries: 0,
        });
      }
    } catch {
      // Non-blocking: escalation record failure should not break user flow
    }
  })();

  // Emit SSE event if stream provided
  if (stream) {
    stream.send({
      type: 'escalation',
      reason: `${reason}: ${trigger}`,
      message,
    });
  }

  return record;
}
