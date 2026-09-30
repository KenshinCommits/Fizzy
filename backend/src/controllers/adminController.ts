import { Request, Response } from 'express';
import { User } from '../models/User.js';
import { Lead } from '../models/Lead.js';
import { Order } from '../models/Order.js';
import { Event } from '../models/Event.js';
import { Conversation } from '../models/Conversation.js';
import { ScoreHistory } from '../models/ScoreHistory.js';
import { AgentAction } from '../models/AgentAction.js';
import { Product } from '../models/Product.js';
import { logger } from '../config/logger.js';
import { Types } from 'mongoose';
import { scoringService } from '../services/scoringService.js';

export class AdminController {
  async getDashboard(req: Request, res: Response) {
    try {
      const totalCustomers = await User.countDocuments({ role: 'customer' });
      const totalLeads = await Lead.countDocuments();
      const totalOrders = await Order.countDocuments();
      const totalRevenue = await Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]);

      const highIntentLeads = await Lead.countDocuments({ 
        intentLevel: { $in: ['high', 'very_high'] } 
      });

      const activeConversations = await Conversation.countDocuments({ status: 'active' });

      const recentEvents = await Event.find()
        .sort({ timestamp: -1 })
        .limit(10)
        .populate('userId', 'email firstName lastName');

      res.json({
        metrics: {
          totalCustomers,
          totalLeads,
          totalOrders,
          totalRevenue: totalRevenue[0]?.total || 0,
          highIntentLeads,
          activeConversations
        },
        recentEvents
      });
    } catch (error) {
      logger.error('Get dashboard error:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard' });
    }
  }

  async getCustomers(req: Request, res: Response) {
    try {
      const { search, customerType, limit = 20, skip = 0 } = req.query;

      const filter: any = { role: 'customer' };
      if (customerType) filter.customerType = customerType;
      if (search) {
        filter.$or = [
          { email: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } }
        ];
      }

      const customers = await User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit as string))
        .skip(parseInt(skip as string));

      const total = await User.countDocuments(filter);

      res.json({ customers, total });
    } catch (error) {
      logger.error('Get customers error:', error);
      res.status(500).json({ error: 'Failed to fetch customers' });
    }
  }

  async getCustomerDetail(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const customer = await User.findById(id).select('-password');
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      const lead = await Lead.findOne({ userId: id });
      const orders = await Order.find({ userId: id }).sort({ createdAt: -1 }).limit(10);
      const conversations = await Conversation.find({ userId: id }).sort({ startedAt: -1 }).limit(5);

      res.json({ customer, lead, orders, conversations });
    } catch (error) {
      logger.error('Get customer detail error:', error);
      res.status(500).json({ error: 'Failed to fetch customer details' });
    }
  }

  async getLeads(req: Request, res: Response) {
    try {
      const { intentLevel, pipelineStage, stalled, limit = 20, skip = 0 } = req.query;

      const filter: any = {};
      if (intentLevel) filter.intentLevel = intentLevel;
      if (pipelineStage) filter.pipelineStage = pipelineStage;
      if (stalled === 'true') filter.stalled = true;

      const leads = await Lead.find(filter)
        .populate('userId', 'email firstName lastName customerType')
        .sort({ score: -1, lastActiveAt: -1 })
        .limit(parseInt(limit as string))
        .skip(parseInt(skip as string));

      const total = await Lead.countDocuments(filter);

      res.json({ leads, total });
    } catch (error) {
      logger.error('Get leads error:', error);
      res.status(500).json({ error: 'Failed to fetch leads' });
    }
  }

  async getLeadDetail(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const lead = await Lead.findById(id).populate('userId', 'email firstName lastName phone');
      if (!lead) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      const scoreHistory = await ScoreHistory.find({ leadId: id })
        .sort({ timestamp: -1 })
        .limit(20);

      const conversations = await Conversation.find({ leadId: id })
        .sort({ startedAt: -1 })
        .limit(5);

      const agentActions = await AgentAction.find({ leadId: id })
        .sort({ createdAt: -1 })
        .limit(10);

      res.json({ lead, scoreHistory, conversations, agentActions });
    } catch (error) {
      logger.error('Get lead detail error:', error);
      res.status(500).json({ error: 'Failed to fetch lead details' });
    }
  }

  async updateLead(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const lead = await Lead.findByIdAndUpdate(id, updates, { new: true });
      if (!lead) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      logger.info(`Lead updated: ${id}`);
      res.json({ lead });
    } catch (error) {
      logger.error('Update lead error:', error);
      res.status(500).json({ error: 'Failed to update lead' });
    }
  }

  async getOrders(req: Request, res: Response) {
    try {
      const { userId, status, limit = 20, skip = 0 } = req.query;

      const filter: any = {};
      if (userId) filter.userId = new Types.ObjectId(userId as string);
      if (status) filter.fulfillmentStatus = status;

      const orders = await Order.find(filter)
        .populate('userId', 'email firstName lastName')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit as string))
        .skip(parseInt(skip as string));

      const total = await Order.countDocuments(filter);

      res.json({ orders, total });
    } catch (error) {
      logger.error('Get orders error:', error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  }

  async getOrderDetail(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const order = await Order.findById(id).populate('userId', 'email firstName lastName phone');
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json({ order });
    } catch (error) {
      logger.error('Get order detail error:', error);
      res.status(500).json({ error: 'Failed to fetch order details' });
    }
  }

  async updateOrderStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { fulfillmentStatus, trackingNumber } = req.body;

      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (fulfillmentStatus) order.fulfillmentStatus = fulfillmentStatus;
      if (trackingNumber) order.trackingNumber = trackingNumber;

      await order.save();

      logger.info(`Order ${id} status updated to ${fulfillmentStatus}`);
      res.json({ order });
    } catch (error) {
      logger.error('Update order status error:', error);
      res.status(500).json({ error: 'Failed to update order status' });
    }
  }

  async getAgentAnalysis(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId).select('-password');
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const lead = await Lead.findOne({ userId });
      const scoreHistory = await ScoreHistory.find({ userId })
        .sort({ timestamp: -1 })
        .limit(50);

      const conversations = await Conversation.find({ userId })
        .sort({ startedAt: -1 })
        .limit(10);

      const agentActions = await AgentAction.find({ userId })
        .sort({ createdAt: -1 })
        .limit(20);

      const events = await Event.find({ userId })
        .sort({ timestamp: -1 })
        .limit(100);

      const orders = await Order.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10);

      // Build activity timeline
      const activityTimeline = [
        ...events.map(e => ({ type: 'event', data: e, timestamp: e.timestamp })),
        ...scoreHistory.map(s => ({ type: 'score_change', data: s, timestamp: s.timestamp })),
        ...conversations.map(c => ({ type: 'conversation', data: c, timestamp: c.startedAt })),
        ...orders.map(o => ({ type: 'order', data: o, timestamp: o.createdAt }))
      ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 50);

      res.json({
        customer: user,
        lead,
        scoreHistory,
        conversations,
        agentActions,
        activityTimeline
      });
    } catch (error) {
      logger.error('Get agent analysis error:', error);
      res.status(500).json({ error: 'Failed to fetch agent analysis' });
    }
  }

  async getScoringRules(req: Request, res: Response) {
    try {
      const rules = await scoringService.getScoringRules();
      res.json({ rules });
    } catch (error) {
      logger.error('Get scoring rules error:', error);
      res.status(500).json({ error: 'Failed to fetch scoring rules' });
    }
  }

  async updateScoringRules(req: Request, res: Response) {
    try {
      const { rules } = req.body;
      const updatedRules = await scoringService.updateScoringRules(rules);
      logger.info('Scoring rules updated');
      res.json({ rules: updatedRules });
    } catch (error) {
      logger.error('Update scoring rules error:', error);
      res.status(500).json({ error: 'Failed to update scoring rules' });
    }
  }

  async getAnalytics(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const dateFilter: any = {};
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) dateFilter.$lte = new Date(endDate as string);

      const filter = dateFilter.$gte || dateFilter.$lte ? { createdAt: dateFilter } : {};

      // Revenue
      const revenue = await Order.aggregate([
        { $match: { ...filter, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]);

      // Orders by status
      const ordersByStatus = await Order.aggregate([
        { $match: filter },
        { $group: { _id: '$fulfillmentStatus', count: { $sum: 1 } } }
      ]);

      // Lead score distribution
      const scoreDistribution = await Lead.aggregate([
        {
          $bucket: {
            groupBy: '$score',
            boundaries: [0, 20, 40, 60, 80, 100],
            default: 'Other',
            output: { count: { $sum: 1 } }
          }
        }
      ]);

      // Pipeline value
      const pipelineValue = await Lead.aggregate([
        { $group: { _id: '$pipelineStage', count: { $sum: 1 }, totalScore: { $sum: '$score' } } }
      ]);

      // Conversation metrics
      const conversationMetrics = await Conversation.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            avgDuration: { $avg: '$durationSeconds' },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
          }
        }
      ]);

      res.json({
        revenue: revenue[0]?.total || 0,
        ordersByStatus,
        scoreDistribution,
        pipelineValue,
        conversationMetrics: conversationMetrics[0] || {}
      });
    } catch (error) {
      logger.error('Get analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  }
}

export const adminController = new AdminController();
