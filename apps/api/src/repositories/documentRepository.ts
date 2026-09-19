import { v4 as uuidv4 } from 'uuid';
import { getCollections, type DocumentItemDoc } from '../db/collections.js';
import { getDb, getMongoStatus } from '../db/connection.js';
import { NotFoundError } from './journeyRepository.js';

// In-memory fallback map for offline tests
const memoryDocuments = new Map<string, DocumentItemDoc>();

export interface CreateDocumentInput {
  journeyId: string;
  userId: string;
  docType: string;
  originalFilename?: string;
  extractedFields?: Record<string, unknown>;
  status: 'needed' | 'uploading' | 'reading' | 'review_needed' | 'verified' | 'failed';
}

export class DocumentRepository {
  async upsert(input: CreateDocumentInput): Promise<DocumentItemDoc> {
    const status = getMongoStatus();
    const now = new Date();

    // Find existing doc for this journey and docType
    let existing = await this.findByType(input.journeyId, input.docType, input.userId);

    const doc: DocumentItemDoc = {
      _id: existing ? existing._id : uuidv4(),
      journeyId: input.journeyId,
      userId: input.userId,
      docType: input.docType,
      status: input.status,
      ...(input.originalFilename !== undefined ? { originalFilename: input.originalFilename } : {}),
      ...(input.extractedFields !== undefined ? { extractedFields: input.extractedFields } : {}),
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };

    if (status.connected) {
      const cols = getCollections(getDb());
      await cols.documents.replaceOne({ _id: doc._id }, doc, { upsert: true });
    } else {
      memoryDocuments.set(doc._id, { ...doc });
    }

    return doc;
  }

  async findByType(journeyId: string, docType: string, userId: string): Promise<DocumentItemDoc | null> {
    const status = getMongoStatus();
    if (status.connected) {
      const cols = getCollections(getDb());
      const doc = await cols.documents.findOne({ journeyId, docType, userId });
      return doc ? { ...doc } : null;
    }

    for (const d of memoryDocuments.values()) {
      if (d.journeyId === journeyId && d.docType === docType && d.userId === userId) {
        return { ...d };
      }
    }
    return null;
  }

  async listByJourney(journeyId: string, userId: string): Promise<DocumentItemDoc[]> {
    const status = getMongoStatus();
    if (status.connected) {
      const cols = getCollections(getDb());
      return cols.documents.find({ journeyId, userId }).sort({ createdAt: 1 }).toArray();
    }

    const list: DocumentItemDoc[] = [];
    for (const d of memoryDocuments.values()) {
      if (d.journeyId === journeyId && d.userId === userId) {
        list.push({ ...d });
      }
    }
    return list;
  }

  async getById(id: string, journeyId: string, userId: string): Promise<DocumentItemDoc> {
    const status = getMongoStatus();
    if (status.connected) {
      const cols = getCollections(getDb());
      const doc = await cols.documents.findOne({ _id: id, journeyId, userId });
      if (!doc) throw new NotFoundError('Document not found');
      return doc;
    }

    const doc = memoryDocuments.get(id);
    if (!doc || doc.journeyId !== journeyId || doc.userId !== userId) {
      throw new NotFoundError('Document not found');
    }
    return { ...doc };
  }

  async delete(id: string, journeyId: string, userId: string): Promise<boolean> {
    const status = getMongoStatus();
    if (status.connected) {
      const cols = getCollections(getDb());
      const res = await cols.documents.deleteOne({ _id: id, journeyId, userId });
      return res.deletedCount > 0;
    }

    const doc = memoryDocuments.get(id);
    if (doc && doc.journeyId === journeyId && doc.userId === userId) {
      memoryDocuments.delete(id);
      return true;
    }
    return false;
  }
}

export const documentRepo = new DocumentRepository();
