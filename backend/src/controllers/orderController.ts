import { Request, Response } from 'express';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Cart } from '../models/Cart.js';
import { CustomerMetrics } from '../models/CustomerMetrics.js';
import { logger } from '../config/logger.js';
import { Types } from 'mongoose';

export class OrderController {
  async createOrder(req: any, res: Response) {
    try {
      const userId = req.user._id;
      const { items, shippingAddress, discount = 0, shipping = 0 } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).json({ error: 'Order must have items' });
      }

      let subtotal = 0;
      const orderItems = [];

      for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product || product.status === 'Archived') {
          return res.status(404).json({ error: `Product ${item.productId} not found or unavailable` });
        }

        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;

        orderItems.push({
          product: product._id,
          productId: product._id,
          variantId: item.variantId,
          productSnapshot: { name: product.name, sku: product.sku, description: product.description, packSize: product.packSize, images: product.images },
          productName: product.name,
          productSku: product.sku,
          quantity: item.quantity,
          price: product.price,
          total: itemTotal
        });
      }

      const tax = Math.round(subtotal * 0.05);
      const total = subtotal - discount + shipping + tax;
      const orderNumber = `FZ-${Date.now()}`;

      const order = await Order.create({
        userId,
        orderNumber,
        items: orderItems,
        subtotal,
        discount,
        shipping,
        tax,
        total,
        currency: 'INR',
        paymentStatus: 'pending',
        fulfillmentStatus: 'pending',
        shippingAddress
      });

      // Update customer metrics
      await CustomerMetrics.findOneAndUpdate(
        { userId },
        {
          $inc: { totalOrders: 1, totalSpent: total },
          $set: { lastOrderDate: new Date(), lastActiveAt: new Date() }
        },
        { upsert: true }
      );

      // Clear cart
      await Cart.findOneAndUpdate({ userId, status: 'active' }, {
        $set: { items: [], subtotal: 0, lastActivityAt: new Date() }
      });

      logger.info(`Order created: ${orderNumber} for user ${userId}`);
      res.status(201).json({ order });
    } catch (error) {
      logger.error('Create order error:', error);
      res.status(500).json({ error: 'Failed to create order' });
    }
  }

  async getUserOrders(req: any, res: Response) {
    try {
      const userId = req.user._id;
      const { limit = 20, skip = 0 } = req.query;

      const orders = await Order.find({ userId })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .populate('items.product', 'name slug legacyProductId');

      const total = await Order.countDocuments({ userId });
      res.json({ orders, total });
    } catch (error) {
      logger.error('Get user orders error:', error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  }

  async getOrder(req: any, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const order = await Order.findOne({ _id: id, userId })
        .populate('items.product', 'name slug packSize legacyProductId');

      if (!order) return res.status(404).json({ error: 'Order not found' });
      res.json({ order });
    } catch (error) {
      logger.error('Get order error:', error);
      res.status(500).json({ error: 'Failed to fetch order' });
    }
  }
}

export const orderController = new OrderController();
