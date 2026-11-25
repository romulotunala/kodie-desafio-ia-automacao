import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';

import { buildOpenApiDocument } from '../lib/openapi.js';

/**
 * Must be called after every route module has been imported,
 * otherwise their paths are missing from the generated document.
 */
export function createDocsRouter(): Router {
  const document = buildOpenApiDocument();
  const router = Router();

  router.get('/docs.json', (_req, res) => {
    res.json(document);
  });
  router.use('/docs', swaggerUi.serve, swaggerUi.setup(document));

  return router;
}
