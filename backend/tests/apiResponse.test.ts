import { createResponse } from 'node-mocks-http';
import { sendSuccess, sendCreated, sendError, sendNoContent } from '../src/utils/apiResponse';

describe('apiResponse helpers', () => {
  it('sendSuccess sets correct status and shape', () => {
    const res = createResponse();
    sendSuccess(res as any, { id: 1 });
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.success).toBe(true);
    expect(data.data).toEqual({ id: 1 });
  });

  it('sendSuccess supports custom statusCode and meta', () => {
    const res = createResponse();
    sendSuccess(res as any, [], 200, { page: 1, total: 0 });
    const data = res._getJSONData();
    expect(data.meta.page).toBe(1);
  });

  it('sendCreated sets 201', () => {
    const res = createResponse();
    sendCreated(res as any, { id: 2 });
    expect(res.statusCode).toBe(201);
    expect(res._getJSONData().success).toBe(true);
  });

  it('sendNoContent sets 204', () => {
    const res = createResponse();
    sendNoContent(res as any);
    expect(res.statusCode).toBe(204);
  });

  it('sendError sets correct error shape', () => {
    const res = createResponse();
    sendError(res as any, 404, 'NOT_FOUND', 'Missing', { id: 'x' });
    expect(res.statusCode).toBe(404);
    const data = res._getJSONData();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('NOT_FOUND');
    expect(data.error.message).toBe('Missing');
    expect(data.error.details).toEqual({ id: 'x' });
  });
});
