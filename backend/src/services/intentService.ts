import { Lead, IntentLevel } from '../models/Lead.js';
import { Event } from '../models/Event.js';
import { Settings } from '../models/Settings.js';
import { logger } from '../config/logger.js';
import { Types } from 'mongoose';
import { subDays } from 'date-fns';

export class IntentService {
  async calculateIntent(userId: Types.ObjectId, leadId: Types.ObjectId): Promise<IntentLevel> {
    try {
      const lead = await Lead.findById(leadId);
      if (!lead) {
        return 'low';
      }

      const settings = await Settings.findOne();
      const highThreshold = settings?.highIntentScoreThreshold || 60;
      const veryHighThreshold = settings?.veryHighIntentScoreThreshold || 80;

      // Recent activity analysis (last 7 days)
      const recentDate = subDays(new Date(), 7);
      const recentEvents = await Event.find({
        userId,
        timestamp: { $gte: recentDate }
      }).sort({ timestamp: -1 });

      const recentProductViews = recentEvents.filter(e => e.eventType === 'product_viewed').length;
      const recentPricingViews = recentEvents.filter(e => e.eventType === 'pricing_viewed').length;
      const recentCartActivity = recentEvents.filter(e => 
        ['cart_created', 'cart_updated', 'checkout_started'].includes(e.eventType)
      ).length;
      const hasWholesaleInterest = recentEvents.some(e => 
        ['wholesale_pricing_viewed', 'bulk_quote_submitted'].includes(e.eventType)
      );

      // Calculate intent based on score and behavior
      let intent: IntentLevel = 'low';

      if (lead.score >= veryHighThreshold) {
        intent = 'very_high';
      } else if (lead.score >= highThreshold) {
        intent = 'high';
      } else if (
        lead.score >= 40 && 
        (recentProductViews >= 3 || recentPricingViews >= 2 || recentCartActivity >= 2)
      ) {
        intent = 'medium';
      } else if (lead.score >= 20) {
        intent = 'medium';
      }

      // Boost intent for strong signals
      if (hasWholesaleInterest && intent === 'medium') {
        intent = 'high';
      }
      if (recentCartActivity >= 3 && intent !== 'very_high') {
        intent = 'high';
      }

      // Update lead if intent changed
      if (lead.intentLevel !== intent) {
        lead.intentLevel = intent;
        await lead.save();
        logger.info(`Intent updated for lead ${leadId}: ${lead.intentLevel} -> ${intent}`);
      }

      return intent;
    } catch (error) {
      logger.error('Error calculating intent:', error);
      return 'low';
    }
  }
}

export const intentService = new IntentService();
