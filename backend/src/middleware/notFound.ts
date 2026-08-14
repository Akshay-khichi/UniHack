import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse';

export function notFound(req: Request, res: Response, _next: NextFunction): void {
  sendError(res, 404, 'NOT_FOUND', `Route not found: ${req.method} ${req.url}`);
}
