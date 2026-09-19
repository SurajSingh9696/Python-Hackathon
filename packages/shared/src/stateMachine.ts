/**
 * Journey State Machine — full implementation.
 *
 * Pure function: transition(state, event, ctx) → { nextState, sideEffects[] }
 * Illegal transitions throw a typed TransitionError (never swallowed).
 *
 * Rules from the spec:
 * - NEW → INTENT_CAPTURED  when confidence ≥ 0.6 and domain ∈ {lending, insurance}
 * - domain = general stays in current state (answers a grounded question)
 * - INTENT_CAPTURED → PROFILE_INCOMPLETE  if any required field missing
 * - INTENT_CAPTURED → PROFILE_READY       if all required fields present
 * - PROFILE_READY → KNOWLEDGE_RETRIEVED → OPTIONS_READY (≥1 option computed)
 * - OPTIONS_READY → DOCUMENTS_PENDING    when checklist generated / user proceeds
 * - DOCUMENTS_PENDING → APPLICATION_GUIDANCE  when all mandatory docs verified
 * - * (after OPTIONS_READY) → FOLLOW_UP  on new questions / returning session
 * - KEY_FIELD_CHANGED while OPTIONS_READY → PROFILE_READY + invalidate comparisons
 */

export type JourneyState =
  | 'NEW'
  | 'INTENT_CAPTURED'
  | 'PROFILE_INCOMPLETE'
  | 'PROFILE_READY'
  | 'KNOWLEDGE_RETRIEVED'
  | 'OPTIONS_READY'
  | 'DOCUMENTS_PENDING'
  | 'APPLICATION_GUIDANCE'
  | 'FOLLOW_UP';

export type JourneyDomain = 'lending' | 'insurance' | 'general';

export type JourneyEvent =
  | { type: 'INTENT_DETECTED'; domain: JourneyDomain; confidence: number }
  | { type: 'PROFILE_UPDATED'; missingFields: string[] }
  | { type: 'PROFILE_COMPLETE' }
  | { type: 'RETRIEVAL_DONE' }
  | { type: 'OPTIONS_COMPUTED'; count: number }
  | { type: 'CHECKLIST_GENERATED' }
  | { type: 'ALL_DOCS_VERIFIED' }
  | { type: 'NEW_QUESTION'; afterOptionsReady: boolean }
  | { type: 'KEY_FIELD_CHANGED' };

export type SideEffect =
  | { type: 'ASK_MISSING_FIELD'; field: string }
  | { type: 'TRIGGER_RETRIEVAL' }
  | { type: 'COMPUTE_OPTIONS' }
  | { type: 'GENERATE_CHECKLIST' }
  | { type: 'INVALIDATE_COMPARISONS' }
  | { type: 'ESCALATE'; reason: string }
  | { type: 'ANSWER_GENERAL_QUESTION' };

export interface TransitionResult {
  nextState: JourneyState;
  sideEffects: SideEffect[];
}

export class TransitionError extends Error {
  constructor(
    public readonly currentState: JourneyState,
    public readonly event: JourneyEvent,
    message?: string
  ) {
    super(
      message ??
        `Illegal transition: state=${currentState} event=${event.type}`
    );
    this.name = 'TransitionError';
  }
}

/** Minimum intent confidence to advance the state */
const MIN_INTENT_CONFIDENCE = 0.6;

/**
 * States from which a NEW_QUESTION can transition to FOLLOW_UP.
 * Only valid after OPTIONS_READY has been reached.
 */
const POST_OPTIONS_STATES = new Set<JourneyState>([
  'OPTIONS_READY',
  'DOCUMENTS_PENDING',
  'APPLICATION_GUIDANCE',
  'FOLLOW_UP',
]);

/**
 * Pure state machine transition function.
 * Always returns a { nextState, sideEffects } result.
 * Throws TransitionError for illegal/unsupported event+state combinations.
 */
export function transition(
  currentState: JourneyState,
  event: JourneyEvent,
  _ctx?: Record<string, unknown>
): TransitionResult {
  // ── Universal: NEW_QUESTION after OPTIONS_READY → FOLLOW_UP ──────────
  if (event.type === 'NEW_QUESTION') {
    if (event.afterOptionsReady && POST_OPTIONS_STATES.has(currentState)) {
      return { nextState: 'FOLLOW_UP', sideEffects: [{ type: 'TRIGGER_RETRIEVAL' }] };
    }
    // Before options are ready, a new question is handled as profile update — no state change
    return { nextState: currentState, sideEffects: [] };
  }

  switch (currentState) {
    // ─────────────────────────────────────────────────────────────────────
    case 'NEW': {
      if (event.type === 'INTENT_DETECTED') {
        if (event.domain === 'general') {
          // General question: answer without advancing the journey
          return {
            nextState: 'NEW',
            sideEffects: [{ type: 'ANSWER_GENERAL_QUESTION' }],
          };
        }
        if (event.confidence < MIN_INTENT_CONFIDENCE) {
          // Low confidence: stay in NEW, ask for clarification
          return { nextState: 'NEW', sideEffects: [] };
        }
        // Lending or insurance with sufficient confidence
        return { nextState: 'INTENT_CAPTURED', sideEffects: [] };
      }
      throw new TransitionError(currentState, event);
    }

    // ─────────────────────────────────────────────────────────────────────
    case 'INTENT_CAPTURED': {
      if (event.type === 'PROFILE_UPDATED') {
        if (event.missingFields.length > 0) {
          const field = event.missingFields[0] ?? 'unknown';
          return {
            nextState: 'PROFILE_INCOMPLETE',
            sideEffects: [{ type: 'ASK_MISSING_FIELD', field }],
          };
        }
        return { nextState: 'PROFILE_READY', sideEffects: [{ type: 'TRIGGER_RETRIEVAL' }] };
      }
      if (event.type === 'PROFILE_COMPLETE') {
        return { nextState: 'PROFILE_READY', sideEffects: [{ type: 'TRIGGER_RETRIEVAL' }] };
      }
      if (event.type === 'INTENT_DETECTED') {
        // Re-stated intent — stay, update domain if needed
        return { nextState: 'INTENT_CAPTURED', sideEffects: [] };
      }
      throw new TransitionError(currentState, event);
    }

    // ─────────────────────────────────────────────────────────────────────
    case 'PROFILE_INCOMPLETE': {
      if (event.type === 'PROFILE_UPDATED') {
        if (event.missingFields.length > 0) {
          const field = event.missingFields[0] ?? 'unknown';
          return {
            nextState: 'PROFILE_INCOMPLETE',
            sideEffects: [{ type: 'ASK_MISSING_FIELD', field }],
          };
        }
        return { nextState: 'PROFILE_READY', sideEffects: [{ type: 'TRIGGER_RETRIEVAL' }] };
      }
      if (event.type === 'PROFILE_COMPLETE') {
        return { nextState: 'PROFILE_READY', sideEffects: [{ type: 'TRIGGER_RETRIEVAL' }] };
      }
      if (event.type === 'INTENT_DETECTED') {
        // Clarified intent in mid-profile
        return { nextState: 'PROFILE_INCOMPLETE', sideEffects: [] };
      }
      throw new TransitionError(currentState, event);
    }

    // ─────────────────────────────────────────────────────────────────────
    case 'PROFILE_READY': {
      if (event.type === 'RETRIEVAL_DONE') {
        return { nextState: 'KNOWLEDGE_RETRIEVED', sideEffects: [{ type: 'COMPUTE_OPTIONS' }] };
      }
      if (event.type === 'PROFILE_UPDATED') {
        // More info added while waiting for retrieval — stay
        if (event.missingFields.length > 0) {
          const field = event.missingFields[0] ?? 'unknown';
          return {
            nextState: 'PROFILE_INCOMPLETE',
            sideEffects: [{ type: 'ASK_MISSING_FIELD', field }],
          };
        }
        return { nextState: 'PROFILE_READY', sideEffects: [] };
      }
      throw new TransitionError(currentState, event);
    }

    // ─────────────────────────────────────────────────────────────────────
    case 'KNOWLEDGE_RETRIEVED': {
      if (event.type === 'OPTIONS_COMPUTED') {
        if (event.count >= 1) {
          return {
            nextState: 'OPTIONS_READY',
            sideEffects: [{ type: 'GENERATE_CHECKLIST' }],
          };
        }
        // Zero options — escalate
        return {
          nextState: 'KNOWLEDGE_RETRIEVED',
          sideEffects: [{ type: 'ESCALATE', reason: 'No matching products found' }],
        };
      }
      throw new TransitionError(currentState, event);
    }

    // ─────────────────────────────────────────────────────────────────────
    case 'OPTIONS_READY': {
      if (event.type === 'CHECKLIST_GENERATED') {
        return { nextState: 'DOCUMENTS_PENDING', sideEffects: [] };
      }
      if (event.type === 'KEY_FIELD_CHANGED') {
        // Backward invalidation: re-run retrieval with updated profile
        return {
          nextState: 'PROFILE_READY',
          sideEffects: [{ type: 'INVALIDATE_COMPARISONS' }, { type: 'TRIGGER_RETRIEVAL' }],
        };
      }
      if (event.type === 'PROFILE_UPDATED') {
        // New profile info while viewing options
        return { nextState: 'OPTIONS_READY', sideEffects: [] };
      }
      throw new TransitionError(currentState, event);
    }

    // ─────────────────────────────────────────────────────────────────────
    case 'DOCUMENTS_PENDING': {
      if (event.type === 'ALL_DOCS_VERIFIED') {
        return { nextState: 'APPLICATION_GUIDANCE', sideEffects: [] };
      }
      if (event.type === 'KEY_FIELD_CHANGED') {
        return {
          nextState: 'PROFILE_READY',
          sideEffects: [{ type: 'INVALIDATE_COMPARISONS' }, { type: 'TRIGGER_RETRIEVAL' }],
        };
      }
      // Additional profile updates during document stage are fine
      if (event.type === 'PROFILE_UPDATED') {
        return { nextState: 'DOCUMENTS_PENDING', sideEffects: [] };
      }
      throw new TransitionError(currentState, event);
    }

    // ─────────────────────────────────────────────────────────────────────
    case 'APPLICATION_GUIDANCE': {
      if (event.type === 'KEY_FIELD_CHANGED') {
        return {
          nextState: 'PROFILE_READY',
          sideEffects: [{ type: 'INVALIDATE_COMPARISONS' }, { type: 'TRIGGER_RETRIEVAL' }],
        };
      }
      if (event.type === 'PROFILE_UPDATED') {
        return { nextState: 'APPLICATION_GUIDANCE', sideEffects: [] };
      }
      throw new TransitionError(currentState, event);
    }

    // ─────────────────────────────────────────────────────────────────────
    case 'FOLLOW_UP': {
      if (event.type === 'PROFILE_UPDATED') {
        return { nextState: 'FOLLOW_UP', sideEffects: [{ type: 'TRIGGER_RETRIEVAL' }] };
      }
      if (event.type === 'KEY_FIELD_CHANGED') {
        return {
          nextState: 'PROFILE_READY',
          sideEffects: [{ type: 'INVALIDATE_COMPARISONS' }, { type: 'TRIGGER_RETRIEVAL' }],
        };
      }
      if (event.type === 'OPTIONS_COMPUTED') {
        return { nextState: 'OPTIONS_READY', sideEffects: [] };
      }
      return { nextState: 'FOLLOW_UP', sideEffects: [] };
    }

    default: {
      // TypeScript exhaustive check
      const _exhaustive: never = currentState;
      throw new TransitionError(_exhaustive as JourneyState, event, `Unknown state: ${String(currentState)}`);
    }
  }
}

/** Maps journey state to a 0–1 progress value for the 3D thread */
export const STATE_PROGRESS: Record<JourneyState, number> = {
  NEW: 0,
  INTENT_CAPTURED: 0.1,
  PROFILE_INCOMPLETE: 0.2,
  PROFILE_READY: 0.35,
  KNOWLEDGE_RETRIEVED: 0.5,
  OPTIONS_READY: 0.65,
  DOCUMENTS_PENDING: 0.8,
  APPLICATION_GUIDANCE: 0.92,
  FOLLOW_UP: 1.0,
};

/** Human-readable label for each state */
export const STATE_LABELS_EN: Record<JourneyState, string> = {
  NEW: 'Getting started',
  INTENT_CAPTURED: 'Goal understood',
  PROFILE_INCOMPLETE: 'Gathering your details',
  PROFILE_READY: 'Profile ready',
  KNOWLEDGE_RETRIEVED: 'Finding options',
  OPTIONS_READY: 'Options ready to compare',
  DOCUMENTS_PENDING: 'Documents needed',
  APPLICATION_GUIDANCE: 'Ready to apply',
  FOLLOW_UP: 'Follow-up',
};

export const STATE_LABELS_HI: Record<JourneyState, string> = {
  NEW: 'शुरू करें',
  INTENT_CAPTURED: 'लक्ष्य समझा',
  PROFILE_INCOMPLETE: 'आपकी जानकारी जुटाई जा रही है',
  PROFILE_READY: 'प्रोफ़ाइल तैयार',
  KNOWLEDGE_RETRIEVED: 'विकल्प खोजे जा रहे हैं',
  OPTIONS_READY: 'विकल्प तुलना के लिए तैयार',
  DOCUMENTS_PENDING: 'दस्तावेज़ चाहिए',
  APPLICATION_GUIDANCE: 'आवेदन के लिए तैयार',
  FOLLOW_UP: 'अनुवर्ती',
};

/** Check if a state is a "post-options" state for FOLLOW_UP eligibility */
export function isPostOptionsState(state: JourneyState): boolean {
  return POST_OPTIONS_STATES.has(state);
}

/** All valid states as a readonly array */
export const ALL_STATES: readonly JourneyState[] = [
  'NEW', 'INTENT_CAPTURED', 'PROFILE_INCOMPLETE', 'PROFILE_READY',
  'KNOWLEDGE_RETRIEVED', 'OPTIONS_READY', 'DOCUMENTS_PENDING',
  'APPLICATION_GUIDANCE', 'FOLLOW_UP',
] as const;
