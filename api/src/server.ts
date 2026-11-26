import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';

const SHUTDOWN_SIGNALS = ['SIGTERM', 'SIGINT'] as const;

const server = createApp().listen(env.PORT, (error) => {
  if (error) {
    logger.fatal({ err: error }, 'Failed to start server');
    process.exitCode = 1;
    return;
  }

  logger.info(`API listening on port ${String(env.PORT)} (docs at /docs)`);
});

// Graceful shutdown: Docker sends SIGTERM on `docker compose down`.
for (const signal of SHUTDOWN_SIGNALS) {
  process.once(signal, () => {
    logger.info(`${signal} received, closing server`);
    server.close((error) => {
      if (error) {
        logger.error({ err: error }, 'Error while closing server');
        process.exitCode = 1;
      }
    });
  });
}
