import { buildEnvelope } from '../../lib/envelope.js';
import { generateStructured } from '../../lib/gemini.js';
import { SYSTEM_PROMPT, buildUserPrompt } from './classify.prompt.js';
import {
  ClassificationSchema,
  type ClassifyInput,
  type ClassifyResponse,
} from './classify.schema.js';

export async function classifyMessage(input: ClassifyInput): Promise<ClassifyResponse> {
  const { data, model, latencyMs } = await generateStructured({
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(input),
    schema: ClassificationSchema,
  });

  return buildEnvelope({ input, result: data, model, latencyMs });
}
