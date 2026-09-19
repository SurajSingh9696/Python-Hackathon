# Sahaj — Security & Compliance Architecture (A16 Verification)

This document formalizes the 16 security and statutory compliance assertions implemented across the Sahaj codebase for **Paytm Hackathon Track 2**.

---

## 1. The 16 Security Assertions (A16)

### A1: Cryptographically Signed Guest Sessions
- **Implementation:** `apps/api/src/auth/session.ts`
- **Behavior:** Guest sessions are initialized with UUIDv4 tokens and signed using `@fastify/cookie`.
- **Flags:** `httpOnly: true`, `secure: true` (in production), `sameSite: 'strict'`, `path: '/'`.

### A2: Strict 404 on Unauthorized Journey Access (Zero ID Enumeration)
- **Implementation:** `apps/api/src/repositories/journeyRepository.ts`
- **Behavior:** If User B attempts to access a journey owned by User A, the API returns **HTTP 404 Not Found** (never HTTP 403 Forbidden). This completely prevents journey ID harvesting and enumeration attacks.

### A3: Multi-User Knowledge Graph Namespace Isolation
- **Implementation:** `apps/api/src/adapters/knowledge/`
- **Behavior:** Cognee datasets and Local BM25 search indices enforce physical namespace separation: `journey_context_{userId}`.
- **Verification:** Verified via `apps/api/src/__tests__/leakage.test.ts` (100% zero leakage between User A and User B).

### A4: PII Masking on All Uploaded Documents
- **Implementation:** `apps/api/src/services/maskingService.ts`
- **Behavior:** Regex and heuristic masking strips sensitive identifiers before display or persistence:
  - Aadhaar: `XXXX-XXXX-1234`
  - PAN: `XXXXX1234X`
  - Bank Accounts: `XXXXXX9876` (last 4 digits only).

### A5: Strict Document Upload Gates
- **Implementation:** `apps/api/src/routes/documents.ts` and `DocumentUploadModal.tsx`
- **Behavior:** Client and server-side validation enforcing a strict 10MB file size limit and allowed MIME types (PDF, PNG, JPEG).

### A6: Zero LLM Math Hallucination
- **Implementation:** `packages/shared/src/calculators.ts`
- **Behavior:** The LLM is strictly prohibited from computing financial numbers. All EMIs, FOIR ratios, moratorium interests, and GST costs are computed deterministically.

### A7: Transactional Outbox Pattern with HMAC-SHA256 Signatures
- **Implementation:** `apps/api/src/services/outboxService.ts`
- **Behavior:** Outgoing n8n automation webhooks are signed using `crypto.createHmac('sha256', secret)`. Headers include `X-Sahaj-Signature`, `X-Sahaj-Delivery`, and `X-Sahaj-Timestamp`.

### A8: Adversarial Prompt Injection Neutralization
- **Implementation:** `apps/api/src/services/outputGuard.ts`
- **Behavior:** Multi-pattern regex filter detects system override attempts, jailbreaks (`DAN mode`, `[INST]`, `ignore previous instructions`), and XSS script tags, neutralizing malicious inputs.

### A9: Statutory Compliance Disclaimers
- **Implementation:** `packages/shared/src/guardrails.ts` & `apps/api/src/services/outputGuard.ts`
- **Behavior:** In accordance with RBI and IRDAI regulations, every output quoting indicative rates, EMIs, or loan figures automatically appends the statutory disclaimer.

### A10: Prohibited Superlative & Guarantee Phrase Blocking
- **Implementation:** Length-sorted banned phrase scanner in `packages/shared/src/guardrails.ts`
- **Behavior:** Prohibits deceptive terms like *"100% guaranteed"*, *"pre-approved"*, *"pakka milega"*, replacing them with compliant conditional phrasing.

### A11: Rate Limiting
- **Implementation:** `@fastify/rate-limit` in `apps/api/src/http/app.ts`
- **Behavior:** 100 requests per minute per IP to prevent denial-of-service and brute force requests.

### A12: Security Headers (Helmet)
- **Implementation:** `@fastify/helmet` in `apps/api/src/http/app.ts`
- **Behavior:** Comprehensive headers enabled: Content Security Policy, HSTS, X-Content-Type-Options (`nosniff`), X-Frame-Options (`DENY`), and Referrer-Policy.

### A13: Strict CORS Policy
- **Implementation:** `@fastify/cors` in `apps/api/src/http/app.ts`
- **Behavior:** Whitelisted origin matching frontend host with credentials support (`credentials: true`).

### A14: Automated Secret Scanning
- **Implementation:** `scripts/secret-scan.sh`
- **Behavior:** Pre-commit/CI shell script scanning for high-entropy tokens, AWS keys, Groq API keys, and private keys.

### A15: SSE Resource Leak Prevention & Graceful Disconnect
- **Implementation:** `apps/api/src/http/sse.ts`
- **Behavior:** Closes socket listeners and aborts background stream generators immediately upon client disconnection.

### A16: User Data Deletion (Right to Erasure)
- **Implementation:** `DELETE /api/me` in `apps/api/src/routes/journeys.ts`
- **Behavior:** Purges all user journeys, uploaded documents, stored events, and associated in-memory session indices.
