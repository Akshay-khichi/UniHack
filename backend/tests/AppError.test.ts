import { AppError } from '../src/utils/AppError';

describe('AppError', () => {
  it('constructs with defaults', () => {
    const err = new AppError('test error');
    expect(err.message).toBe('test error');
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('INTERNAL_ERROR');
    expect(err.isOperational).toBe(true);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });

  it('constructs with custom fields', () => {
    const err = new AppError('custom', 400, 'CUSTOM', { field: 'x' }, false);
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('CUSTOM');
    expect(err.details).toEqual({ field: 'x' });
    expect(err.isOperational).toBe(false);
  });

  it('factory: badRequest', () => {
    const err = AppError.badRequest('bad input');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('BAD_REQUEST');
  });

  it('factory: notFound', () => {
    const err = AppError.notFound('Product');
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Product not found');
  });

  it('factory: conflict', () => {
    const err = AppError.conflict('duplicate');
    expect(err.statusCode).toBe(409);
  });

  it('factory: fileTooLarge', () => {
    const err = AppError.fileTooLarge(50);
    expect(err.statusCode).toBe(413);
    expect(err.message).toContain('50MB');
  });

  it('factory: unsupportedMedia', () => {
    const err = AppError.unsupportedMedia('application/exe');
    expect(err.statusCode).toBe(415);
    expect(err.message).toContain('application/exe');
  });

  it('factory: externalServiceError', () => {
    const err = AppError.externalServiceError('Cloudinary');
    expect(err.statusCode).toBe(502);
    expect(err.message).toContain('Cloudinary');
  });

  it('factory: serviceUnavailable', () => {
    const err = AppError.serviceUnavailable('MongoDB');
    expect(err.statusCode).toBe(503);
    expect(err.message).toContain('MongoDB');
  });

  it('factory: validationError', () => {
    const err = AppError.validationError('invalid field');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
  });
});
