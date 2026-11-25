import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Fake values so config/env.ts validates during tests. Gemini is always mocked.
    env: {
      NODE_ENV: 'test',
      GEMINI_API_KEY: 'test-key',
      GEMINI_MODEL: 'test-model',
      LOG_LEVEL: 'silent',
    },
  },
});
