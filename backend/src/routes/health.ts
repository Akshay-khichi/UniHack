import { Router, Request, Response } from 'express';
import { sendSuccess } from '../utils/apiResponse';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  sendSuccess(res, {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

export default router;
