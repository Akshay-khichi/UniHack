import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

// ── Allowed types ─────────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'text/csv',
  'application/json',
  'application/vnd.ms-excel',
]);

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.csv', '.json']);

const DANGEROUS_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.ps1', '.msi', '.dll', '.com', '.scr',
  '.vbs', '.js', '.ts', '.py', '.rb', '.php', '.asp', '.aspx', '.jsp',
]);

// ── Safety check ──────────────────────────────────────────────────────────────

function isSafeFilename(filename: string): boolean {
  // Reject path traversal attempts
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return false;
  }
  // Only alphanumeric, spaces, dots, dashes, underscores
  if (!/^[a-zA-Z0-9 ._-]+$/.test(filename)) {
    return false;
  }
  return true;
}

// ── Multer config ─────────────────────────────────────────────────────────────

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype.toLowerCase();

    // Reject dangerous extensions
    if (DANGEROUS_EXTENSIONS.has(ext)) {
      return cb(AppError.unsupportedMedia(ext));
    }

    // Reject unsafe filenames
    if (!isSafeFilename(file.originalname)) {
      return cb(AppError.badRequest('Unsafe filename. Use only alphanumeric characters, spaces, dots, dashes, and underscores.'));
    }

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.has(mime)) {
      return cb(AppError.unsupportedMedia(mime));
    }

    // Check extension
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(AppError.unsupportedMedia(ext));
    }

    cb(null, true);
  },
});

export { ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS };
