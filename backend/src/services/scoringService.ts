import { Lead } from '../models/Lead.js';
import { ScoreHistory } from '../models/ScoreHistory.js';
import { Settings } from '../models/Settings.js';
import { Event, EventType } from '../models/Event.js';
import { logger } from '../config/logger.js';
import { Types } from 'mongoose';

const DEFAULT_SCORING_RULES = [
  { eventType: 'product_viewed', scoreChange: 3, description: 'Viewed a product' },
  { eventType: 'repeated_product_view', scoreChange: 8, description: 'Viewed same product multiple times' },
  { eventType: 'pricing_viewed', scoreChange: 10, description: 'Viewed pricing page' },
  { eventType: 'wishlist_added', scoreChange: 5, description: 'Added to wishlist' },
  { eventType: 'cart_created', scoreChange: 15, description: 'Added to cart' },
  { eventType: 'cart_updated', scoreChange: 15, description: 'Updated cart' },
  { eventType: 'checkout_started', scoreChange: 20, description: 'Started checkout' },
  { eventType: 'purchase_completed', scoreChange: 30, description: 'Completed purchase' },
  { eventType: 'wholesale_pricing_viewed', scoreChange: 15, description: 'Viewed wholesale pricing' },
  { eventType: 'bulk_quote_submitted', scoreChange: 25, description: 'Submitted bulk quote' },
  { eventType: 'high_value_cart', scoreChange: 10, description: 'High value cart' },
  { eventType: 'cart_abandoned', scoreChange: -5, description: 'Abandoned cart' }
];

export class ScoringService {
  private scoringRules: Map<string, number> = new Map();
  private recentProductViews: Map<string, Map<string, number>> = new Map();

  async initialize() {
    const settings = await Settings.findOne();
    if (!settings) {
      const newSettings = new Settings({ scoringRules: DEFAULT_SCORING_RULES });
      await newSettings.save();
      this.loadRules(DEFAULT_SCORING_RULES);
    } else {
      this.loadRules(settings.scoringRules);
    }
  }

  private loadRules(rules: any[]) {
    this.scoringRules.clear();
    rules.forEach(rule => {
      this.scoringRules.set(rule.eventType, rule.scoreChange);
    });
  }

  async updateScore(
    userId: Types.ObjectId,
    leadId: Types.ObjectId,
    eventType: EventType | string,
    eventId?: Types.ObjectId,
    metadata?: Record<string, any>
  ): Promise<number> {
    try {
      const lead = await Lead.findById(leadId);
      if (!lead) {
        logger.error('Lead not found for scoring:', leadId);
        return 0;
      }

      const previousScore = lead.score;
      let scoreChange = 0;
      let reason = '';

      // Handle repeated product views
      if (eventType === 'product_viewed' && metadata?.productId) {
        const productId = metadata.productId.toString();
        if (!this.recentProductViews.has(userId.toString())) {
          this.recentProductViews.set(userId.toString(), new Map());
        }
        const userViews = this.recentProductViews.get(userId.toString())!;
        const viewCount = (userViews.get(productId) || 0) + 1;
        userViews.set(productId, viewCount);

        if (viewCount >= 3) {
          scoreChange = this.scoringRules.get('repeated_product_view') || 8;
          reason = 'Viewed same product multiple times';
        } else {
          scoreChange = this.scoringRules.get('product_viewed') || 3;
          reason = 'Viewed a product';
        }
      } else {
        scoreChange = this.scoringRules.get(eventType) || 0;
        reason = this.getReasonForEvent(eventType);
      }

      if (scoreChange === 0) {
        return previousScore;
      }

      const newScore = Math.max(0, Math.min(100, previousScore + scoreChange));
      lead.score = newScore;
      await lead.save();

      // Record score history
      await ScoreHistory.create({
        leadId,
        userId,
        previousScore,
        change: scoreChange,
        newScore,
        reason,
        eventId,
        timestamp: new Date()
      });

      logger.info(`Score updated for lead ${leadId}: ${previousScore} -> ${newScore} (${reason})`);

      return newScore;
    } catch (error) {
      logger.error('Error updating score:', error);
      return 0;
    }
  }

  private getReasonForEvent(eventType: string): string {
    const reasons: Record<string, string> = {
      'product_viewed': 'Viewed a product',
      'pricing_viewed': 'Viewed pricing',
      'wishlist_added': 'Added to wishlist',
      'cart_created': 'Created cart',
      'cart_updated': 'Updated cart',
      'checkout_started': 'Started checkout',
      'purchase_completed': 'Completed purchase',
      'wholesale_pricing_viewed': 'Viewed wholesale pricing',
      'bulk_quote_submitted': 'Submitted bulk quote',
      'high_value_cart': 'High value cart',
      'cart_abandoned': 'Abandoned cart'
    };
    return reasons[eventType] || eventType;
  }

  async getScoringRules() {
    const settings = await Settings.findOne();
    return settings?.scoringRules || DEFAULT_SCORING_RULES;
  }

  async updateScoringRules(rules: any[]) {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({ scoringRules: rules });
    } else {
      settings.scoringRules = rules;
    }
    await settings.save();
    this.loadRules(rules);
    return rules;
  }
}

export const scoringService = new ScoringService();
