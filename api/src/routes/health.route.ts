import { Router } from 'express';
import { z } from 'zod';

import { registry } from '../lib/openapi.js';

const HealthResponseSchema = z
  .object({
    status: z.literal('ok'),
    uptime_s: z.number().int().nonnegative().meta({ example: 12 }),
  })
  .meta({ id: 'HealthResponse' });

type HealthResponse = z.infer<typeof HealthResponseSchema>;

registry.registerPath({
  method: 'get',
  path: '/health',
  tags: ['Infra'],
  summary: 'Verifica se a API está no ar',
  responses: {
    200: {
      description: 'API saudável',
      content: { 'application/json': { schema: HealthResponseSchema } },
    },
  },
});

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  const body: HealthResponse = { status: 'ok', uptime_s: Math.floor(process.uptime()) };
  res.json(body);
});
