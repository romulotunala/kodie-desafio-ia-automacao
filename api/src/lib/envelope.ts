import { randomUUID } from 'node:crypto';

import { z } from 'zod';

/** Builds the Zod schema of the success envelope shared by every case. */
export function envelopeSchema<TInput extends z.ZodType, TResult extends z.ZodType>(
  input: TInput,
  result: TResult,
) {
  return z.object({
    id: z.uuid().meta({ description: 'Identificador único do processamento' }),
    processed_at: z.iso
      .datetime()
      .meta({ description: 'Data/hora do processamento (ISO 8601, UTC)' }),
    // Echo of the validated input (defaults applied). Not wrapped in `.meta()`: that would
    // clone the schema and drop its component id.
    input,
    result,
    meta: z.object({
      model: z
        .string()
        .meta({ description: 'Modelo do Gemini usado', example: 'gemini-3.5-flash-lite' }),
      latency_ms: z
        .number()
        .int()
        .nonnegative()
        .meta({ description: 'Tempo de resposta da IA', example: 850 }),
    }),
  });
}

interface EnvelopeData<TInput, TResult> {
  input: TInput;
  result: TResult;
  model: string;
  latencyMs: number;
}

export function buildEnvelope<TInput, TResult>({
  input,
  result,
  model,
  latencyMs,
}: EnvelopeData<TInput, TResult>) {
  return {
    id: randomUUID(),
    processed_at: new Date().toISOString(),
    input,
    result,
    meta: { model, latency_ms: latencyMs },
  };
}
