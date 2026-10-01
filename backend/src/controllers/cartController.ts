import { Response } from 'express';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { Event } from '../models/Event.js';
import { logger } from '../config/logger.js';

// All methods use req.user._id exclusively — never trust userId from the request body/query.

export class CartController {
  /** GET /api/cart — return the authenticated user's active cart */
  async getCart(req: any, res: Response) {
    try {
      const userId = req.user._id;
      const cart = await Cart.findOne({ userId, abandoned: false })
        .populate('items.product', 'name price slug sku packSize images tone legacyProductId status');
      res.json({ cart: cart || { userId, items: [], subtotal: 0 } });
    } catch (error) {
      logger.error('Get cart error:', error);
      res.status(500).json({ error: 'Failed to fetch cart' });
    }
  }

  /** POST /api/cart/items — add one product or increment quantity */
  async addItem(req: any, res: Response) {
    try {
      const userId = req.user._id;
      const { productId, quantity = 1 } = req.body;

      if (!productId) return res.status(400).json({ error: 'productId is required' });
      if (typeof quantity !== 'number' || quantity < 1) {
        return res.status(400).json({ error: 'quantity must be a positive number' });
      }

      // Authoritative product lookup — never trust frontend price
      const product = await Product.findById(productId);
      if (!product || product.status === 'Archived') {
        return res.status(404).json({ error: 'Product not found or unavailable' });
      }
      if (product.stock !== undefined && product.stock < quantity) {
        return res.status(409).json({ error: 'Insufficient stock' });
      }

      let cart = await Cart.findOne({ userId, abandoned: false });

      if (!cart) {
        cart = await Cart.create({
          userId,
          items: [{ product: product._id, quantity, price: product.price }],
          subtotal: product.price * quantity,
          lastActivity: new Date(),
        });
      } else {
        const existing = cart.items.find(
          (i) => i.product.toString() === product._id.toString()
        );
        if (existing) {
          existing.quantity += quantity;
        } else {
          cart.items.push({ product: product._id, quantity, price: product.price });
        }
        cart.subtotal = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        cart.lastActivity = new Date();
        await cart.save();
      }

      // Fire cart_updated event
      await Event.create({
        userId,
        sessionId: `cart_${userId}_${Date.now()}`,
        eventType: 'cart_updated',
        productId: product._id,
        source: 'web',
        timestamp: new Date(),
        metadata: { action: 'add', quantity, productName: product.name },
      }).catch(() => {}); // Non-blocking

      const populated = await cart.populate('items.product', 'name price slug sku packSize images tone legacyProductId status');
      res.json({ cart: populated });
    } catch (error) {
      logger.error('Add item error:', error);
      res.status(500).json({ error: 'Failed to add item to cart' });
    }
  }

  /** PATCH /api/cart/items/:productId — set exact quantity (0 = remove) */
  async updateItem(req: any, res: Response) {
    try {
      const userId = req.user._id;
      const { productId } = req.params;
      const { quantity } = req.body;

      if (typeof quantity !== 'number' || quantity < 0) {
        return res.status(400).json({ error: 'quantity must be a non-negative number' });
      }

      const cart = await Cart.findOne({ userId, abandoned: false });
      if (!cart) return res.status(404).json({ error: 'Cart not found' });

      if (quantity === 0) {
        cart.items = cart.items.filter((i) => i.product.toString() !== productId);
      } else {
        const item = cart.items.find((i) => i.product.toString() === productId);
        if (!item) return res.status(404).json({ error: 'Item not in cart' });
        item.quantity = quantity;
      }

      cart.subtotal = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      cart.lastActivity = new Date();
      await cart.save();

      const populated = await cart.populate('items.product', 'name price slug sku packSize images tone legacyProductId status');
      res.json({ cart: populated });
    } catch (error) {
      logger.error('Update item error:', error);
      res.status(500).json({ error: 'Failed to update cart item' });
    }
  }

  /** DELETE /api/cart/items/:productId — remove a single product */
  async removeItem(req: any, res: Response) {
    try {
      const userId = req.user._id;
      const { productId } = req.params;

      const cart = await Cart.findOne({ userId, abandoned: false });
      if (!cart) return res.status(404).json({ error: 'Cart not found' });

      const before = cart.items.length;
      cart.items = cart.items.filter((i) => i.product.toString() !== productId);
      if (cart.items.length === before) {
        return res.status(404).json({ error: 'Item not in cart' });
      }

      cart.subtotal = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      cart.lastActivity = new Date();
      await cart.save();

      // Fire event
      await Event.create({
        userId,
        sessionId: `cart_${userId}_${Date.now()}`,
        eventType: 'cart_item_removed',
        productId,
        source: 'web',
        timestamp: new Date(),
      }).catch(() => {});

      const populated = await cart.populate('items.product', 'name price slug sku packSize images tone legacyProductId status');
      res.json({ cart: populated });
    } catch (error) {
      logger.error('Remove item error:', error);
      res.status(500).json({ error: 'Failed to remove item' });
    }
  }

  /** DELETE /api/cart — empty the cart (keeps the cart document) */
  async clearCart(req: any, res: Response) {
    try {
      const userId = req.user._id;
      await Cart.findOneAndUpdate(
        { userId, abandoned: false },
        { $set: { items: [], subtotal: 0, lastActivity: new Date() } }
      );
      res.json({ message: 'Cart cleared' });
    } catch (error) {
      logger.error('Clear cart error:', error);
      res.status(500).json({ error: 'Failed to clear cart' });
    }
  }
}

export const cartController = new CartController();
