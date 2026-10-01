import { Router } from 'express';
import { retellWebhookController } from '../webhooks/retellWebhook.js';

const router = Router();

router.post('/retell', retellWebhookController.handleWebhook.bind(retellWebhookController));

export default router;
