/**
 * Zod-validated environment configuration.
 * Reads process.env, validates, and exports a typed config object.
 * Throws on startup if any required variable is missing/invalid.
 */
import { z } from 'zod';

const envSchema = z.object({
  // Runtime
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
  DEMO_MODE: z.enum(['mock', 'live']).default('mock'),

  // Server
  API_PORT: z.coerce.number().int().positive().default(Number(process.env['PORT']) || 3001),
  API_HOST: z.string().default('0.0.0.0'),
  CORS_ORIGINS: z.string().default('https://web-one-kohl-70.vercel.app,http://localhost:3000'),

  // Rate limiting
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),

  // Session
  SESSION_SECRET: z.string().min(16).default('dev-secret-please-change-in-production'),
  SESSION_MAX_AGE_SECONDS: z.coerce.number().int().positive().default(86_400),
  GUEST_SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(2_592_000),

  // Database
  MONGODB_URI: z.string().url().default('mongodb://localhost:27017/sahaj'),
  MONGODB_DB_NAME: z.string().default('sahaj'),
  MONGODB_TEST_DB_NAME: z.string().default('sahaj_test'),

  // Cache
  REDIS_URL: z.string().url().optional(),

  // LLM
  LLM_ADAPTER: z.enum(['mock', 'groq', 'openai-compatible']).default('mock'),
  GROQ_API_KEY: z.string().optional(),
  GROQ_BASE_URL: z.string().url().default('https://api.groq.com/openai/v1'),
  GROQ_MODEL_PRIMARY: z.string().default('llama-3.3-70b-versatile'),
  GROQ_MODEL_FAST: z.string().default('llama-3.1-8b-instant'),
  GROQ_MODEL_REASONING: z.string().default('qwen-qwq-32b-preview'),
  GROQ_MAX_TOKENS: z.coerce.number().int().positive().default(2048),
  GROQ_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.2),
  LLM_BASE_URL: z.string().url().optional(),
  LLM_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().optional(),
  LLM_FIRST_TOKEN_TIMEOUT_MS: z.coerce.number().int().positive().default(4_000),
  LLM_TOTAL_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),

  // Knowledge / Cognee
  KNOWLEDGE_ADAPTER: z.enum(['mock', 'local-bm25', 'cognee-live']).default('mock'),
  COGNEE_API_KEY: z.string().optional(),
  COGNEE_BASE_URL: z.string().url().default('https://api.cognee.ai'),
  COGNEE_SEARCH_MODE: z.string().default('graph_completion'),
  COGNEE_TOP_K: z.coerce.number().int().positive().default(6),
  COGNEE_RETRIEVAL_TIMEOUT_MS: z.coerce.number().int().positive().default(1_500),
  KNOWLEDGE_CORPUS_VERSION: z.coerce.number().int().positive().default(1),

  // Sarvam
  SARVAM_ADAPTER: z.enum(['mock', 'live']).default('mock'),
  SARVAM_API_KEY: z.string().optional(),
  SARVAM_BASE_URL: z.string().url().default('https://api.sarvam.ai'),
  SARVAM_CHAT_MODEL: z.string().default('sarvam-2b'),
  SARVAM_STT_MODEL: z.string().default('saarika:v2'),
  SARVAM_TTS_MODEL: z.string().default('bulbul:v2'),
  SARVAM_TRANSLATE_MODEL: z.string().default('mayura:v1'),
  SARVAM_TIMEOUT_MS: z.coerce.number().int().positive().default(6_000),

  // Storage
  STORAGE_ADAPTER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_PATH: z.string().default('./uploads'),
  UPLOAD_MAX_SIZE_BYTES: z.coerce.number().int().positive().default(10_485_760),

  // n8n
  N8N_ADAPTER: z.enum(['mock', 'live']).default('mock'),
  N8N_WEBHOOK_URL: z.string().url().optional(),
  N8N_WEBHOOK_SECRET: z.string().optional(),
  N8N_RETRY_MAX: z.coerce.number().int().default(3),
  N8N_RETRY_DELAY_MS: z.coerce.number().int().default(5_000),

  // Paytm connector
  PAYTM_CONNECTOR: z.enum(['mock-paytm', 'paytm-sandbox-stub']).default('mock-paytm'),

  // Feature flags
  FEATURE_VOICE: z.coerce.boolean().default(false),
  FEATURE_3D_THREAD: z.coerce.boolean().default(true),
  FEATURE_DEV_DRILL: z.coerce.boolean().default(true),
  FEATURE_KNOWLEDGE_TRACE: z.coerce.boolean().default(true),
});

export type Config = z.infer<typeof envSchema>;

let _config: Config | null = null;

export function getConfig(): Config {
  if (_config) return _config;
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment configuration:');
    console.error(result.error.format());
    process.exit(1);
  }
  _config = result.data;
  return _config;
}

/** Adapter modes for the health endpoint */
export function getAdapterModes(config: Config) {
  return {
    llm: config.LLM_ADAPTER,
    knowledge: config.KNOWLEDGE_ADAPTER,
    sarvam: config.SARVAM_ADAPTER,
    storage: config.STORAGE_ADAPTER,
    n8n: config.N8N_ADAPTER,
    paytm: config.PAYTM_CONNECTOR,
    demo: config.DEMO_MODE,
  };
}
