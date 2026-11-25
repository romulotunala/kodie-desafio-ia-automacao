import { Router } from 'express';

import { API_PREFIX, errorResponses, registry } from '../../lib/openapi.js';
import { validate } from '../../middlewares/validate.js';
import { ClassifyInputSchema, ClassifyResponseSchema } from './classify.schema.js';
import { classifyMessage } from './classify.service.js';

const PATH = '/classify';

registry.registerPath({
  method: 'post',
  path: `${API_PREFIX}${PATH}`,
  tags: ['4.1 Classificação'],
  summary: 'Classifica uma mensagem de cliente',
  description:
    'Identifica categoria, setor responsável, urgência e sentimento, e gera resumo, palavras-chave e justificativa em português.',
  request: {
    body: { content: { 'application/json': { schema: ClassifyInputSchema } } },
  },
  responses: {
    200: {
      description: 'Mensagem classificada',
      content: { 'application/json': { schema: ClassifyResponseSchema } },
    },
    ...errorResponses([
      'VALIDATION_ERROR',
      'PAYLOAD_TOO_LARGE',
      'INTERNAL_ERROR',
      'AI_INVALID_RESPONSE',
      'AI_UNAVAILABLE',
    ]),
  },
});

export const classifyRouter = Router();

classifyRouter.post(PATH, validate(ClassifyInputSchema), async (req, res) => {
  res.json(await classifyMessage(req.body));
});
