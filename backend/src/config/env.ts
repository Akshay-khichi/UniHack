import { cleanEnv, str, port, num, makeValidator } from 'envalid';

const commaSeparatedStr = makeValidator<string[]>((input: string) => {
  if (!input || input.trim() === '') return [];
  return input.split(',').map((s) => s.trim()).filter(Boolean);
});

export const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'production', 'test'], default: 'development' }),
  PORT: port({ default: 3000 }),
  MONGODB_URI: str({ default: '' }),
  CLOUDINARY_CLOUD_NAME: str({ default: '' }),
  CLOUDINARY_API_KEY: str({ default: '' }),
  CLOUDINARY_API_SECRET: str({ default: '' }),
  GEMINI_API_KEY: str({ default: '' }),
  ALLOWED_ORIGINS: commaSeparatedStr({ default: process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5173' } as any),
  MAX_FILE_SIZE_MB: num({ default: 50 }),
  RATE_LIMIT_WINDOW_MS: num({ default: 900000 }),
  RATE_LIMIT_MAX: num({ default: 100 }),
});

// Item 9: Fail startup in production if ALLOWED_ORIGINS is not set or defaults to localhost
if (env.NODE_ENV === 'production') {
  const origins = Array.isArray(env.ALLOWED_ORIGINS) ? env.ALLOWED_ORIGINS : [env.ALLOWED_ORIGINS];
  if (origins.length === 0 || origins.some((o) => typeof o === 'string' && (o.includes('localhost') || o.includes('127.0.0.1')))) {
    throw new Error('FATAL: CORS ALLOWED_ORIGINS must be explicitly configured in production environment without localhost fallbacks.');
  }
}

export type Env = typeof env;
