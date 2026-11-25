import { pino } from 'pino';

import { env } from '../config/env.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  // Never log credentials that may arrive in headers.
  redact: ['req.headers.authorization', 'req.headers.cookie', 'req.headers["x-api-key"]'],
});
