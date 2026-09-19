import { describe, it, expect, beforeEach } from 'vitest';
import { useJourneyStore } from '../stores/journeyStore';
import type { SseEvent } from '@sahaj/shared';

describe('useJourneyStore', () => {
  beforeEach(() => {
    useJourneyStore.getState().reset();
  });

  it('initializes with default values', () => {
    const state = useJourneyStore.getState();
    expect(state.state).toBe('NEW');
    expect(state.domain).toBe('lending');
    expect(state.messages).toHaveLength(0);
    expect(state.isStreaming).toBe(false);
  });

  it('processes token SSE event correctly', () => {
    const store = useJourneyStore.getState();
    const tokenEvent: SseEvent = { type: 'token', delta: 'Hello world' };
    store.handleSseEvent(tokenEvent);

    expect(useJourneyStore.getState().streamingText).toBe('Hello world');
  });

  it('processes affordability SSE event correctly', () => {
    const store = useJourneyStore.getState();
    const affordEvent: SseEvent = {
      type: 'affordability',
      foirPct: 22,
      headroomMonthly: 23500,
      band: 'comfortable',
      isAffordable: true,
      label: 'Illustrative estimate',
      assumptions: {
        income: 30000,
        existingEmi: 0,
        newEmi: 6500,
        rate: 10.5,
        tenure: 36,
        maxFoirPct: 50,
      },
    };
    store.handleSseEvent(affordEvent);

    const state = useJourneyStore.getState();
    expect(state.affordability?.foirPct).toBe(22);
    expect(state.affordability?.band).toBe('comfortable');
  });

  it('processes escalation SSE event correctly', () => {
    const store = useJourneyStore.getState();
    const escEvent: SseEvent = {
      type: 'escalation',
      reason: 'fraud_alert',
      message: 'Priority review triggered',
    };
    store.handleSseEvent(escEvent);

    const state = useJourneyStore.getState();
    expect(state.escalation?.reason).toBe('fraud_alert');
    expect(state.messages.some((m) => m.role === 'escalation')).toBe(true);
  });
});
