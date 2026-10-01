import { Router } from 'express';
import axios from 'axios';
import { config } from '../config/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
// Public endpoint – no auth required so storefront visitors can start a voice call
router.post('/v3/create-web-call', authenticate, async (req: any, res, next) => {
  try {
    if (!config.retell.apiKey || !config.retell.agentId) return res.status(503).json({ error: 'Fulky voice is not configured.' });
    const response = await axios.post('https://api.retellai.com/v3/create-web-call', { agent_id: config.retell.agentId, retell_llm_dynamic_variables: { user_id: req.user._id.toString(), customer_name: `${req.user.firstName} ${req.user.lastName}` } }, { headers: { Authorization: `Bearer ${config.retell.apiKey}`, 'Content-Type': 'application/json' } });
    res.status(response.status).json(response.data);
  } catch (error) { next(error); }
});
export default router;
