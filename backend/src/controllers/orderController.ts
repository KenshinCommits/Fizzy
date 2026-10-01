import { Response } from 'express';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Cart } from '../models/Cart.js';
import { Event } from '../models/Event.js';
import { Lead } from '../models/Lead.js';
import { logger } from '../config/logger.js';

// Pad a number to N digits
function pad(n: number, digits = 6): string {
  return String(n).padStart(digits, '0');
}

async function nextOrderNumber(): Promise<string> {
  const count = await Order.countDocuments();
  return `FIZ-${new Date().getFullYear()}-${pad(count + 1)}`;
}

export class OrderController {
  /** POST /api/orders — checkout from cart */
  async createOrder(req: any, res: Response) {
    try {
      const userId = req.user._id;
      const { shippingAddress, discount = 0, shipping = 0 } = req.body;

      if (!shippingAddress || !shippingAddress.name || !shippingAddress.street || !shippingAddress.city) {
        return res.status(400).json({ error: 'Shipping address is required (name, street, city, state, zip, country)' });
      }

      // Load cart
      const cart = await Cart.findOne({ userId, abandoned: false }).populate('items.product');
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ error: 'Your cart is empty' });
      }

      // Build order items with authoritative prices + snapshot
      let subtotal = 0;
      const orderItems: any[] = [];

      for (const item of cart.items) {
        const product = await Product.findById((item.product as any)._id || item.product);
        if (!product || product.status === 'Archived') {
          return res.status(409).json({ error: `Product ${(item.product as any).name || item.product} is no longer available` });
        }
        if (product.stock !== undefined && product.stock < item.quantity) {
          return res.status(409).json({ error: `Insufficient stock for ${product.name}` });
        }

        const lineTotal = product.price * item.quantity;
        subtotal += lineTotal;

        orderItems.push({
          product: product._id,
          productName: product.name,
          productSku: product.sku,
          productSnapshot: {
            name: product.name,
            image: product.images?.[0] ?? '',
            packSize: product.packSize ?? '',
            price: product.price,
            sku: product.sku,
          },
          quantity: item.quantity,
          price: product.price,
          total: lineTotal,
        });

        // Decrement stock
        await Product.findByIdAndUpdate(product._id, { $inc: { stock: -item.quantity, sold: item.quantity } });
      }

      const total = subtotal - discount + shipping;
      const orderNumber = await nextOrderNumber();

      const order = await Order.create({
        userId,
        orderNumber,
        items: orderItems,
        subtotal,
        discount,
        shipping,
        tax: 0,
        total,
        currency: 'INR',
        paymentStatus: 'pending',
        fulfillmentStatus: 'pending',
        shippingAddress: {
          name: shippingAddress.name,
          street: shippingAddress.street ?? shippingAddress.addressLine1,
          city: shippingAddress.city,
          state: shippingAddress.state ?? '',
          zip: shippingAddress.zip ?? shippingAddress.postalCode ?? '',
          country: shippingAddress.country ?? 'IN',
          phone: shippingAddress.phone ?? '',
        },
      });

      // Clear cart
      await Cart.findOneAndUpdate(
        { userId, abandoned: false },
        { $set: { items: [], subtotal: 0, lastActivity: new Date() } }
      );

      // Create purchase event
      await Event.create({
        userId,
        sessionId: `order_${orderNumber}`,
        eventType: 'purchase_completed',
        source: 'web',
        timestamp: new Date(),
        metadata: { orderNumber, total, itemCount: orderItems.length },
      }).catch(() => {});

      // Update lead pipeline
      await Lead.findOneAndUpdate(
        { userId },
        {
          $set: { pipelineStage: 'closed_won', lastActiveAt: new Date() },
          $inc: { score: 30, totalSpent: total, totalOrders: 1 },
        }
      ).catch(() => {});

      logger.info(`Order created: ${orderNumber} for user ${userId}`);
      res.status(201).json({ order });
    } catch (error) {
      logger.error('Create order error:', error);
      res.status(500).json({ error: 'Failed to create order' });
    }
  }

  /** GET /api/orders — authenticated user's own orders only */
  async getUserOrders(req: any, res: Response) {
    try {
      const userId = req.user._id;
      const limit = Math.min(parseInt(String(req.query.limit ?? '20')), 100);
      const skip = parseInt(String(req.query.skip ?? '0'));

      const [orders, total] = await Promise.all([
        Order.find({ userId }).sort({ createdAt: -1 }).limit(limit).skip(skip),
        Order.countDocuments({ userId }),
      ]);

      res.json({ orders, total });
    } catch (error) {
      logger.error('Get user orders error:', error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  }

  /** GET /api/orders/:id — single order, must belong to authenticated user */
  async getOrder(req: any, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const order = await Order.findOne({ _id: id, userId });
      if (!order) return res.status(404).json({ error: 'Order not found' });

      res.json({ order });
    } catch (error) {
      logger.error('Get order error:', error);
      res.status(500).json({ error: 'Failed to fetch order' });
    }
  }
}

export const orderController = new OrderController();
