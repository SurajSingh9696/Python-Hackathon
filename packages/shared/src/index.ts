/**
 * @sahaj/shared — Public API
 *
 * Single entry point for all shared types, schemas, calculators,
 * state machine and utilities used by both apps/web and apps/api.
 */

// ── State machine ──────────────────────────────────────────────
export * from './stateMachine.js';

// ── Required fields ────────────────────────────────────────────
export * from './requiredFields.js';

// ── Deterministic calculators ──────────────────────────────────
export * from './calculators.js';

// ── Amount parser ──────────────────────────────────────────────
export * from './parseAmount.js';

// ── Zod schemas & TS types ─────────────────────────────────────
export * from './schemas.js';

// ── Guardrails ─────────────────────────────────────────────────
export * from './guardrails.js';

// ── Formatting utilities ───────────────────────────────────────
export * from './format.js';
