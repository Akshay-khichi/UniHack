import { Response } from 'express';

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  [key: string]: unknown;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: ApiMeta;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  meta?: ApiMeta,
): void {
  const response: ApiResponse<T> = { success: true, data };
  if (meta) response.meta = meta;
  res.status(statusCode).json(response);
}

export function sendCreated<T>(res: Response, data: T, meta?: ApiMeta): void {
  sendSuccess(res, data, 201, meta);
}

export function sendNoContent(res: Response): void {
  res.status(204).send();
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
): void {
  const response: ApiResponse = {
    success: false,
    error: { code, message, ...(details !== undefined && { details }) },
  };
  res.status(statusCode).json(response);
}
