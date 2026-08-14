import { Router } from 'express';
import { exportProduct } from '../controllers/exportController';

const router = Router({ mergeParams: true });

router.get('/:id/export', exportProduct);

export default router;
