import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('GET /health', () => {
  it('returns 200 with correct shape', async () => {
    const res = await request(app).get('/health').expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.status).toBe('ok');
    expect(typeof res.body.data.uptime).toBe('number');
    expect(res.body.data.uptime).toBeGreaterThanOrEqual(0);
    expect(res.body.data.timestamp).toBeDefined();
    expect(new Date(res.body.data.timestamp).getTime()).not.toBeNaN();
  });

  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/nonexistent-route').expect(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
