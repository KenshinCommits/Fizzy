import { Router } from 'express';
import { cartController } from '../controllers/cartController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All cart routes require authentication — no guest carts
router.use(authenticate);

router.get('/', cartController.getCart.bind(cartController));
router.post('/items', cartController.addItem.bind(cartController));
router.patch('/items/:productId', cartController.updateItem.bind(cartController));
router.delete('/items/:productId', cartController.removeItem.bind(cartController));
router.delete('/', cartController.clearCart.bind(cartController));

export default router;
