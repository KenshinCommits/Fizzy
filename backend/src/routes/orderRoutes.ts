import { Router } from 'express';
import { orderController } from '../controllers/orderController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, orderController.createOrder.bind(orderController));
router.get('/', authenticate, orderController.getUserOrders.bind(orderController));
router.get('/:id', authenticate, orderController.getOrder.bind(orderController));

export default router;
