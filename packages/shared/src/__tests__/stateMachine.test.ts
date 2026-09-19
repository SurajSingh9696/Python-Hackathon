import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  transition,
  TransitionError,
  STATE_PROGRESS,
  STATE_LABELS_EN,
  ALL_STATES,
  isPostOptionsState,
  type JourneyState,
  type JourneyEvent,
} from '../stateMachine.js';

describe('Journey State Machine', () => {
  describe('Happy path journey sequence', () => {
    it('executes full sequential lending journey from NEW to APPLICATION_GUIDANCE', () => {
      // 1. NEW -> INTENT_CAPTURED
      let state: JourneyState = 'NEW';
      let res = transition(state, {
        type: 'INTENT_DETECTED',
        domain: 'lending',
        confidence: 0.85,
      });
      expect(res.nextState).toBe('INTENT_CAPTURED');
      state = res.nextState;

      // 2. INTENT_CAPTURED -> PROFILE_INCOMPLETE (amount, income needed)
      res = transition(state, {
        type: 'PROFILE_UPDATED',
        missingFields: ['monthly_income', 'existing_obligations_monthly'],
      });
      expect(res.nextState).toBe('PROFILE_INCOMPLETE');
      expect(res.sideEffects).toEqual([
        { type: 'ASK_MISSING_FIELD', field: 'monthly_income' },
      ]);
      state = res.nextState;

      // 3. PROFILE_INCOMPLETE -> PROFILE_READY
      res = transition(state, {
        type: 'PROFILE_UPDATED',
        missingFields: [],
      });
      expect(res.nextState).toBe('PROFILE_READY');
      expect(res.sideEffects).toEqual([{ type: 'TRIGGER_RETRIEVAL' }]);
      state = res.nextState;

      // 4. PROFILE_READY -> KNOWLEDGE_RETRIEVED
      res = transition(state, { type: 'RETRIEVAL_DONE' });
      expect(res.nextState).toBe('KNOWLEDGE_RETRIEVED');
      expect(res.sideEffects).toEqual([{ type: 'COMPUTE_OPTIONS' }]);
      state = res.nextState;

      // 5. KNOWLEDGE_RETRIEVED -> OPTIONS_READY
      res = transition(state, { type: 'OPTIONS_COMPUTED', count: 3 });
      expect(res.nextState).toBe('OPTIONS_READY');
      expect(res.sideEffects).toEqual([{ type: 'GENERATE_CHECKLIST' }]);
      state = res.nextState;

      // 6. OPTIONS_READY -> DOCUMENTS_PENDING
      res = transition(state, { type: 'CHECKLIST_GENERATED' });
      expect(res.nextState).toBe('DOCUMENTS_PENDING');
      state = res.nextState;

      // 7. DOCUMENTS_PENDING -> APPLICATION_GUIDANCE
      res = transition(state, { type: 'ALL_DOCS_VERIFIED' });
      expect(res.nextState).toBe('APPLICATION_GUIDANCE');
      state = res.nextState;

      // 8. Subsequent questions -> FOLLOW_UP
      res = transition(state, { type: 'NEW_QUESTION', afterOptionsReady: true });
      expect(res.nextState).toBe('FOLLOW_UP');
      expect(res.sideEffects).toEqual([{ type: 'TRIGGER_RETRIEVAL' }]);
    });
  });

  describe('Intent detection rules and general domain', () => {
    it('does not advance if confidence is below 0.6', () => {
      const res = transition('NEW', {
        type: 'INTENT_DETECTED',
        domain: 'lending',
        confidence: 0.55,
      });
      expect(res.nextState).toBe('NEW');
      expect(res.sideEffects).toEqual([]);
    });

    it('stays in NEW and returns side effect ANSWER_GENERAL_QUESTION when domain=general', () => {
      const res = transition('NEW', {
        type: 'INTENT_DETECTED',
        domain: 'general',
        confidence: 0.9,
      });
      expect(res.nextState).toBe('NEW');
      expect(res.sideEffects).toEqual([
        { type: 'ANSWER_GENERAL_QUESTION' },
      ]);
    });
  });

  describe('Direct profile completion', () => {
    it('moves INTENT_CAPTURED directly to PROFILE_READY when PROFILE_COMPLETE is emitted', () => {
      const res = transition('INTENT_CAPTURED', { type: 'PROFILE_COMPLETE' });
      expect(res.nextState).toBe('PROFILE_READY');
      expect(res.sideEffects).toEqual([{ type: 'TRIGGER_RETRIEVAL' }]);
    });

    it('moves PROFILE_INCOMPLETE to PROFILE_READY when PROFILE_COMPLETE is emitted', () => {
      const res = transition('PROFILE_INCOMPLETE', { type: 'PROFILE_COMPLETE' });
      expect(res.nextState).toBe('PROFILE_READY');
      expect(res.sideEffects).toEqual([{ type: 'TRIGGER_RETRIEVAL' }]);
    });
  });

  describe('Zero options handling in KNOWLEDGE_RETRIEVED', () => {
    it('escalates if options computed is 0', () => {
      const res = transition('KNOWLEDGE_RETRIEVED', {
        type: 'OPTIONS_COMPUTED',
        count: 0,
      });
      expect(res.nextState).toBe('KNOWLEDGE_RETRIEVED');
      expect(res.sideEffects).toEqual([
        { type: 'ESCALATE', reason: 'No matching products found' },
      ]);
    });
  });

  describe('Backward invalidation', () => {
    it('invalidates comparisons and triggers retrieval if key profile field changes in OPTIONS_READY', () => {
      const res = transition('OPTIONS_READY', { type: 'KEY_FIELD_CHANGED' });
      expect(res.nextState).toBe('PROFILE_READY');
      expect(res.sideEffects).toEqual([
        { type: 'INVALIDATE_COMPARISONS' },
        { type: 'TRIGGER_RETRIEVAL' },
      ]);
    });

    it('invalidates comparisons if key field changes in DOCUMENTS_PENDING', () => {
      const res = transition('DOCUMENTS_PENDING', { type: 'KEY_FIELD_CHANGED' });
      expect(res.nextState).toBe('PROFILE_READY');
      expect(res.sideEffects).toEqual([
        { type: 'INVALIDATE_COMPARISONS' },
        { type: 'TRIGGER_RETRIEVAL' },
      ]);
    });

    it('invalidates comparisons if key field changes in APPLICATION_GUIDANCE', () => {
      const res = transition('APPLICATION_GUIDANCE', { type: 'KEY_FIELD_CHANGED' });
      expect(res.nextState).toBe('PROFILE_READY');
      expect(res.sideEffects).toEqual([
        { type: 'INVALIDATE_COMPARISONS' },
        { type: 'TRIGGER_RETRIEVAL' },
      ]);
    });

    it('invalidates comparisons if key field changes in FOLLOW_UP', () => {
      const res = transition('FOLLOW_UP', { type: 'KEY_FIELD_CHANGED' });
      expect(res.nextState).toBe('PROFILE_READY');
      expect(res.sideEffects).toEqual([
        { type: 'INVALIDATE_COMPARISONS' },
        { type: 'TRIGGER_RETRIEVAL' },
      ]);
    });
  });

  describe('Illegal transition error enforcement', () => {
    it('throws TransitionError when attempting invalid transition from NEW', () => {
      expect(() =>
        transition('NEW', { type: 'ALL_DOCS_VERIFIED' })
      ).toThrowError(TransitionError);
    });

    it('throws TransitionError when jumping from PROFILE_READY to APPLICATION_GUIDANCE', () => {
      expect(() =>
        transition('PROFILE_READY', { type: 'ALL_DOCS_VERIFIED' })
      ).toThrowError(TransitionError);
    });

    it('throws TransitionError when calling CHECKLIST_GENERATED from NEW', () => {
      expect(() =>
        transition('NEW', { type: 'CHECKLIST_GENERATED' })
      ).toThrowError(TransitionError);
    });
  });

  describe('State helpers & mappings', () => {
    it('has monotonic non-decreasing progress values across stages', () => {
      const orderedStates: JourneyState[] = [
        'NEW',
        'INTENT_CAPTURED',
        'PROFILE_INCOMPLETE',
        'PROFILE_READY',
        'KNOWLEDGE_RETRIEVED',
        'OPTIONS_READY',
        'DOCUMENTS_PENDING',
        'APPLICATION_GUIDANCE',
        'FOLLOW_UP',
      ];

      for (let i = 0; i < orderedStates.length - 1; i++) {
        const sCurr = orderedStates[i]!;
        const sNext = orderedStates[i + 1]!;
        expect(STATE_PROGRESS[sNext]).toBeGreaterThan(STATE_PROGRESS[sCurr]);
      }
    });

    it('has English labels for all states', () => {
      for (const s of ALL_STATES) {
        expect(STATE_LABELS_EN[s]).toBeDefined();
        expect(STATE_LABELS_EN[s].length).toBeGreaterThan(0);
      }
    });

    it('identifies post-options states accurately', () => {
      expect(isPostOptionsState('OPTIONS_READY')).toBe(true);
      expect(isPostOptionsState('DOCUMENTS_PENDING')).toBe(true);
      expect(isPostOptionsState('APPLICATION_GUIDANCE')).toBe(true);
      expect(isPostOptionsState('FOLLOW_UP')).toBe(true);
      expect(isPostOptionsState('NEW')).toBe(false);
      expect(isPostOptionsState('PROFILE_READY')).toBe(false);
    });
  });

  describe('Property-based testing (fast-check)', () => {
    it('never reaches an undefined state or crashes unexpectedly with valid state & arbitrary events', () => {
      const arbitraryState = fc.constantFrom<JourneyState>(...ALL_STATES);
      const arbitraryEvent = fc.oneof<JourneyEvent>(
        fc.record({
          type: fc.constant('INTENT_DETECTED' as const),
          domain: fc.constantFrom('lending' as const, 'insurance' as const, 'general' as const),
          confidence: fc.float({ min: 0, max: 1 }),
        }),
        fc.record({
          type: fc.constant('PROFILE_UPDATED' as const),
          missingFields: fc.array(fc.string()),
        }),
        fc.constant({ type: 'PROFILE_COMPLETE' as const }),
        fc.constant({ type: 'RETRIEVAL_DONE' as const }),
        fc.record({
          type: fc.constant('OPTIONS_COMPUTED' as const),
          count: fc.integer({ min: 0, max: 10 }),
        }),
        fc.constant({ type: 'CHECKLIST_GENERATED' as const }),
        fc.constant({ type: 'ALL_DOCS_VERIFIED' as const }),
        fc.record({
          type: fc.constant('NEW_QUESTION' as const),
          afterOptionsReady: fc.boolean(),
        }),
        fc.constant({ type: 'KEY_FIELD_CHANGED' as const })
      );

      fc.assert(
        fc.property(arbitraryState, arbitraryEvent, (state, event) => {
          try {
            const res = transition(state, event);
            expect(ALL_STATES).toContain(res.nextState);
            expect(Array.isArray(res.sideEffects)).toBe(true);
          } catch (err) {
            // Must only throw TransitionError, never undefined/TypeError
            expect(err).toBeInstanceOf(TransitionError);
          }
        }),
        { numRuns: 500 }
      );
    });
  });
});
