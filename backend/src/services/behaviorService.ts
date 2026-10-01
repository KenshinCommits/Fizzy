import { Event } from '../models/Event.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { logger } from '../config/logger.js';
import { Types } from 'mongoose';

export interface CustomerBehavior {
  visitCount: number;
  totalTimeSpent: number;
  averageSessionDuration: number;
  totalProductViews: number;
  uniqueProductsViewed: number;
  pricingViews: number;
  cartInteractions: number;
  checkoutAttempts: number;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  favoriteProducts: string[];
  mostViewedProducts: string[];
  lastActiveAt: Date;
  firstSeenAt: Date;
  lastOrderDate?: Date;
}

export class BehaviorService {
  async calculateBehavior(userId: Types.ObjectId): Promise<CustomerBehavior> {
    try {
      const events = await Event.find({ userId }).sort({ timestamp: 1 });
      const orders = await Order.find({ userId }).sort({ createdAt: 1 });

      // Session analysis
      const sessions = this.groupIntoSessions(events);
      const visitCount = sessions.length;
      const totalTimeSpent = sessions.reduce((sum, session) => sum + session.duration, 0);
      const averageSessionDuration = visitCount > 0 ? Math.round(totalTimeSpent / visitCount) : 0;

      // Product views
      const productViews = events.filter(e => e.eventType === 'product_viewed');
      const totalProductViews = productViews.length;
      const uniqueProductsViewed = new Set(productViews.map(e => e.productId?.toString()).filter(Boolean)).size;

      // Product frequency
      const productFrequency: Record<string, number> = {};
      for (const event of productViews) {
        if (event.productId) {
          const pid = event.productId.toString();
          productFrequency[pid] = (productFrequency[pid] || 0) + 1;
        }
      }

      const sortedProducts = Object.entries(productFrequency)
        .sort(([, a], [, b]) => b - a)
        .map(([pid]) => pid);

      const mostViewedProducts = await this.getProductNames(sortedProducts.slice(0, 5));

      // Pricing views
      const pricingViews = events.filter(e => 
        e.eventType === 'pricing_viewed' || e.eventType === 'wholesale_pricing_viewed'
      ).length;

      // Cart and checkout
      const cartInteractions = events.filter(e => 
        ['cart_created', 'cart_updated', 'cart_abandoned'].includes(e.eventType)
      ).length;
      const checkoutAttempts = events.filter(e => e.eventType === 'checkout_started').length;

      // Orders
      const totalOrders = orders.length;
      const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
      const averageOrderValue = totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0;

      // Favorite products (purchased most)
      const purchasedProducts: Record<string, number> = {};
      for (const order of orders) {
        for (const item of order.items) {
          purchasedProducts[item.productName] = (purchasedProducts[item.productName] || 0) + item.quantity;
        }
      }
      const favoriteProducts = Object.entries(purchasedProducts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([name]) => name);

      // Dates
      const firstSeenAt = events[0]?.timestamp || new Date();
      const lastActiveAt = events[events.length - 1]?.timestamp || new Date();
      const lastOrderDate = orders[orders.length - 1]?.createdAt;

      return {
        visitCount,
        totalTimeSpent,
        averageSessionDuration,
        totalProductViews,
        uniqueProductsViewed,
        pricingViews,
        cartInteractions,
        checkoutAttempts,
        totalOrders,
        totalSpent,
        averageOrderValue,
        favoriteProducts,
        mostViewedProducts,
        lastActiveAt,
        firstSeenAt,
        lastOrderDate
      };
    } catch (error) {
      logger.error('Error calculating behavior:', error);
      throw error;
    }
  }

  private groupIntoSessions(events: any[]): { duration: number }[] {
    const sessions: { start: Date; end: Date; duration: number }[] = [];
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

    let currentSession: { start: Date; end: Date } | null = null;

    for (const event of events) {
      if (!currentSession) {
        currentSession = { start: event.timestamp, end: event.timestamp };
      } else {
        const timeSinceLastEvent = event.timestamp.getTime() - currentSession.end.getTime();
        if (timeSinceLastEvent > SESSION_TIMEOUT) {
          // End current session
          sessions.push({
            ...currentSession,
            duration: Math.round((currentSession.end.getTime() - currentSession.start.getTime()) / 1000)
          });
          currentSession = { start: event.timestamp, end: event.timestamp };
        } else {
          currentSession.end = event.timestamp;
        }
      }
    }

    if (currentSession) {
      sessions.push({
        ...currentSession,
        duration: Math.round((currentSession.end.getTime() - currentSession.start.getTime()) / 1000)
      });
    }

    return sessions;
  }

  private async getProductNames(productIds: string[]): Promise<string[]> {
    try {
      const products = await Product.find({
        _id: { $in: productIds.map(id => new Types.ObjectId(id)) }
      }).select('name');
      
      const productMap = new Map(products.map(p => [p._id.toString(), p.name]));
      return productIds.map(id => productMap.get(id) || 'Unknown').filter(name => name !== 'Unknown');
    } catch (error) {
      logger.error('Error fetching product names:', error);
      return [];
    }
  }
}

export const behaviorService = new BehaviorService();
