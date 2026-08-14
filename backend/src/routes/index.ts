import { Router } from 'express';
import healthRouter from './health';
import productsRouter from './products';
import documentsRouter from './documents';
import reviewRouter from './reviews';
import exportRouter from './export';
import evidenceRouter from './evidence';
import unilogRouter from './unilog';

const router = Router();

router.use('/health', healthRouter);
router.use('/api/products', productsRouter);
router.use('/api/products', documentsRouter);
router.use('/api/products', reviewRouter);
router.use('/api/products', exportRouter);
router.use('/api/products', evidenceRouter);
router.use('/api/unilog', unilogRouter);

export default router;

