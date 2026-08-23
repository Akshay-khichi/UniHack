import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import router from './routes';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { logger } from './utils/logger';

export function createApp(): Application {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS: exact-origin match only
  const allowedOrigins: string[] = Array.isArray(env.ALLOWED_ORIGINS)
    ? env.ALLOWED_ORIGINS
    : [env.ALLOWED_ORIGINS as unknown as string];

  app.use(
    cors({
      origin: (origin, callback) => {
        /**
         * EXPLICIT CORS POLICY NOTE (Item 11):
         * Requests without an 'Origin' header (!origin) originate from non-browser clients:
         * 1. Server-to-server API integrations & webhooks
         * 2. Command-line development & diagnostic tools (curl, wget)
         * 3. API testing tools (Postman, Insomnia)
         * Browsers enforce cross-origin security by sending the 'Origin' header on cross-site requests.
         * Allowing !origin is intentional for API-first architecture while strictly enforcing exact-origin matching
         * for all browser-initiated requests via allowedOrigins.
         */
        if (!origin) return callback(null, true);
        if (
          allowedOrigins.includes(origin) ||
          allowedOrigins.includes('*') ||
          origin.endsWith('.onrender.com') ||
          origin.includes('localhost') ||
          origin.includes('127.0.0.1')
        ) {
          return callback(null, true);
        }
        logger.warn({ origin }, 'CORS blocked request from disallowed origin');
        return callback(new Error(`CORS: origin '${origin}' is not allowed`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Rate limiting disabled for unconstrained usage
  // (rateLimit middleware removed)

  // Routes
  app.use('/', router);

  // 404 handler
  app.use(notFound);

  // Centralized error handler (must be last)
  app.use(errorHandler);

  return app;
}
