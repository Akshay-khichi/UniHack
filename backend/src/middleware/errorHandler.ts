import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { sendError } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Request validation failed', err.errors);
    return;
  }

  // Our operational errors
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error({ err, req: { method: req.method, url: req.url } }, 'Non-operational error');
    }
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  // Multer errors
  if (err.name === 'MulterError') {
    const multerErr = err as Error & { code?: string };
    if (multerErr.code === 'LIMIT_FILE_SIZE') {
      sendError(res, 413, 'FILE_TOO_LARGE', 'File exceeds maximum allowed size');
      return;
    }
    sendError(res, 400, 'UPLOAD_ERROR', err.message);
    return;
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    sendError(res, 400, 'VALIDATION_ERROR', err.message);
    return;
  }

  // Mongoose cast errors (invalid ObjectId etc.)
  if (err.name === 'CastError') {
    sendError(res, 400, 'INVALID_ID', 'Invalid resource identifier');
    return;
  }

  // Unknown errors : log full details, return minimal info
  logger.error({ err, req: { method: req.method, url: req.url } }, 'Unhandled error');

  const isProd = process.env.NODE_ENV === 'production';
  sendError(
    res,
    500,
    'INTERNAL_ERROR',
    isProd ? 'An unexpected error occurred' : err.message,
  );
}
