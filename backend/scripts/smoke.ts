import 'dotenv/config';
import http from 'http';
import { env } from '../src/config/env';
import { logger } from '../src/utils/logger';

const BASE_URL = `http://localhost:${env.PORT}`;

async function get(path: string): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    http.get(`${BASE_URL}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode || 0, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode || 0, body: data });
        }
      });
    }).on('error', reject);
  });
}

async function smoke(): Promise<void> {
  let passed = 0;
  let failed = 0;

  const check = (name: string, condition: boolean, detail?: string): void => {
    if (condition) {
      logger.info({ test: name }, '✅ PASS');
      passed++;
    } else {
      logger.error({ test: name, detail }, '❌ FAIL');
      failed++;
    }
  };

  // Health check
  const health = await get('/health');
  check('GET /health → 200', health.status === 200);
  check('Health response has success:true', (health.body as Record<string, unknown>)?.success === true);
  check('Health data.status is ok', ((health.body as Record<string, unknown>)?.data as Record<string, unknown>)?.status === 'ok');

  // 404
  const notFound = await get('/api/nonexistent');
  check('Unknown route → 404', notFound.status === 404);
  check('404 has success:false', (notFound.body as Record<string, unknown>)?.success === false);

  logger.info({ passed, failed, total: passed + failed }, 'Smoke test complete');
  if (failed > 0) process.exit(1);
}

smoke().catch((err) => {
  logger.error({ err }, 'Smoke test failed — is the server running?');
  process.exit(1);
});
