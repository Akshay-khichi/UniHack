import { Router } from 'express';
import {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController';

const router = Router();

router.post('/', createProduct);
router.get('/', listProducts);
router.get('/:id', getProduct);
router.patch('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;
