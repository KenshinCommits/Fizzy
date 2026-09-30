import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

const adminRoles = ['super_admin', 'admin', 'sales_manager', 'sales_rep'];

router.get('/dashboard', authenticate, authorize(...adminRoles), adminController.getDashboard.bind(adminController));
router.get('/customers', authenticate, authorize(...adminRoles), adminController.getCustomers.bind(adminController));
router.get('/customers/:id', authenticate, authorize(...adminRoles), adminController.getCustomerDetail.bind(adminController));
router.get('/leads', authenticate, authorize(...adminRoles), adminController.getLeads.bind(adminController));
router.get('/leads/:id', authenticate, authorize(...adminRoles), adminController.getLeadDetail.bind(adminController));
router.patch('/leads/:id', authenticate, authorize(...adminRoles), adminController.updateLead.bind(adminController));
router.get('/orders', authenticate, authorize(...adminRoles), adminController.getOrders.bind(adminController));
router.get('/orders/:id', authenticate, authorize(...adminRoles), adminController.getOrderDetail.bind(adminController));
router.patch('/orders/:id/status', authenticate, authorize(...adminRoles), adminController.updateOrderStatus.bind(adminController));
router.get('/agent-analysis/:userId', authenticate, authorize(...adminRoles), adminController.getAgentAnalysis.bind(adminController));
router.get('/scoring/rules', authenticate, authorize(...adminRoles), adminController.getScoringRules.bind(adminController));
router.patch('/scoring/rules', authenticate, authorize('super_admin', 'admin'), adminController.updateScoringRules.bind(adminController));
router.get('/analytics', authenticate, authorize(...adminRoles), adminController.getAnalytics.bind(adminController));
router.get('/abandoned-carts', authenticate, authorize(...adminRoles), adminController.getAbandonedCarts.bind(adminController));
router.get('/score-history', authenticate, authorize(...adminRoles), adminController.getScoreHistory.bind(adminController));
router.get('/salespeople', authenticate, authorize(...adminRoles), adminController.getSalespeople.bind(adminController));
router.get('/settings', authenticate, authorize(...adminRoles), adminController.getSettings.bind(adminController));
router.patch('/settings', authenticate, authorize('super_admin', 'admin'), adminController.updateSettings.bind(adminController));
router.get('/products', authenticate, authorize(...adminRoles), adminController.getAdminProducts.bind(adminController));
router.post('/products', authenticate, authorize('super_admin', 'admin'), adminController.createAdminProduct.bind(adminController));
router.patch('/products/:id', authenticate, authorize('super_admin', 'admin'), adminController.updateAdminProduct.bind(adminController));
router.delete('/products/:id', authenticate, authorize('super_admin', 'admin'), adminController.deleteAdminProduct.bind(adminController));

export default router;
