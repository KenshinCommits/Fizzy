import { Router } from 'express';
import { eventController } from '../controllers/eventController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, eventController.createEvent.bind(eventController));
router.get('/', authenticate, eventController.getEvents.bind(eventController));

export default router;
