import { ApiError, GoogleGenAI } from '@google/genai';
import { z } from 'zod';

import { env } from '../config/env.js';
import { AppError } from './errors.js';
import { logger } from './logger.js';

/** First call + 1 retry when the model returns JSON outside the schema. */
const MAX_ATTEMPTS = 2;
const DEFAULT_TEMPERATURE = 0.2;
const JSON_MIME_TYPE = 'application/json';
const HTTP_TOO_MANY_REQUESTS = 429;
const HTTP_SERVER_ERROR = 500;

const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

export interface StructuredRequest<TSchema extends z.ZodType> {
  /** System instruction: role, rules and output format. */
  system: string;
  /** The user content to interpret. */
  user: string;
  /** Expected output. Sent to Gemini as JSON Schema and re-validated with Zod. */
  schema: TSchema;
  temperature?: number;
}

export interface StructuredResult<T> {
  data: T;
  model: string;
  latencyMs: number;
}

type ParseOutcome<T> = { success: true; data: T } | { success: false; reason: string };

/**
 * Asks Gemini for a JSON response that matches `schema`.
 *
 * - Invalid output (empty, not JSON or outside the schema) is retried once, then 502.
 * - Timeout, network failure, quota or Gemini 5xx → 503. Other API errors
 *   (bad key, unknown model) are misconfiguration → 500.
 * - `GEMINI_TIMEOUT_MS` is a deadline for the whole operation, retries included,
 *   so callers (n8n) have a predictable upper bound.
 */
export async function generateStructured<TSchema extends z.ZodType>({
  system,
  user,
  schema,
  temperature = DEFAULT_TEMPERATURE,
}: StructuredRequest<TSchema>): Promise<StructuredResult<z.output<TSchema>>> {
  const startedAt = performance.now();
  const abortSignal = AbortSignal.timeout(env.GEMINI_TIMEOUT_MS);
  const responseJsonSchema = z.toJSONSchema(schema, { io: 'output' });

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const text = await callModel({ system, user, temperature, responseJsonSchema, abortSignal });
    const outcome = parseResponse(text, schema);

    if (outcome.success) {
      return {
        data: outcome.data,
        model: env.GEMINI_MODEL,
        latencyMs: Math.round(performance.now() - startedAt),
      };
    }

    // Only the reason is logged: the raw output may contain customer data.
    logger.warn({ attempt, reason: outcome.reason }, 'Gemini returned an invalid response');
  }

  throw new AppError('AI_INVALID_RESPONSE', 'AI returned a response outside the expected format');
}

interface ModelCall {
  system: string;
  user: string;
  temperature: number;
  responseJsonSchema: unknown;
  abortSignal: AbortSignal;
}

async function callModel(call: ModelCall): Promise<string | undefined> {
  try {
    const response = await client.models.generateContent({
      model: env.GEMINI_MODEL,
      contents: call.user,
      config: {
        systemInstruction: call.system,
        temperature: call.temperature,
        responseMimeType: JSON_MIME_TYPE,
        responseJsonSchema: call.responseJsonSchema,
        abortSignal: call.abortSignal,
      },
    });
    return response.text;
  } catch (error) {
    throw toProviderError(error, call.abortSignal);
  }
}

function toProviderError(error: unknown, abortSignal: AbortSignal): AppError {
  if (abortSignal.aborted) {
    return new AppError('AI_UNAVAILABLE', 'AI request timed out', { cause: error });
  }

  const isMisconfiguration =
    error instanceof ApiError &&
    error.status !== HTTP_TOO_MANY_REQUESTS &&
    error.status < HTTP_SERVER_ERROR;

  if (isMisconfiguration) {
    return new AppError('INTERNAL_ERROR', 'AI provider rejected the request', { cause: error });
  }

  return new AppError('AI_UNAVAILABLE', 'AI service is unavailable', { cause: error });
}

function parseResponse<TSchema extends z.ZodType>(
  text: string | undefined,
  schema: TSchema,
): ParseOutcome<z.output<TSchema>> {
  if (!text) {
    return { success: false, reason: 'empty response' };
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { success: false, reason: 'response is not valid JSON' };
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    const paths = result.error.issues.map((issue) => issue.path.join('.') || '(root)');
    return { success: false, reason: `schema mismatch at: ${paths.join(', ')}` };
  }

  return { success: true, data: result.data };
}
