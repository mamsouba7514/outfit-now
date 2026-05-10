import crypto from 'node:crypto';

import { z } from 'zod';

const envSchema = z.object({
  // Runtime
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),

  // Database — required
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  // Auth — required; JWT_SECRET must be ≥32 chars in production
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // Auth social providers — optional (app degrades gracefully without them)
  APPLE_CLIENT_ID: z.string().optional(),
  APPLE_TEAM_ID: z.string().optional(),
  APPLE_KEY_ID: z.string().optional(),
  APPLE_PRIVATE_KEY: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),

  // Storage (S3 / MinIO) — required
  S3_ENDPOINT: z.string().url(),
  S3_BUCKET: z.string(),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
  S3_REGION: z.string().default('eu-west-3'),

  // AI — optional; features degrade if missing
  ANTHROPIC_API_KEY: z.string().optional(),
  KARL_AGENT_ID: z.string().optional(), // Managed Agent ID — set after running scripts/karl-setup.ts
  KARL_ENVIRONMENT_ID: z.string().optional(), // Managed Environment ID — same
  FAL_KEY: z.string().optional(), // PuLID-Flux mannequin IA via fal.ai
  REPLICATE_API_TOKEN: z.string().optional(), // Replicate fallback for vision
  OPENAI_API_KEY: z.string().optional(), // gpt-image-1 mannequin generation

  // Search — optional; at least one recommended in production
  SERPAPI_KEY: z.string().optional(),
  SERPER_API_KEY: z.string().optional(),

  // Vector DB — optional; required for semantic search
  PINECONE_API_KEY: z.string().optional(),
  PINECONE_INDEX: z.string().optional(),

  // Payments
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_PREMIUM_MONTHLY: z.string().optional(),
  STRIPE_PREMIUM_PRICE_ID: z.string().optional(),
  REVENUECAT_WEBHOOK_SECRET: z.string().optional(),

  // Push notifications — optional; higher rate limits with token
  EXPO_ACCESS_TOKEN: z.string().optional(),

  // Monitoring
  DATADOG_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  POSTHOG_API_KEY: z.string().optional(),

  // CORS — production: comma-separated list of allowed origins
  ALLOWED_ORIGINS: z.string().optional(),

  // Dashboard — required in production; test/dev get a safe local fallback.
  DASHBOARD_SECRET: z.string().min(32).optional(),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten().fieldErrors);
    process.exit(1);
  }
  const data = result.data;
  if (data.NODE_ENV === 'production') {
    const missing: Record<string, string[]> = {};
    if (!data.DASHBOARD_SECRET) missing['DASHBOARD_SECRET'] = ['Required in production'];
    if (!data.ALLOWED_ORIGINS) missing['ALLOWED_ORIGINS'] = ['Required in production'];
    if (Object.keys(missing).length > 0) {
      console.error('Invalid environment variables:', missing);
      process.exit(1);
    }
  }
  // In test use a fixed known secret so tests can authenticate.
  // In dev generate a random secret per process — dashboard auth works but
  // attackers cannot guess the secret even if they know the fallback pattern.
  const dashboardSecret =
    data.DASHBOARD_SECRET ??
    (data.NODE_ENV === 'test'
      ? 'test-dashboard-secret-at-least-32-chars'
      : crypto.randomBytes(32).toString('hex'));
  return { ...data, DASHBOARD_SECRET: dashboardSecret };
}

export const env = loadEnv();
