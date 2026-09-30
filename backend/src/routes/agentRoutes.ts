import { Router } from 'express';
import { agentController } from '../controllers/agentController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/context/:userId', authenticate, agentController.getAgentContext.bind(agentController));
router.post('/call', authenticate, authorize('admin', 'super_admin', 'sales_manager', 'sales_rep'), agentController.initiateCall.bind(agentController));
router.get('/conversations', authenticate, agentController.getConversations.bind(agentController));
router.get('/conversations/:id', authenticate, agentController.getConversation.bind(agentController));

export default router;
