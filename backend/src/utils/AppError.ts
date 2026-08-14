export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: unknown,
    isOperational: boolean = true,
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(message, 400, 'BAD_REQUEST', details);
  }

  static notFound(resource: string = 'Resource'): AppError {
    return new AppError(`${resource} not found`, 404, 'NOT_FOUND');
  }

  static conflict(message: string, details?: unknown): AppError {
    return new AppError(message, 409, 'CONFLICT', details);
  }

  static fileTooLarge(maxMb: number): AppError {
    return new AppError(`File exceeds maximum size of ${maxMb}MB`, 413, 'FILE_TOO_LARGE');
  }

  static unsupportedMedia(mimeType?: string): AppError {
    return new AppError(
      `Unsupported media type${mimeType ? `: ${mimeType}` : ''}`,
      415,
      'UNSUPPORTED_MEDIA_TYPE',
    );
  }

  static externalServiceError(service: string, details?: unknown): AppError {
    return new AppError(`External service error: ${service}`, 502, 'EXTERNAL_SERVICE_ERROR', details);
  }

  static serviceUnavailable(dependency: string): AppError {
    return new AppError(`Service unavailable: ${dependency}`, 503, 'SERVICE_UNAVAILABLE');
  }

  static validationError(message: string, details?: unknown): AppError {
    return new AppError(message, 400, 'VALIDATION_ERROR', details);
  }
}
