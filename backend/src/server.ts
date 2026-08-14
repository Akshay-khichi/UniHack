import 'dotenv/config';
import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const app = createApp();
const server = http.createServer(app);

function gracefulShutdown(signal: string): void {
  logger.info({ signal }, 'Shutdown signal received');
  server.close((err) => {
    if (err) {
      logger.error({ err }, 'Error during server close');
      process.exit(1);
    }
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force exit if graceful shutdown takes too long
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000);
}

server.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'SpecTrace backend started');
});

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception — shutting down');
  gracefulShutdown('uncaughtException');
});

export { server };
