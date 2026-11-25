import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { ErrorResponseSchema, errorHandler } from '../lib/errors.js';
import { validate } from './validate.js';

const Schema = z.object({
  name: z.string().min(2),
  channel: z.enum(['email', 'other']).default('other'),
});

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.post('/echo', validate(Schema), (req, res) => {
    // req.body is typed as z.output<typeof Schema> here.
    res.json({ name: req.body.name, channel: req.body.channel });
  });
  app.use(errorHandler);
  return app;
}

describe('validate middleware', () => {
  const app = createTestApp();

  it('passes the parsed body (with defaults, without unknown keys) to the handler', async () => {
    const response = await request(app).post('/echo').send({ name: 'Ana', extra: true });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ name: 'Ana', channel: 'other' });
  });

  it('responds 400 with one detail per invalid field', async () => {
    const response = await request(app).post('/echo').send({ name: 'A', channel: 'fax' });

    const { error } = ErrorResponseSchema.parse(response.body);

    expect(response.status).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.details.map((detail) => detail.field)).toEqual(['name', 'channel']);
  });

  it('reports a missing body at the root', async () => {
    const response = await request(app).post('/echo');
    const { error } = ErrorResponseSchema.parse(response.body);

    expect(response.status).toBe(400);
    expect(error.details[0]?.field).toBe('(body)');
  });
});
