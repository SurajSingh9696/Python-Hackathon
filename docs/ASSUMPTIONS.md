# Sahaj — Assumptions & Decisions Log

Every assumption made during development is recorded here.
Format: `[PHASENUM] [DATE] — Assumption — Rationale`

## Phase 0 — Scaffold

**[P0-01]** LLM live adapter defaults to **Groq** (`GROQ_API_KEY`) with models
`llama-3.3-70b-versatile` (primary) and `qwen-qwq-32b-preview` (reasoning).
OpenAI-compatible fallback available via `LLM_ADAPTER=openai-compatible`.
_Rationale: User confirmed Groq with Llama/Qwen._

**[P0-02]** Cognee adapter targets **Cognee Cloud** (`COGNEE_API_KEY` + `COGNEE_BASE_URL`).
Per-user isolation implemented via dataset namespacing: `journey_context_{userId}`.
_Rationale: User confirmed they have a Cognee API key. Cloud is the documented target._

**[P0-03]** Deployment: **Next.js web → Vercel**, **Fastify API → Railway** (for SSE streaming
support), **Docker Compose** for local dev. `vercel.json` in `apps/web/`,
`railway.toml` in `apps/api/`.
_Rationale: User requested Vercel if it doesn't disturb UI/backend. SSE requires a
long-running server; Fastify on Railway keeps the streaming architecture intact._

**[P0-04]** No blueprint PDF present at `/docs/blueprint.pdf`. The master build prompt
(PART A + PART B) is the source of truth. A placeholder README is placed at `/docs/`.
_Rationale: PDF was not uploaded. All specs are fully defined in the prompt._

**[P0-05]** Redis is **optional**. Without `REDIS_URL`, in-process LRU (`lru-cache`) is used
for shared-dataset retrieval caching, and `p-queue` for job queuing (BullMQ if Redis present).
_Rationale: Keeps zero-dependency local dev possible._

**[P0-06]** n8n is **optional**. Without `N8N_WEBHOOK_URL`, the outbox records intent and
the UI shows "Reminder saved (demo)". Outbox retries when n8n becomes available.
_Rationale: Brief specifies n8n is never in the chat critical path._

**[P0-07]** Paytm connector is **mock-only** (`MockPaytmConnector` reads seed data).
`PaytmSandboxConnector` is stubbed and throws `NotConfigured`. UI always shows
"Demo data — not live Paytm offers" badge.
_Rationale: Hackathon organiser has not confirmed sandbox access. Brief requires mock._

**[P0-08]** Font loading: Anek Latin + Anek Devanagari + Instrument Sans loaded via
`next/font/google`. If CDN unavailable, WOFF2 files are self-hosted in `public/fonts/`.
Noto Sans Devanagari used as fallback for body text.
_Rationale: next/font is the recommended approach; self-hosting is the fallback._

**[P0-09]** Test database is `sahaj_test` (separate from `sahaj` dev). Vitest is the test
runner for unit/integration; Playwright for e2e. Tests are isolated — they never touch
the dev database.
_Rationale: Standard isolation practice._

**[P0-10]** MongoDB driver used directly (not Mongoose) for the API layer, giving full
control over query types and indexes. Zod schemas (not Mongoose schemas) are the
single source of truth for types.
_Rationale: Aligns with brief: Zod is the single source of truth. Avoids schema duplication._

**[P0-11]** Voice features (`FEATURE_VOICE=false` by default). The UI wires the mic button
but shows a tooltip "Voice available when Sarvam is configured" when Sarvam adapter = mock.
_Rationale: Voice is "optional but wired" per brief. Default-off prevents confusion in demo._

**[P0-12]** `next/font` renders Anek Latin for display headings, Anek Devanagari subset
loaded alongside for Hindi/Hinglish content. Width axis used for hero headline animation.
_Rationale: Brief specifies Anek family with variable width axis._

## Phase 1 — Domain Core
_(to be filled as Phase 1 is implemented)_

## Phase 2 — API Skeleton
_(to be filled as Phase 2 is implemented)_
