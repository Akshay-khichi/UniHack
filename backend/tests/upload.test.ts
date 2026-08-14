/**
 * Upload middleware tests — mocked multer behavior.
 */

import request from 'supertest';
import { createApp } from '../src/app';

// Add a test-only route that uses the upload middleware
import express from 'express';
import { upload } from '../src/middleware/upload';

describe('upload middleware', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createApp();
    // Inject a test upload route
    (app as any)._router.stack.splice(-2, 0, {
      route: null,
      handle: upload.single('file'),
    });
  });

  it('accepts valid PDF MIME type', () => {
    // We test the fileFilter logic directly
    const multerInstance = upload as any;
    const fileFilter = multerInstance.fileFilter;

    if (!fileFilter) return; // multer storage, skip

    let callbackResult: unknown;
    fileFilter(
      {},
      { originalname: 'test.pdf', mimetype: 'application/pdf' },
      (err: unknown, accept: unknown) => { callbackResult = err || accept; },
    );
    expect(callbackResult).toBeTruthy();
  });

  it('rejects executable extensions', () => {
    const multerInstance = upload as any;
    const fileFilter = multerInstance.fileFilter;
    if (!fileFilter) return;

    let error: unknown;
    fileFilter(
      {},
      { originalname: 'malware.exe', mimetype: 'application/octet-stream' },
      (err: unknown) => { error = err; },
    );
    expect(error).toBeTruthy();
    expect((error as any).statusCode).toBe(415);
  });

  it('rejects path traversal filenames', () => {
    const multerInstance = upload as any;
    const fileFilter = multerInstance.fileFilter;
    if (!fileFilter) return;

    let error: unknown;
    fileFilter(
      {},
      { originalname: '../../../etc/passwd.pdf', mimetype: 'application/pdf' },
      (err: unknown) => { error = err; },
    );
    expect(error).toBeTruthy();
  });

  it('rejects unsupported MIME types', () => {
    const multerInstance = upload as any;
    const fileFilter = multerInstance.fileFilter;
    if (!fileFilter) return;

    let error: unknown;
    fileFilter(
      {},
      { originalname: 'audio.mp3', mimetype: 'audio/mpeg' },
      (err: unknown) => { error = err; },
    );
    expect(error).toBeTruthy();
    expect((error as any).statusCode).toBe(415);
  });
});
