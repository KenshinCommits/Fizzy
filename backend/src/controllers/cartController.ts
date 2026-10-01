import { Request, Response } from 'express';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { logger } from '../config/logger.js';
import { Types } from 'mongoose';
import { Event } from '../models/Event.js';
import { eventProcessingService } from '../services/eventProcessingService.js';

export class CartController {
  async getCart(req: any, res: Response) {
    try {
      const userId = req.user?._id;
      const { sessionId } = req.query;

      if (!userId) return res.status(401).json({ error: 'Authentication required' });
      const filter: any = { userId, status: 'active' };

      const cart = await Cart.findOne(filter).populate('items.productId', 'name price slug sku packSize status stock');
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

  async addItem(req: any, res: Response) {
    try {
      const { productId, variantId, quantity = 1 } = req.body;
      const requested = Number(quantity);
      if (!Types.ObjectId.isValid(productId) || !Number.isInteger(requested) || requested < 1) {
        return res.status(400).json({ error: 'A valid productId and positive integer quantity are required' });
      }
      const product = await Product.findById(productId);
      if (!product || product.status !== 'Active') return res.status(404).json({ error: 'Product not found' });
      if (product.stock <= 0) return res.status(409).json({ success: false, code: 'OUT_OF_STOCK', message: 'This product is currently unavailable.' });

      let cart = await Cart.findOne({ userId: req.user._id, status: 'active' });
      if (!cart) cart = await Cart.create({ userId: req.user._id, items: [], subtotal: 0, status: 'active', lastActivityAt: new Date() });
      const item = cart.items.find((entry: any) => entry.productId?.equals(product._id) && (entry.variantId || '') === (variantId || ''));
      const nextQuantity = (item?.quantity || 0) + requested;
      if (nextQuantity > product.stock) return res.status(409).json({ success: false, code: 'INSUFFICIENT_INVENTORY', message: `Only ${product.stock} available.` });
      if (item) item.quantity = nextQuantity;
      else cart.items.push({ productId: product._id, variantId, quantity: requested, unitPrice: product.price } as any);
      cart.subtotal = cart.items.reduce((sum: number, entry: any) => sum + entry.quantity * entry.unitPrice, 0);
      cart.lastActivityAt = new Date();
      await cart.save();

      const event = await Event.create({ userId: req.user._id, sessionId: req.headers['x-session-id'] || `user_${req.user._id}`, eventType: 'cart_updated', productId: product._id, source: 'web', metadata: { action: 'add', quantity: requested, cartValue: cart.subtotal, productName: product.name }, timestamp: new Date() });
      void eventProcessingService.processEvent(event);
      await cart.populate('items.productId', 'name price slug sku packSize status stock tone images currency description');
      res.json({ success: true, cart });
    } catch (error) { logger.error('Add cart item error:', error); res.status(500).json({ error: 'Failed to add item to cart' }); }
  }

  async updateItem(req: any, res: Response) {
    try {
      const requested = Number(req.body.quantity);
      if (!Types.ObjectId.isValid(req.params.productId) || !Number.isInteger(requested) || requested < 1) return res.status(400).json({ error: 'A positive integer quantity is required' });
      const [product, cart] = await Promise.all([Product.findById(req.params.productId), Cart.findOne({ userId: req.user._id, status: 'active' })]);
      if (!product || product.status !== 'Active') return res.status(404).json({ error: 'Product not found' });
      if (!cart) return res.status(404).json({ error: 'Cart not found' });
      if (requested > product.stock) return res.status(409).json({ success: false, code: 'INSUFFICIENT_INVENTORY', message: `Only ${product.stock} available.` });
      const item = cart.items.find((entry: any) => entry.productId?.equals(product._id) && (entry.variantId || '') === (req.body.variantId || ''));
      if (!item) return res.status(404).json({ error: 'Cart item not found' });
      item.quantity = requested; item.unitPrice = product.price;
      cart.subtotal = cart.items.reduce((sum: number, entry: any) => sum + entry.quantity * entry.unitPrice, 0);
      cart.lastActivityAt = new Date(); await cart.save(); await cart.populate('items.productId', 'name price slug sku packSize status stock');
      res.json({ success: true, cart });
    } catch (error) { logger.error('Update cart item error:', error); res.status(500).json({ error: 'Failed to update cart item' }); }
  }

  async removeItem(req: any, res: Response) {
    try {
      const cart = await Cart.findOne({ userId: req.user._id, status: 'active' });
      if (!cart) return res.status(404).json({ error: 'Cart not found' });
      cart.items = cart.items.filter((entry: any) => !entry.productId?.equals(req.params.productId));
      cart.subtotal = cart.items.reduce((sum: number, entry: any) => sum + entry.quantity * entry.unitPrice, 0);
      cart.lastActivityAt = new Date(); await cart.save(); await cart.populate('items.productId', 'name price slug sku packSize status stock');
      res.json({ success: true, cart });
    } catch (error) { logger.error('Remove cart item error:', error); res.status(500).json({ error: 'Failed to remove cart item' }); }
  }

  async clearCart(req: any, res: Response) {
    try {
      const userId = req.user?._id;
      const { sessionId } = req.body;

      const filter: any = { userId, status: 'active' };

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

      const filter: any = { userId, status: 'active' };

      const cart = await Cart.findOneAndUpdate(filter, {
        $set: { status: 'abandoned', abandonedAt: new Date(), lastActivityAt: new Date() }
      }, { new: true });

      res.json({ cart });
    } catch (error) {
      logger.error('Abandon cart error:', error);
      res.status(500).json({ error: 'Failed to abandon cart' });
    }
  }
}

export const cartController = new CartController();
