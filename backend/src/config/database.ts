import mongoose, { Connection } from 'mongoose';
import { logger } from '../utils/logger';

let connection: Connection | null = null;

const MAX_RETRIES = 5;
const INITIAL_DELAY_MS = 1000;

export async function connectDatabase(uri: string): Promise<void> {
  if (!uri) {
    throw new Error('MONGODB_URI is not set — cannot connect to database');
  }

  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      connection = mongoose.connection;
      logger.info({ host: connection.host, name: connection.name, attempt }, 'MongoDB connected');
      return;
    } catch (err) {
      lastError = err as Error;
      const delay = INITIAL_DELAY_MS * Math.pow(2, attempt - 1);
      logger.warn(
        { attempt, maxRetries: MAX_RETRIES, delayMs: delay, error: lastError.message },
        'MongoDB connection attempt failed — retrying with exponential backoff',
      );
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  logger.error({ err: lastError, attempts: MAX_RETRIES }, 'MongoDB connection failed after max retries');
  throw lastError;
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  }
}

export function getConnection(): Connection | null {
  return connection;
}

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error({ err }, 'MongoDB error');
});
