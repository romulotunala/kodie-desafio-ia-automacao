import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { createApp } from './app.js';
import { ErrorResponseSchema } from './lib/errors.js';

const app = createApp();

describe('GET /health', () => {
  it('responds 200 with status and uptime', async () => {
    const response = await request(app).get('/health');

    const HealthBodySchema = z.strictObject({
      status: z.literal('ok'),
      uptime_s: z.number().int().nonnegative(),
    });

    expect(response.status).toBe(200);
    expect(HealthBodySchema.safeParse(response.body).success).toBe(true);
  });
});

describe('error handling', () => {
  it('responds 404 with the error envelope for unknown routes', async () => {
    const response = await request(app).get('/does-not-exist');

    expect(response.status).toBe(404);
    expect(ErrorResponseSchema.parse(response.body)).toEqual({
      error: { code: 'NOT_FOUND', message: 'Route GET /does-not-exist not found', details: [] },
    });
  });

  it('responds 400 for malformed JSON', async () => {
    const response = await request(app)
      .post('/health')
      .set('Content-Type', 'application/json')
      .send('{"message": ');

    expect(response.status).toBe(400);
    expect(ErrorResponseSchema.parse(response.body).error.code).toBe('VALIDATION_ERROR');
  });

  it('responds 413 when the body exceeds the size limit', async () => {
    const response = await request(app)
      .post('/health')
      .send({ message: 'a'.repeat(40_000) });

    expect(response.status).toBe(413);
    expect(ErrorResponseSchema.parse(response.body).error.code).toBe('PAYLOAD_TOO_LARGE');
  });
});

describe('API docs', () => {
  const OpenApiDocumentSchema = z.object({
    openapi: z.string(),
    paths: z.record(z.string(), z.unknown()),
    components: z.object({ schemas: z.record(z.string(), z.unknown()) }),
  });

  it('serves the OpenAPI document at /docs.json', async () => {
    const response = await request(app).get('/docs.json');
    const document = OpenApiDocumentSchema.parse(response.body);

    expect(response.status).toBe(200);
    expect(document.openapi).toBe('3.1.0');
    expect(document.paths).toHaveProperty('/health');
    expect(document.components.schemas).toHaveProperty('HealthResponse');
  });

  it('serves the Swagger UI at /docs/', async () => {
    const response = await request(app).get('/docs/');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/html/);
  });
});
