import { Lead } from '../models/Lead.js';
import { User } from '../models/User.js';
import { logger } from '../config/logger.js';
import { Types } from 'mongoose';
import { behaviorService } from './behaviorService.js';
import { intentService } from './intentService.js';
import { pipelineService } from './pipelineService.js';
import { nextActionService } from './nextActionService.js';

export class LeadService {
  async findOrCreateLead(userId: Types.ObjectId): Promise<any> {
    try {
      let lead = await Lead.findOne({ userId });

      if (!lead) {
        lead = await Lead.create({
          userId,
          score: 0,
          intentLevel: 'low',
          pipelineStage: 'new',
          productViewCount: 0,
          pricingViewCount: 0,
          visitCount: 0,
          totalTimeSpent: 0,
          averageSessionDuration: 0,
          cartValue: 0,
          cartAbandoned: false,
          totalOrders: 0,
          totalSpent: 0,
          favoriteProducts: [],
          lastActiveAt: new Date(),
          firstSeenAt: new Date()
        });

        logger.info(`New lead created for user ${userId}`);
      }

      return lead;
    } catch (error) {
      logger.error('Error finding/creating lead:', error);
      throw error;
    }
  }

  async updateLeadBehavior(userId: Types.ObjectId): Promise<void> {
    try {
      const lead = await this.findOrCreateLead(userId);
      const behavior = await behaviorService.calculateBehavior(userId);

      lead.visitCount = behavior.visitCount;
      lead.totalTimeSpent = behavior.totalTimeSpent;
      lead.averageSessionDuration = behavior.averageSessionDuration;
      lead.productViewCount = behavior.totalProductViews;
      lead.pricingViewCount = behavior.pricingViews;
      lead.totalOrders = behavior.totalOrders;
      lead.totalSpent = behavior.totalSpent;
      lead.favoriteProducts = behavior.favoriteProducts;
      lead.lastActiveAt = behavior.lastActiveAt;
      lead.lastOrderDate = behavior.lastOrderDate;

      await lead.save();

      // Update intent and pipeline
      await intentService.calculateIntent(userId, lead._id);
      await pipelineService.autoUpdateStage(lead._id);

      // Update next best action
      const { action, reason } = await nextActionService.determineNextAction(userId, lead._id);
      lead.nextBestAction = action;
      lead.triggerReason = reason;
      await lead.save();

      logger.info(`Lead behavior updated for user ${userId}`);
    } catch (error) {
      logger.error('Error updating lead behavior:', error);
      throw error;
    }
  }

  async detectDuplicateLeads(): Promise<any[]> {
    try {
      const duplicates = await User.aggregate([
        {
          $group: {
            _id: { $toLower: '$email' },
            count: { $sum: 1 },
            users: { $push: '$_id' }
          }
        },
        { $match: { count: { $gt: 1 } } }
      ]);

      return duplicates;
    } catch (error) {
      logger.error('Error detecting duplicate leads:', error);
      return [];
    }
  }

  async detectStalledLeads(): Promise<any[]> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const stalledLeads = await Lead.find({
        intentLevel: { $in: ['high', 'very_high'] },
        lastActiveAt: { $lt: sevenDaysAgo },
        pipelineStage: { $nin: ['closed_won', 'closed_lost'] },
        stalled: false
      });

      for (const lead of stalledLeads) {
        lead.stalled = true;
        await lead.save();
      }

      return stalledLeads;
    } catch (error) {
      logger.error('Error detecting stalled leads:', error);
      return [];
    }
  }
}

export const leadService = new LeadService();
