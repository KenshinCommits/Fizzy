import { Router } from 'express';
import { cartController } from '../controllers/cartController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', cartController.getCart.bind(cartController));
router.put('/', cartController.updateCart.bind(cartController));
router.delete('/', authenticate, cartController.clearCart.bind(cartController));
router.post('/abandon', cartController.abandonCart.bind(cartController));

export default router;
