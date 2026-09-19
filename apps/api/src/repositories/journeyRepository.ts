/**
 * Journey Repository.
 *
 * Implements repository pattern with MongoDB persistence and
 * an in-memory fallback store for offline tests and decoupled execution.
 *
 * Enforces security rule A3-2:
 * User authorization on every operation: journey.userId === session.userId.
 * Any mismatch throws a NotFound error (404, never 403).
 */
import { v4 as uuidv4 } from 'uuid';
import { getCollections, type JourneyDoc, type JourneyEventDoc } from '../db/collections.js';
import { getDb, getMongoStatus } from '../db/connection.js';
import type { JourneyDomain, JourneyState } from '@sahaj/shared';

export interface CreateJourneyInput {
  userId: string;
  domain?: JourneyDomain;
  language?: string;
  title?: string;
}

// In-memory fallback map for tests or standalone mode
const memoryJourneys = new Map<string, JourneyDoc>();
const memoryEvents: JourneyEventDoc[] = [];

export class NotFoundError extends Error {
  statusCode = 404;
  constructor(message = 'Journey not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class JourneyRepository {
  async create(input: CreateJourneyInput): Promise<JourneyDoc> {
    const doc: JourneyDoc = {
      _id: uuidv4(),
      userId: input.userId,
      state: 'NEW',
      domain: input.domain ?? 'lending',
      language: input.language ?? 'en',
      title: input.title ?? 'New Financial Journey',
      profile: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const status = getMongoStatus();
    if (status.connected) {
      const cols = getCollections(getDb());
      await cols.journeys.insertOne(doc);
    } else {
      memoryJourneys.set(doc._id, { ...doc });
    }

    return doc;
  }

  async getById(id: string, userId: string): Promise<JourneyDoc> {
    let journey: JourneyDoc | null = null;
    const status = getMongoStatus();

    if (status.connected) {
      const cols = getCollections(getDb());
      journey = await cols.journeys.findOne({ _id: id });
    } else {
      journey = memoryJourneys.get(id) ?? null;
    }

    // Security Gate A3-2:
    // If not found or if userId does not match, return 404 (do NOT leak existence with 403)
    if (!journey || journey.userId !== userId) {
      throw new NotFoundError();
    }

    return journey;
  }

  async listByUser(userId: string): Promise<JourneyDoc[]> {
    const status = getMongoStatus();
    if (status.connected) {
      const cols = getCollections(getDb());
      return cols.journeys
        .find({ userId })
        .sort({ updatedAt: -1 })
        .toArray();
    }

    return Array.from(memoryJourneys.values())
      .filter((j) => j.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async updateStateAndProfile(
    id: string,
    userId: string,
    update: {
      state?: JourneyState;
      domain?: JourneyDomain;
      language?: string;
      title?: string;
      profile?: Record<string, unknown>;
    }
  ): Promise<JourneyDoc> {
    const journey = await this.getById(id, userId);

    const mergedProfile = update.profile
      ? { ...journey.profile, ...update.profile }
      : journey.profile;

    const updatedDoc: JourneyDoc = {
      ...journey,
      state: update.state ?? journey.state,
      domain: update.domain ?? journey.domain,
      language: update.language ?? journey.language,
      title: update.title ?? journey.title,
      profile: mergedProfile,
      updatedAt: new Date(),
    };

    const status = getMongoStatus();
    if (status.connected) {
      const cols = getCollections(getDb());
      await cols.journeys.updateOne(
        { _id: id, userId },
        {
          $set: {
            state: updatedDoc.state,
            domain: updatedDoc.domain,
            language: updatedDoc.language,
            title: updatedDoc.title,
            profile: updatedDoc.profile,
            updatedAt: updatedDoc.updatedAt,
          },
        }
      );
    } else {
      memoryJourneys.set(id, updatedDoc);
    }

    return updatedDoc;
  }

  async recordEvent(event: {
    journeyId: string;
    userId: string;
    stateFrom: string;
    stateTo: string;
    eventType: string;
    payload?: Record<string, unknown>;
  }): Promise<void> {
    const doc: JourneyEventDoc = {
      _id: uuidv4(),
      journeyId: event.journeyId,
      userId: event.userId,
      stateFrom: event.stateFrom,
      stateTo: event.stateTo,
      eventType: event.eventType,
      ...(event.payload !== undefined ? { payload: event.payload } : {}),
      timestamp: new Date(),
    };

    const status = getMongoStatus();
    if (status.connected) {
      const cols = getCollections(getDb());
      await cols.journeyEvents.insertOne(doc);
    } else {
      memoryEvents.push(doc);
    }
  }

  /** Wipe all journeys and events for a user (for DELETE /api/me) */
  async wipeUser(userId: string): Promise<void> {
    const status = getMongoStatus();
    if (status.connected) {
      const cols = getCollections(getDb());
      await cols.journeys.deleteMany({ userId });
      await cols.journeyEvents.deleteMany({ userId });
      await cols.messages.deleteMany({ userId });
      await cols.documents.deleteMany({ userId });
      await cols.escalations.deleteMany({ userId });
      await cols.feedback.deleteMany({ userId });
      await cols.consents.deleteMany({ userId });
      await cols.users.deleteOne({ _id: userId });
    } else {
      for (const [id, j] of memoryJourneys.entries()) {
        if (j.userId === userId) {
          memoryJourneys.delete(id);
        }
      }
    }
  }
}

export const journeyRepo = new JourneyRepository();
