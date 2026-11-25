import type * as GenAI from '@google/genai';
import { ApiError, type GenerateContentParameters } from '@google/genai';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { AppError } from './errors.js';
import { generateStructured } from './gemini.js';

type ModelResponse = Promise<{ text: string | undefined }>;

const generateContent = vi.hoisted(() =>
  vi.fn<(params: GenerateContentParameters) => ModelResponse>(),
);

vi.mock('@google/genai', async (importOriginal) => {
  const actual = await importOriginal<typeof GenAI>();
  return {
    ...actual,
    GoogleGenAI: class {
      models = { generateContent };
    },
  };
});

vi.mock('../config/env.js', () => ({
  env: {
    GEMINI_API_KEY: 'test-key',
    GEMINI_MODEL: 'test-model',
    // Short deadline so the timeout test runs fast.
    GEMINI_TIMEOUT_MS: 50,
    LOG_LEVEL: 'silent',
  },
}));

const Schema = z.object({ label: z.enum(['a', 'b']), score: z.number().min(0).max(1) });
const request = { system: 'system prompt', user: 'user message', schema: Schema };

function reply(value: unknown) {
  return { text: JSON.stringify(value) };
}

/** Simulates a request that never answers: rejects only when the SDK aborts it. */
function hangUntilAborted({ config }: GenerateContentParameters): ModelResponse {
  return new Promise((_resolve, reject) => {
    config?.abortSignal?.addEventListener('abort', () => {
      reject(new Error('aborted'));
    });
  });
}

async function expectAppError(promise: Promise<unknown>, code: AppError['code']) {
  const error: unknown = await promise.catch((caught: unknown) => caught);
  expect(error).toBeInstanceOf(AppError);
  expect(error).toMatchObject({ code });
}

describe('generateStructured', () => {
  beforeEach(() => {
    generateContent.mockReset();
  });

  it('returns validated data with model and latency', async () => {
    generateContent.mockResolvedValueOnce(reply({ label: 'a', score: 0.9 }));

    const result = await generateStructured(request);

    expect(result).toEqual({
      data: { label: 'a', score: 0.9 },
      model: 'test-model',
      latencyMs: expect.any(Number) as number,
    });
  });

  it('sends the system prompt, JSON mime type and JSON Schema to Gemini', async () => {
    generateContent.mockResolvedValueOnce(reply({ label: 'a', score: 0.9 }));

    await generateStructured(request);

    const params = generateContent.mock.calls[0]?.[0];
    expect(params).toMatchObject({
      model: 'test-model',
      contents: 'user message',
      config: {
        systemInstruction: 'system prompt',
        responseMimeType: 'application/json',
        temperature: 0.2,
        responseJsonSchema: { type: 'object', required: ['label', 'score'] },
      },
    });
  });

  it('retries once when the first response is not valid JSON', async () => {
    generateContent
      .mockResolvedValueOnce({ text: 'not json' })
      .mockResolvedValueOnce(reply({ label: 'b', score: 0.5 }));

    const result = await generateStructured(request);

    expect(result.data).toEqual({ label: 'b', score: 0.5 });
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it('retries once when the first response is empty', async () => {
    generateContent
      .mockResolvedValueOnce({ text: undefined })
      .mockResolvedValueOnce(reply({ label: 'a', score: 1 }));

    await expect(generateStructured(request)).resolves.toMatchObject({ data: { label: 'a' } });
  });

  it('fails with AI_INVALID_RESPONSE (502) after two responses outside the schema', async () => {
    generateContent.mockResolvedValue(reply({ label: 'c', score: 2 }));

    await expectAppError(generateStructured(request), 'AI_INVALID_RESPONSE');
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it('fails with AI_UNAVAILABLE (503) on timeout, without retrying', async () => {
    generateContent.mockImplementation(hangUntilAborted);

    await expectAppError(generateStructured(request), 'AI_UNAVAILABLE');
    expect(generateContent).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['quota exceeded (429)', new ApiError({ message: 'quota', status: 429 })],
    ['Gemini server error (503)', new ApiError({ message: 'overloaded', status: 503 })],
    ['network failure', new TypeError('fetch failed')],
  ])('fails with AI_UNAVAILABLE (503) on %s', async (_label, cause) => {
    generateContent.mockRejectedValueOnce(cause);

    await expectAppError(generateStructured(request), 'AI_UNAVAILABLE');
  });

  it('fails with INTERNAL_ERROR (500) when Gemini rejects the request (e.g. bad key)', async () => {
    generateContent.mockRejectedValueOnce(new ApiError({ message: 'bad key', status: 403 }));

    await expectAppError(generateStructured(request), 'INTERNAL_ERROR');
  });
});
