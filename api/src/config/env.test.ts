import { describe, expect, it } from 'vitest';

import { EnvValidationError, parseEnv } from './env.js';

const validEnv = {
  GEMINI_API_KEY: 'key',
  GEMINI_MODEL: 'model',
};

describe('parseEnv', () => {
  it('applies defaults for optional variables', () => {
    expect(parseEnv(validEnv)).toEqual({
      NODE_ENV: 'development',
      PORT: 3000,
      GEMINI_API_KEY: 'key',
      GEMINI_MODEL: 'model',
      GEMINI_TIMEOUT_MS: 20_000,
      LOG_LEVEL: 'info',
    });
  });

  it('coerces numeric variables from strings', () => {
    const env = parseEnv({ ...validEnv, PORT: '8080', GEMINI_TIMEOUT_MS: '5000' });

    expect(env.PORT).toBe(8080);
    expect(env.GEMINI_TIMEOUT_MS).toBe(5000);
  });

  it('fails with a clear message when GEMINI_API_KEY is missing', () => {
    expect(() => parseEnv({ GEMINI_MODEL: 'model' })).toThrow(EnvValidationError);
    expect(() => parseEnv({ GEMINI_MODEL: 'model' })).toThrow(/GEMINI_API_KEY is required/);
  });

  it('rejects a blank GEMINI_API_KEY', () => {
    expect(() => parseEnv({ ...validEnv, GEMINI_API_KEY: '   ' })).toThrow(/must not be empty/);
  });

  it('rejects an invalid PORT', () => {
    expect(() => parseEnv({ ...validEnv, PORT: 'abc' })).toThrow(/PORT/);
  });

  it('returns a frozen object', () => {
    expect(Object.isFrozen(parseEnv(validEnv))).toBe(true);
  });
});
