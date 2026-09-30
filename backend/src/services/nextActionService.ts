import { Lead } from '../models/Lead.js';
import { Event } from '../models/Event.js';
import { logger } from '../config/logger.js';
import { Types } from 'mongoose';
import { subDays } from 'date-fns';

export class NextActionService {
  async determineNextAction(userId: Types.ObjectId, leadId: Types.ObjectId): Promise<{ action: string; reason: string }> {
    try {
      const lead = await Lead.findById(leadId);
      if (!lead) {
        return { action: 'Monitor', reason: 'Lead not found' };
      }

      // High-value abandoned cart - highest priority
      if (lead.cartAbandoned && lead.cartValue >= 100) {
        return {
          action: 'Trigger abandoned-cart recovery',
          reason: 'High-value abandoned cart'
        };
      }

      // Wholesale interest
      if (lead.pricingViewCount >= 2 && lead.pipelineStage === 'bulk_quote') {
        return {
          action: 'Contact wholesale buyer',
          reason: 'Wholesale interest detected'
        };
      }

      // Very high intent
      if (lead.intentLevel === 'very_high') {
        return {
          action: 'Follow up within 15 minutes',
          reason: 'Very high purchase intent'
        };
      }

      // High intent
      if (lead.intentLevel === 'high') {
        return {
          action: 'Start product conversation',
          reason: 'High purchase intent'
        };
      }

      // Repeated product views
      const recentDate = subDays(new Date(), 3);
      const recentProductViews = await Event.find({
        userId,
        eventType: 'product_viewed',
        timestamp: { $gte: recentDate }
      });

      if (recentProductViews.length >= 3 && lead.currentProduct) {
        return {
          action: 'Start product conversation',
          reason: 'Repeated product views'
        };
      }

      // Cart abandonment (lower value)
      if (lead.cartAbandoned && lead.cartValue >= 50) {
        return {
          action: 'Trigger abandoned-cart recovery',
          reason: 'Abandoned cart'
        };
      }

      // Medium intent
      if (lead.intentLevel === 'medium' && lead.score >= 50) {
        return {
          action: 'Recommend product',
          reason: 'Medium purchase intent'
        };
      }

      // Qualified lead
      if (lead.pipelineStage === 'qualified' || lead.pipelineStage === 'high_intent') {
        return {
          action: 'Assign salesperson',
          reason: 'Qualified lead ready for engagement'
        };
      }

      // Default
      return {
        action: 'Monitor',
        reason: 'Gathering behavioral data'
      };
    } catch (error) {
      logger.error('Error determining next action:', error);
      return { action: 'Monitor', reason: 'Error in analysis' };
    }
  }
}

export const nextActionService = new NextActionService();
