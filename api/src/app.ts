import express, { type Express } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';

import { errorHandler, notFoundHandler } from './lib/errors.js';
import { logger } from './lib/logger.js';
import { createDocsRouter } from './routes/docs.route.js';
import { healthRouter } from './routes/health.route.js';

/**
 * Largest accepted JSON body. The biggest field (a 5000-char message) needs at most
 * ~20 KB in UTF-8; the rest is headroom for the other fields.
 */
const JSON_BODY_LIMIT = '32kb';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(pinoHttp({ logger }));
  app.use(express.json({ limit: JSON_BODY_LIMIT }));

  app.use(healthRouter);
  // Docs last among routers: the OpenAPI document is built from what is registered so far.
  app.use(createDocsRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
