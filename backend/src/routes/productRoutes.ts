import { Router } from 'express';
import { productController } from '../controllers/productController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', productController.getProducts.bind(productController));
router.get('/:id', productController.getProduct.bind(productController));
router.post('/', authenticate, authorize('admin', 'super_admin'), productController.createProduct.bind(productController));
router.patch('/:id', authenticate, authorize('admin', 'super_admin'), productController.updateProduct.bind(productController));
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), productController.deleteProduct.bind(productController));

export default router;
