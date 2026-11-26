import { z } from 'zod';

const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  GEMINI_API_KEY: z
    .string({ error: 'GEMINI_API_KEY is required. Copy .env.example to .env and set your key.' })
    .trim()
    .min(1, 'GEMINI_API_KEY must not be empty.'),
  GEMINI_MODEL: z
    .string({ error: 'GEMINI_MODEL is required (e.g. the model name from Google AI Studio).' })
    .trim()
    .min(1, 'GEMINI_MODEL must not be empty.'),
  GEMINI_TIMEOUT_MS: z.coerce.number().int().positive().default(20_000),
  LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),
});

export type Env = Readonly<z.infer<typeof EnvSchema>>;

export class EnvValidationError extends Error {
  override readonly name = 'EnvValidationError';
}

/**
 * Parses and validates environment variables. Exported separately from `env`
 * so it can be tested without touching `process.env`.
 */
export function parseEnv(source: NodeJS.ProcessEnv): Env {
  const result = EnvSchema.safeParse(source);

  if (!result.success) {
    throw new EnvValidationError(
      `Invalid environment variables:\n${z.prettifyError(result.error)}`,
    );
  }

  return Object.freeze(result.data);
}

// Fails fast at import time: the process won't start with an invalid config.
export const env: Env = parseEnv(process.env);
