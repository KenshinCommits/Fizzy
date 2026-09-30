import { Router } from 'express';
import axios from 'axios';
import { authenticate } from '../middleware/auth.js';
import { config } from '../config/index.js';

const router = Router();
router.post('/v3/create-web-call', authenticate, async (_req, res, next) => {
  try {
    if (!config.retell.apiKey || !config.retell.agentId) return res.status(503).json({ error: 'Fulky voice is not configured.' });
    const response = await axios.post('https://api.retellai.com/v3/create-web-call', { agent_id: config.retell.agentId }, { headers: { Authorization: `Bearer ${config.retell.apiKey}`, 'Content-Type': 'application/json' } });
    res.status(response.status).json(response.data);
  } catch (error) { next(error); }
});
export default router;
