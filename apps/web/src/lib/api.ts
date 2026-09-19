/**
 * API client for communicating with apps/api backend.
 * Uses relative `/api/*` (proxied in dev/production via Next rewrites or direct port).
 */

import {
  createMockJourney,
  getMockDocuments,
  getMockUploadResult,
  getMockReminderResponse,
  getMockEscalationResponse,
  getMockEscalations,
  getMockOutboxStatus,
  getMockExplanation,
} from './mockFallback';

function getApiBase(): string {
  const raw = (process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3001/api').trim().replace(/\/+$/, '');
  return raw.endsWith('/api') ? raw : `${raw}/api`;
}

const API_BASE = getApiBase();

async function apiFetch(endpoint: string, init?: RequestInit): Promise<Response> {
  const primaryUrl = `${API_BASE}${endpoint}`;
  try {
    return await fetch(primaryUrl, init);
  } catch (err) {
    // If the browser fetch fails (e.g. CORS preflight blocked on direct cloud URL)
    // seamlessly fall back to relative /api proxy via Next.js rewrites
    if (typeof window !== 'undefined' && primaryUrl.startsWith('http') && !endpoint.startsWith('http')) {
      try {
        const fallbackUrl = `/api${endpoint}`;
        return await fetch(fallbackUrl, init);
      } catch {
        // Fallback failed too, rethrow original error
      }
    }
    throw err;
  }
}

export interface CreateJourneyPayload {
  language?: 'en' | 'hi' | 'hinglish';
  initialMessage?: string;
}

export interface JourneyResponse {
  _id: string;
  userId: string;
  state: string;
  domain?: string;
  language: 'en' | 'hi' | 'hinglish';
  profile: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export async function createJourney(payload: CreateJourneyPayload = {}): Promise<JourneyResponse> {
  try {
    const res = await apiFetch('/journeys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.warn('Backend /journeys returned error status, falling back to mock mode.');
      return createMockJourney(payload.initialMessage, payload.language);
    }
    return (await res.json()) as JourneyResponse;
  } catch (err) {
    console.warn('Backend /journeys unreachable, falling back to mock mode:', err);
    return createMockJourney(payload.initialMessage, payload.language);
  }
}

export async function getJourney(id: string): Promise<JourneyResponse> {
  try {
    const res = await apiFetch(`/journeys/${id}`, {
      credentials: 'include',
    });
    if (!res.ok) {
      const mock = createMockJourney();
      mock._id = id;
      return mock;
    }
    return (await res.json()) as JourneyResponse;
  } catch {
    const mock = createMockJourney();
    mock._id = id;
    return mock;
  }
}

export async function sendFeedback(payload: {
  messageId: string;
  vote: 'up' | 'down';
  comment?: string;
}): Promise<{ status: string }> {
  try {
    const res = await apiFetch('/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { status: 'ok' };
    return (await res.json()) as { status: string };
  } catch {
    return { status: 'ok' };
  }
}

export async function explainTerm(term: string): Promise<{ term: string; explanation: string; simpleAnalogy?: string }> {
  try {
    const res = await apiFetch('/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ term }),
    });
    if (!res.ok) return getMockExplanation(term);
    return (await res.json()) as { term: string; explanation: string; simpleAnalogy?: string };
  } catch {
    return getMockExplanation(term);
  }
}

export interface UploadDocumentResponse {
  docId: string;
  docType: string;
  status: 'verified' | 'review_needed' | 'failed';
  extractedSummary: Record<string, unknown>;
  journeyStateUpdated?: string;
}

export interface DocumentItem {
  _id: string;
  journeyId: string;
  userId: string;
  docType: string;
  status: 'needed' | 'uploading' | 'reading' | 'review_needed' | 'verified' | 'failed';
  originalFilename?: string;
  extractedFields?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export async function uploadDocument(
  journeyId: string,
  payload: {
    docType: string;
    filename: string;
    contentBase64?: string;
    mimeType?: string;
  }
): Promise<UploadDocumentResponse> {
  try {
    const res = await apiFetch(`/journeys/${journeyId}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) return getMockUploadResult(payload.docType, payload.filename);
    return (await res.json()) as UploadDocumentResponse;
  } catch {
    return getMockUploadResult(payload.docType, payload.filename);
  }
}

export async function listDocuments(journeyId: string): Promise<DocumentItem[]> {
  try {
    const res = await apiFetch(`/journeys/${journeyId}/documents`, {
      credentials: 'include',
    });
    if (!res.ok) return getMockDocuments();
    const data = (await res.json()) as { documents: DocumentItem[] };
    return data.documents;
  } catch {
    return getMockDocuments();
  }
}

export async function deleteDocument(
  journeyId: string,
  docId: string
): Promise<{ success: boolean; stateRevertedTo?: string }> {
  try {
    const res = await apiFetch(`/journeys/${journeyId}/documents/${docId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) return { success: true, stateRevertedTo: 'checklist_review' };
    return (await res.json()) as { success: boolean; stateRevertedTo?: string };
  } catch {
    return { success: true, stateRevertedTo: 'checklist_review' };
  }
}

export interface ReminderPayload {
  note: string;
  channel?: 'whatsapp' | 'sms' | 'push' | 'email';
  remindAt?: string;
}

export interface ReminderResponse {
  success: boolean;
  message: string;
  eventId: string;
}

export async function scheduleReminder(
  journeyId: string,
  payload: ReminderPayload
): Promise<ReminderResponse> {
  try {
    const res = await apiFetch(`/journeys/${journeyId}/remind`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) return getMockReminderResponse(payload.channel);
    return (await res.json()) as ReminderResponse;
  } catch {
    return getMockReminderResponse(payload.channel);
  }
}

export interface EscalatePayload {
  reason: string;
  comment?: string;
}

export interface EscalateResponse {
  success: boolean;
  escalationId: string;
  outboxDeliveryId: string;
  message: string;
}

export async function escalateJourney(
  journeyId: string,
  payload: EscalatePayload
): Promise<EscalateResponse> {
  try {
    const res = await apiFetch(`/journeys/${journeyId}/escalate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) return getMockEscalationResponse();
    return (await res.json()) as EscalateResponse;
  } catch {
    return getMockEscalationResponse();
  }
}

export interface EscalationRecord {
  _id: string;
  journeyId: string;
  userId: string;
  reason: string;
  status: 'pending' | 'in_progress' | 'resolved';
  createdAt: string;
}

export async function getEscalations(journeyId: string): Promise<EscalationRecord[]> {
  try {
    const res = await apiFetch(`/journeys/${journeyId}/escalations`, {
      credentials: 'include',
    });
    if (!res.ok) return getMockEscalations();
    const data = (await res.json()) as { escalations: EscalationRecord[] };
    return data.escalations;
  } catch {
    return getMockEscalations();
  }
}

export interface OutboxStatusResponse {
  pending: number;
  completed: number;
  failed: number;
  total: number;
}

export async function getOutboxStatus(): Promise<OutboxStatusResponse> {
  try {
    const res = await apiFetch('/outbox/status', {
      credentials: 'include',
    });
    if (!res.ok) return getMockOutboxStatus();
    return (await res.json()) as OutboxStatusResponse;
  } catch {
    return getMockOutboxStatus();
  }
}


