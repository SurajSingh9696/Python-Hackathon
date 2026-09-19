import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { getCollections, type OutboxDoc } from '../db/collections.js';
import { getDb, getMongoStatus } from '../db/connection.js';
import { getConfig } from '../config/env.js';

const memoryOutbox = new Map<string, OutboxDoc>();

export interface EnqueueOutboxInput {
  eventType: string;
  payload: Record<string, unknown>;
}

export class OutboxService {
  async enqueue(input: EnqueueOutboxInput): Promise<OutboxDoc> {
    const now = new Date();
    const doc: OutboxDoc = {
      _id: uuidv4(),
      eventType: input.eventType,
      payload: input.payload,
      status: 'pending',
      attempts: 0,
      nextAttemptAt: now,
      createdAt: now,
    };

    const status = getMongoStatus();
    if (status.connected) {
      const cols = getCollections(getDb());
      await cols.outbox.insertOne(doc);
    } else {
      memoryOutbox.set(doc._id, { ...doc });
    }

    // Attempt immediate delivery asynchronously
    void this.deliver(doc);

    return doc;
  }

  async deliver(doc: OutboxDoc): Promise<boolean> {
    const config = getConfig();

    // If in mock adapter mode or no webhook URL configured, mark completed
    if (config.N8N_ADAPTER === 'mock' || !config.N8N_WEBHOOK_URL) {
      await this.updateStatus(doc._id, 'completed', doc.attempts + 1);
      return true;
    }

    const payloadString = JSON.stringify(doc.payload);
    const secret = config.N8N_WEBHOOK_SECRET || 'sahaj-default-secret';
    const signature = crypto.createHmac('sha256', secret).update(payloadString).digest('hex');

    try {
      const res = await fetch(config.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sahaj-Signature': `sha256=${signature}`,
          'X-Sahaj-Event': doc.eventType,
          'X-Sahaj-Timestamp': new Date().toISOString(),
          'X-Sahaj-Delivery': doc._id,
        },
        body: payloadString,
      });

      if (res.ok) {
        await this.updateStatus(doc._id, 'completed', doc.attempts + 1);
        return true;
      } else {
        throw new Error(`Webhook returned status ${res.status}`);
      }
    } catch {
      const nextAttempts = doc.attempts + 1;
      if (nextAttempts >= config.N8N_RETRY_MAX) {
        await this.updateStatus(doc._id, 'failed', nextAttempts);
      } else {
        // Exponential backoff
        const delayMs = config.N8N_RETRY_DELAY_MS * Math.pow(2, nextAttempts - 1);
        const nextAttemptAt = new Date(Date.now() + delayMs);
        await this.updateStatus(doc._id, 'pending', nextAttempts, nextAttemptAt);
      }
      return false;
    }
  }

  async updateStatus(
    id: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    attempts: number,
    nextAttemptAt?: Date
  ): Promise<void> {
    const mongoStatus = getMongoStatus();
    if (mongoStatus.connected) {
      const cols = getCollections(getDb());
      await cols.outbox.updateOne(
        { _id: id },
        {
          $set: {
            status,
            attempts,
            ...(nextAttemptAt ? { nextAttemptAt } : {}),
          },
        }
      );
    } else {
      const existing = memoryOutbox.get(id);
      if (existing) {
        existing.status = status;
        existing.attempts = attempts;
        if (nextAttemptAt) existing.nextAttemptAt = nextAttemptAt;
      }
    }
  }

  async getStats(): Promise<{ pending: number; completed: number; failed: number; total: number }> {
    const status = getMongoStatus();
    if (status.connected) {
      const cols = getCollections(getDb());
      const all = await cols.outbox.find({}).toArray();
      const pending = all.filter((d) => d.status === 'pending').length;
      const completed = all.filter((d) => d.status === 'completed').length;
      const failed = all.filter((d) => d.status === 'failed').length;
      return { pending, completed, failed, total: all.length };
    }

    const all = Array.from(memoryOutbox.values());
    const pending = all.filter((d) => d.status === 'pending').length;
    const completed = all.filter((d) => d.status === 'completed').length;
    const failed = all.filter((d) => d.status === 'failed').length;
    return { pending, completed, failed, total: all.length };
  }
}

export const outboxService = new OutboxService();
