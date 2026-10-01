import { Event, EventType } from '../models/Event.js';
import { Session } from '../models/Session.js';
import { CustomerMetrics } from '../models/CustomerMetrics.js';
import { Lead } from '../models/Lead.js';
import { ActivityTimeline } from '../models/ActivityTimeline.js';
import { Product } from '../models/Product.js';
import { logger } from '../config/logger.js';
import { Types } from 'mongoose';
import { scoringService } from './scoringService.js';
import { leadService } from './leadService.js';
import { intentService } from './intentService.js';
import { pipelineService } from './pipelineService.js';
import { nextActionService } from './nextActionService.js';
import { emitEvent } from '../realtime/socketManager.js';

export class EventProcessingService {
  async processEvent(eventDoc: any): Promise<void> {
    if (!eventDoc.userId) return;

    const userId = eventDoc.userId;
    const eventType = eventDoc.eventType as EventType;

    try {
      // 1. Update session
      await this.updateSession(eventDoc);

      // 2. Update customer metrics
      await this.updateCustomerMetrics(userId, eventDoc);

      // 3. Find or create lead
      const lead = await leadService.findOrCreateLead(userId);

      // 4. Apply scoring rules
      const newScore = await scoringService.updateScore(
        userId,
        lead._id,
        eventType,
        eventDoc._id,
        eventDoc.metadata
      );

      // 5. Calculate intent
      const intent = await intentService.calculateIntent(userId, lead._id);

      // 6. Update pipeline
      await pipelineService.autoUpdateStage(lead._id);

      // 7. Update next best action
      const { action, reason } = await nextActionService.determineNextAction(userId, lead._id);
      await Lead.findByIdAndUpdate(lead._id, {
        nextBestAction: action,
        triggerReason: reason,
        lastActiveAt: new Date()
      });

      // 8. Create activity timeline entry
      await this.createTimelineEntry(userId, lead._id, eventDoc);

      // 9. Emit real-time event to admin
      this.emitRealTimeEvent(eventDoc, newScore, intent);

    } catch (error) {
      logger.error('Event processing error:', error);
    }
  }

  private async updateSession(eventDoc: any): Promise<void> {
    try {
      const sessionUpdate: any = { $inc: {} };

      if (eventDoc.eventType === 'page_viewed') sessionUpdate.$inc.pageViews = 1;
      if (eventDoc.eventType === 'product_viewed') sessionUpdate.$inc.productViews = 1;
      if (eventDoc.eventType === 'pricing_viewed' || eventDoc.eventType === 'wholesale_pricing_viewed') {
        sessionUpdate.$inc.pricingViews = 1;
      }
      if (['cart_created', 'cart_updated', 'cart_abandoned'].includes(eventDoc.eventType)) {
        sessionUpdate.$inc.cartInteractions = 1;
      }
      if (eventDoc.eventType === 'checkout_started') sessionUpdate.$inc.checkoutAttempts = 1;

      if (Object.keys(sessionUpdate.$inc).length > 0) {
        await Session.findOneAndUpdate(
          { sessionId: eventDoc.sessionId },
          {
            ...sessionUpdate,
            $setOnInsert: {
              sessionId: eventDoc.sessionId,
              userId: eventDoc.userId,
              startedAt: eventDoc.timestamp || new Date()
            }
          },
          { upsert: true }
        );
      }
    } catch (error) {
      logger.error('Error updating session:', error);
    }
  }

  private async updateCustomerMetrics(userId: Types.ObjectId, eventDoc: any): Promise<void> {
    try {
      const update: any = { $set: { lastActiveAt: new Date() } };
      const inc: any = {};

      if (eventDoc.eventType === 'page_viewed') inc.totalPageViews = 1;
      if (eventDoc.eventType === 'product_viewed') {
        inc.totalProductViews = 1;
      }
      if (eventDoc.eventType === 'pricing_viewed' || eventDoc.eventType === 'wholesale_pricing_viewed') {
        inc.pricingViews = 1;
      }
      if (['cart_created', 'cart_updated'].includes(eventDoc.eventType)) inc.cartInteractions = 1;
      if (eventDoc.eventType === 'checkout_started') inc.checkoutAttempts = 1;
      if (eventDoc.eventType === 'purchase_completed') {
        inc.totalOrders = 1;
        if (eventDoc.metadata?.orderTotal) inc.totalSpent = eventDoc.metadata.orderTotal;
      }

      if (Object.keys(inc).length > 0) update.$inc = inc;

      // Update most viewed products
      if (eventDoc.eventType === 'product_viewed' && eventDoc.productId) {
        await CustomerMetrics.findOneAndUpdate(
          { userId, 'mostViewedProducts.productId': eventDoc.productId },
          { $inc: { 'mostViewedProducts.$.viewCount': 1 } }
        );

        const existing = await CustomerMetrics.findOne({ userId });
        if (!existing || !existing.mostViewedProducts.find(p => p.productId.equals(eventDoc.productId))) {
          update.$addToSet = {
            mostViewedProducts: { productId: eventDoc.productId, viewCount: 1 }
          };
        }
      }

      await CustomerMetrics.findOneAndUpdate(
        { userId },
        {
          ...update,
          $setOnInsert: { firstSeenAt: new Date() }
        },
        { upsert: true }
      );
    } catch (error) {
      logger.error('Error updating customer metrics:', error);
    }
  }

  private async createTimelineEntry(userId: Types.ObjectId, leadId: Types.ObjectId, eventDoc: any): Promise<void> {
    try {
      const { title, description } = this.getTimelineDetails(eventDoc);

      await ActivityTimeline.create({
        userId,
        leadId,
        type: eventDoc.eventType,
        title,
        description,
        metadata: eventDoc.metadata,
        source: eventDoc.source || 'web',
        timestamp: eventDoc.timestamp || new Date()
      });
    } catch (error) {
      logger.error('Error creating timeline entry:', error);
    }
  }

  private getTimelineDetails(eventDoc: any): { title: string; description: string } {
    const productName = eventDoc.metadata?.productName || 'a product';
    const map: Record<string, { title: string; description: string }> = {
      product_viewed: { title: 'Product Viewed', description: `Viewed ${productName}` },
      pricing_viewed: { title: 'Pricing Viewed', description: 'Viewed pricing information' },
      wholesale_pricing_viewed: { title: 'Wholesale Pricing Viewed', description: 'Viewed wholesale pricing' },
      cart_created: { title: 'Added to Cart', description: `Added ${productName} to cart` },
      cart_updated: { title: 'Cart Updated', description: `Updated cart with ${productName}` },
      cart_abandoned: { title: 'Cart Abandoned', description: 'Left items in cart' },
      checkout_started: { title: 'Checkout Started', description: 'Began checkout process' },
      purchase_completed: { title: 'Purchase Completed', description: 'Completed an order' },
      bulk_quote_submitted: { title: 'Wholesale Quote Submitted', description: 'Submitted bulk order request' },
      user_logged_in: { title: 'Logged In', description: 'Signed in to account' },
      user_registered: { title: 'Registered', description: 'Created account' },
      wishlist_added: { title: 'Wishlist Updated', description: `Added ${productName} to wishlist` },
      voice_agent_started: { title: 'AI Conversation Started', description: 'Started voice conversation with Fizzi agent' },
      voice_agent_completed: { title: 'AI Conversation Completed', description: 'Completed voice conversation' }
    };
    return map[eventDoc.eventType] || { title: eventDoc.eventType, description: eventDoc.eventType };
  }

  private emitRealTimeEvent(eventDoc: any, newScore: number, intent: string): void {
    try {
      const realtimePayload: any = {
        type: eventDoc.eventType,
        userId: eventDoc.userId?.toString(),
        timestamp: eventDoc.timestamp
      };

      if (eventDoc.productId) realtimePayload.productId = eventDoc.productId.toString();
      if (eventDoc.metadata?.productName) realtimePayload.productName = eventDoc.metadata.productName;

      emitEvent(eventDoc.eventType, realtimePayload);

      if (newScore) {
        emitEvent('lead_score_changed', {
          userId: eventDoc.userId?.toString(),
          newScore,
          intent,
          timestamp: new Date()
        });
      }
    } catch (error) {
      logger.error('Error emitting real-time event:', error);
    }
  }
}

export const eventProcessingService = new EventProcessingService();
