'use client';

import { create } from 'zustand';
import type { SseEvent, LoanProduct, JourneyState, JourneyDomain } from '@sahaj/shared';
import { createJourney, getJourney } from '../lib/api';
import { startMessageStream } from '../lib/sseClient';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'escalation';
  content: string;
  timestamp: Date;
}

interface JourneyStoreState {
  journeyId: string | null;
  state: JourneyState;
  domain: JourneyDomain;
  progress: number;
  label: string;
  profile: Record<string, unknown>;
  missingFields: string[];
  messages: ChatMessage[];
  streamingText: string;
  isStreaming: boolean;
  currentStage: string | null;
  stageMessage: string | null;
  affordability: {
    foirPct: number;
    headroomMonthly: number;
    band: 'comfortable' | 'stretched' | 'high';
    isAffordable: boolean;
    assumptions: Record<string, number>;
  } | null;
  products: LoanProduct[];
  checklist: Array<{
    id: string;
    label: string;
    labelHi?: string;
    status: 'needed' | 'uploading' | 'reading' | 'review_needed' | 'verified';
    mandatory: boolean;
  }>;
  citations: Array<{
    id: string;
    source: string;
    provider: string;
    version: string;
    effectiveDate: string;
    excerpt?: string;
  }>;
  trace: {
    nodes: Array<{ id: string; label: string; type: string; retrieved: boolean }>;
    edges: Array<{ from: string; to: string }>;
    topK: number;
    retrievalMs: number;
    adapterMode: string;
    sources: string[];
  } | null;
  escalation: { reason: string; message: string } | null;
  error: string | null;

  initJourney: (initialPrompt?: string, language?: 'en' | 'hi' | 'hinglish') => Promise<string>;
  loadJourney: (id: string) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  handleSseEvent: (event: SseEvent) => void;
  reset: () => void;
}

export const useJourneyStore = create<JourneyStoreState>((set, get) => ({
  journeyId: null,
  state: 'NEW',
  domain: 'lending',
  progress: 0.1,
  label: 'Goal understanding',
  profile: {},
  missingFields: ['amount', 'monthly_income'],
  messages: [],
  streamingText: '',
  isStreaming: false,
  currentStage: null,
  stageMessage: null,
  affordability: null,
  products: [],
  checklist: [],
  citations: [],
  trace: null,
  escalation: null,
  error: null,

  initJourney: async (initialPrompt, language = 'hinglish') => {
    try {
      const j = await createJourney({ language, initialMessage: initialPrompt });
      set({
        journeyId: j._id,
        state: (j.state as JourneyState) || 'NEW',
        domain: (j.domain as JourneyDomain) || 'lending',
        profile: j.profile || {},
        error: null,
      });

      if (initialPrompt) {
        await get().sendMessage(initialPrompt);
      }
      return j._id;
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  loadJourney: async (id: string) => {
    try {
      const j = await getJourney(id);
      set({
        journeyId: j._id,
        state: (j.state as JourneyState) || 'NEW',
        domain: (j.domain as JourneyDomain) || 'lending',
        profile: j.profile || {},
      });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  sendMessage: async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    let id = get().journeyId;
    if (!id) {
      id = await get().initJourney();
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    set((s) => ({
      messages: [...s.messages, userMsg],
      isStreaming: true,
      streamingText: '',
      currentStage: 'understanding',
      stageMessage: 'Analyzing your context...',
      error: null,
    }));

    await startMessageStream(id, trimmed, {
      onEvent: (event) => {
        get().handleSseEvent(event);
      },
      onError: (err) => {
        set({ isStreaming: false, error: err.message });
      },
      onDone: () => {
        const remaining = get().streamingText;
        if (remaining) {
          set((s) => ({
            messages: [
              ...s.messages,
              {
                id: `ai-${Date.now()}`,
                role: 'assistant',
                content: remaining,
                timestamp: new Date(),
              },
            ],
            streamingText: '',
            isStreaming: false,
            currentStage: null,
            stageMessage: null,
          }));
        } else {
          set({ isStreaming: false, currentStage: null, stageMessage: null });
        }
      },
    });
  },

  handleSseEvent: (event: SseEvent) => {
    switch (event.type) {
      case 'status':
        set({ currentStage: event.stage, stageMessage: event.message ?? null });
        break;

      case 'token':
        set((s) => ({ streamingText: s.streamingText + event.delta }));
        break;

      case 'intent':
        set((s) => ({
          domain: event.domain,
          profile: {
            ...s.profile,
            ...(event.entities.amount ? { amount: event.entities.amount } : {}),
            ...(event.entities.purpose ? { purpose: event.entities.purpose } : {}),
          },
        }));
        break;

      case 'profile_update':
        set({
          profile: event.fields,
          missingFields: event.missingFields,
        });
        break;

      case 'affordability':
        set({
          affordability: {
            foirPct: event.foirPct,
            headroomMonthly: event.headroomMonthly,
            band: event.band,
            isAffordable: event.isAffordable,
            assumptions: event.assumptions,
          },
        });
        break;

      case 'cards':
        set({ products: event.products as LoanProduct[] });
        break;

      case 'checklist':
        set({ checklist: event.items });
        break;

      case 'citations':
        set({ citations: event.citations });
        break;

      case 'trace':
        set({
          trace: {
            nodes: event.nodes,
            edges: event.edges,
            topK: event.topK,
            retrievalMs: event.retrievalMs,
            adapterMode: event.adapterMode,
            sources: event.sources,
          },
        });
        break;

      case 'escalation':
        set((s) => ({
          escalation: { reason: event.reason, message: event.message },
          messages: [
            ...s.messages,
            {
              id: `esc-${Date.now()}`,
              role: 'escalation',
              content: event.message,
              timestamp: new Date(),
            },
          ],
        }));
        break;

      case 'journey_state':
        set({
          state: event.state,
          progress: event.progress,
          label: event.label,
          ...(event.missingFields ? { missingFields: event.missingFields } : {}),
        });
        break;

      case 'error':
        set({ error: event.message, isStreaming: false });
        break;

      case 'done':
        // Finished handling current turn
        break;
    }
  },

  reset: () =>
    set({
      journeyId: null,
      state: 'NEW',
      domain: 'lending',
      progress: 0.1,
      label: 'Goal understanding',
      profile: {},
      missingFields: [],
      messages: [],
      streamingText: '',
      isStreaming: false,
      currentStage: null,
      stageMessage: null,
      affordability: null,
      products: [],
      checklist: [],
      citations: [],
      trace: null,
      escalation: null,
      error: null,
    }),
}));
