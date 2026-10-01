import { Request, Response } from 'express';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { logger } from '../config/logger.js';
import { Types } from 'mongoose';

export class CartController {
  async getCart(req: any, res: Response) {
    try {
      const userId = req.user?._id;
      const { sessionId } = req.query;

      const filter: any = { abandoned: false };
      if (userId) filter.userId = userId;
      else if (sessionId) filter.sessionId = sessionId;
      else return res.status(400).json({ error: 'User or session required' });

      const cart = await Cart.findOne(filter).populate('items.product', 'name price slug sku packSize status');
      res.json({ cart: cart || null });
    } catch (error) {
      logger.error('Get cart error:', error);
      res.status(500).json({ error: 'Failed to fetch cart' });
    }
  }

  async updateCart(req: any, res: Response) {
    try {
      const userId = req.user?._id;
      const { sessionId, items } = req.body;

      if (!items || !Array.isArray(items)) {
        return res.status(400).json({ error: 'items array required' });
      }

      // Validate products
      let subtotal = 0;
      const validatedItems = [];
      for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product || product.status === 'Archived') {
          return res.status(404).json({ error: `Product ${item.productId} not found` });
        }
        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;
        validatedItems.push({
          product: product._id,
          quantity: item.quantity,
          price: product.price
        });
      }

      const filter: any = { abandoned: false };
      if (userId) filter.userId = userId;
      else if (sessionId) filter.sessionId = sessionId;

      const cart = await Cart.findOneAndUpdate(
        filter,
        {
          $set: {
            items: validatedItems,
            subtotal,
            lastActivity: new Date(),
            ...(userId ? { userId } : { sessionId })
          }
        },
        { upsert: true, new: true }
      ).populate('items.product', 'name price slug sku packSize');

      res.json({ cart });
    } catch (error) {
      logger.error('Update cart error:', error);
      res.status(500).json({ error: 'Failed to update cart' });
    }
  }

  async clearCart(req: any, res: Response) {
    try {
      const userId = req.user?._id;
      const { sessionId } = req.body;

      const filter: any = { abandoned: false };
      if (userId) filter.userId = userId;
      else if (sessionId) filter.sessionId = sessionId;

      await Cart.findOneAndUpdate(filter, { $set: { items: [], subtotal: 0 } });
      res.json({ message: 'Cart cleared' });
    } catch (error) {
      logger.error('Clear cart error:', error);
      res.status(500).json({ error: 'Failed to clear cart' });
    }
  }

  async abandonCart(req: any, res: Response) {
    try {
      const userId = req.user?._id;
      const { sessionId } = req.body;

      const filter: any = { abandoned: false };
      if (userId) filter.userId = userId;
      else if (sessionId) filter.sessionId = sessionId;

      const cart = await Cart.findOneAndUpdate(filter, {
        $set: { abandoned: true, abandonedAt: new Date() }
      }, { new: true });

      res.json({ cart });
    } catch (error) {
      logger.error('Abandon cart error:', error);
      res.status(500).json({ error: 'Failed to abandon cart' });
    }
  }
}

export const cartController = new CartController();
