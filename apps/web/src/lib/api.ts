/**
 * API client for communicating with apps/api backend.
 * Uses relative `/api/*` (proxied in dev/production via Next rewrites or direct port).
 */

function getApiBase(): string {
  const raw = (process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3001/api').trim().replace(/\/+$/, '');
  return raw.endsWith('/api') ? raw : `${raw}/api`;
}

const API_BASE = getApiBase();

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
  const res = await fetch(`${API_BASE}/journeys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create journey: ${err}`);
  }
  return res.json() as Promise<JourneyResponse>;
}

export async function getJourney(id: string): Promise<JourneyResponse> {
  const res = await fetch(`${API_BASE}/journeys/${id}`, {
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`Failed to get journey ${id}: ${res.statusText}`);
  }
  return res.json() as Promise<JourneyResponse>;
}

export async function sendFeedback(payload: {
  messageId: string;
  vote: 'up' | 'down';
  comment?: string;
}): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Feedback submission failed');
  return res.json() as Promise<{ status: string }>;
}

export async function explainTerm(term: string): Promise<{ term: string; explanation: string; simpleAnalogy?: string }> {
  const res = await fetch(`${API_BASE}/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ term }),
  });
  if (!res.ok) throw new Error('Failed to fetch explanation');
  return res.json() as Promise<{ term: string; explanation: string; simpleAnalogy?: string }>;
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
  const res = await fetch(`${API_BASE}/journeys/${journeyId}/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to upload document: ${err}`);
  }
  return res.json() as Promise<UploadDocumentResponse>;
}

export async function listDocuments(journeyId: string): Promise<DocumentItem[]> {
  const res = await fetch(`${API_BASE}/journeys/${journeyId}/documents`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to list documents');
  const data = (await res.json()) as { documents: DocumentItem[] };
  return data.documents;
}

export async function deleteDocument(
  journeyId: string,
  docId: string
): Promise<{ success: boolean; stateRevertedTo?: string }> {
  const res = await fetch(`${API_BASE}/journeys/${journeyId}/documents/${docId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete document');
  return res.json() as Promise<{ success: boolean; stateRevertedTo?: string }>;
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
  const res = await fetch(`${API_BASE}/journeys/${journeyId}/remind`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to schedule reminder: ${err}`);
  }
  return res.json() as Promise<ReminderResponse>;
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
  const res = await fetch(`${API_BASE}/journeys/${journeyId}/escalate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to escalate journey: ${err}`);
  }
  return res.json() as Promise<EscalateResponse>;
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
  const res = await fetch(`${API_BASE}/journeys/${journeyId}/escalations`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch escalations');
  const data = (await res.json()) as { escalations: EscalationRecord[] };
  return data.escalations;
}

export interface OutboxStatusResponse {
  pending: number;
  completed: number;
  failed: number;
  total: number;
}

export async function getOutboxStatus(): Promise<OutboxStatusResponse> {
  const res = await fetch(`${API_BASE}/outbox/status`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch outbox status');
  return res.json() as Promise<OutboxStatusResponse>;
}


