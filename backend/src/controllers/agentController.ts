import { Request, Response } from 'express';
import { User } from '../models/User.js';
import { Lead } from '../models/Lead.js';
import { Order } from '../models/Order.js';
import { Cart } from '../models/Cart.js';
import { Conversation } from '../models/Conversation.js';
import { ScoreHistory } from '../models/ScoreHistory.js';
import { AgentAction } from '../models/AgentAction.js';
import { Event } from '../models/Event.js';
import { Product } from '../models/Product.js';
import { logger } from '../config/logger.js';
import { Types } from 'mongoose';
import { behaviorService } from '../services/behaviorService.js';
import { retellService } from '../integrations/retell/retellService.js';

export class AgentController {
  async getAgentContext(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const lead = await Lead.findOne({ userId });
      const behavior = await behaviorService.calculateBehavior(new Types.ObjectId(userId));
      
      // Get cart
      const cart = await Cart.findOne({ userId, abandoned: false })
        .populate('items.product', 'name price');

      // Get last order
      const lastOrder = await Order.findOne({ userId })
        .sort({ createdAt: -1 })
        .limit(1);

      // Get current product interest
      let currentProduct = null;
      let currentProductName = 'None';
      if (lead?.currentProduct) {
        currentProduct = await Product.findById(lead.currentProduct);
        currentProductName = currentProduct?.name || 'None';
      }

      // Build cart summary
      const cartItems = cart?.items.map((item: any) => 
        `${item.product.name} x${item.quantity}`
      ).join(', ') || 'Empty';
      const cartValue = cart?.subtotal || 0;

      // Build last order summary
      const lastOrderItems = lastOrder?.items.map(item => item.productName).join(', ') || 'None';

      // Build dynamic context
      const context = {
        user_id: userId,
        customer_name: user.firstName,
        customer_type: user.customerType,
        company_name: user.companyName || '',
        
        // Behavior
        visit_count: behavior.visitCount.toString(),
        total_time_seconds: behavior.totalTimeSpent.toString(),
        average_session_seconds: behavior.averageSessionDuration.toString(),
        
        // Product interest
        current_product: currentProductName,
        product_view_count: lead?.productViewCount.toString() || '0',
        last_product_viewed: currentProductName,
        pricing_view_count: lead?.pricingViewCount.toString() || '0',
        
        // Cart
        cart_items: cartItems,
        cart_value: cartValue.toString(),
        cart_abandoned: lead?.cartAbandoned ? 'true' : 'false',
        
        // Orders
        total_orders: behavior.totalOrders.toString(),
        total_spent: behavior.totalSpent.toString(),
        favorite_products: behavior.favoriteProducts.join(', ') || 'None',
        last_order_items: lastOrderItems,
        
        // Lead scoring
        lead_score: lead?.score.toString() || '0',
        intent_level: lead?.intentLevel || 'low',
        lead_stage: lead?.pipelineStage || 'new',
        
        // Next action
        next_best_action: lead?.nextBestAction || 'Monitor',
        trigger_reason: lead?.triggerReason || 'New customer',
        
        // B2B specific
        business_category: user.businessCategory || '',
        requested_quantity: '',
        wholesale_interest: (lead?.pricingViewCount || 0) >= 2 ? 'true' : 'false'
      };

      res.json({ context });
    } catch (error) {
      logger.error('Get agent context error:', error);
      res.status(500).json({ error: 'Failed to generate agent context' });
    }
  }

  async initiateCall(req: Request, res: Response) {
    try {
      const { userId, phoneNumber, triggerReason } = req.body;

      if (!userId || !phoneNumber) {
        return res.status(400).json({ error: 'userId and phoneNumber are required' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get agent context
      const contextResponse = await this.getAgentContext(
        { params: { userId } } as any,
        { json: (data: any) => data } as any
      );

      const agentContext = (contextResponse as any).context;

      // Initiate Retell call
      const callResult = await retellService.initiateCall(phoneNumber, agentContext);

      // Create conversation record
      const conversation = await Conversation.create({
        conversationId: callResult.call_id,
        userId: new Types.ObjectId(userId),
        retellCallId: callResult.call_id,
        direction: 'outbound',
        triggerReason: triggerReason || 'Manual trigger',
        startedAt: new Date(),
        status: 'active'
      });

      // Create agent action
      await AgentAction.create({
        userId: new Types.ObjectId(userId),
        conversationId: conversation._id,
        actionType: 'outbound_call',
        reason: triggerReason || 'Manual trigger',
        status: 'completed',
        metadata: { callId: callResult.call_id }
      });

      logger.info(`Outbound call initiated for user ${userId}`);

      res.json({
        message: 'Call initiated',
        callId: callResult.call_id,
        conversationId: conversation._id
      });
    } catch (error) {
      logger.error('Initiate call error:', error);
      res.status(500).json({ error: 'Failed to initiate call' });
    }
  }

  async getConversation(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const conversation = await Conversation.findById(id)
        .populate('userId', 'email firstName lastName')
        .populate('leadId');

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      res.json({ conversation });
    } catch (error) {
      logger.error('Get conversation error:', error);
      res.status(500).json({ error: 'Failed to fetch conversation' });
    }
  }

  async getConversations(req: Request, res: Response) {
    try {
      const { userId, limit = 20, skip = 0 } = req.query;

      const filter: any = {};
      if (userId) filter.userId = new Types.ObjectId(userId as string);

      const conversations = await Conversation.find(filter)
        .sort({ startedAt: -1 })
        .limit(parseInt(limit as string))
        .skip(parseInt(skip as string))
        .populate('userId', 'email firstName lastName');

      const total = await Conversation.countDocuments(filter);

      res.json({ conversations, total });
    } catch (error) {
      logger.error('Get conversations error:', error);
      res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  }
}

export const agentController = new AgentController();
