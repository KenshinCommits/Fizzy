import { Response } from 'express';
import { randomUUID } from 'crypto';
import { Conversation } from '../models/Conversation.js';
import { Event } from '../models/Event.js';
import { Order } from '../models/Order.js';
import { Cart } from '../models/Cart.js';
import { searchProducts } from '../services/product-search.service.js';

const record = (userId: any, sessionId: string, eventType: string, metadata: Record<string, unknown> = {}, productId?: any) => Event.create({ userId, sessionId, eventType, source: 'fulky', metadata, productId, timestamp: new Date() } as any);
const intentWords = ['fruity', 'refreshing', 'citrusy', 'sweet', 'light', 'bold', 'energizing', 'party', 'summer', 'casual', 'premium', 'wholesale'];

export class FulkyController {
  async open(req: any, res: Response) {
    const user = req.user;
    const conversation = await Conversation.create({ conversationId: `fulky_${randomUUID()}`, userId: user._id, direction: 'inbound', triggerReason: 'Fulky opened', startedAt: new Date(), status: 'active', transcript: [{ role: 'agent', content: `Hey${user.firstName ? ` ${user.firstName}` : ''}! I'm Fulky. What are we looking for today?`, timestamp: new Date() }], metadata: { channel: 'storefront' } });
    await record(user._id, conversation.conversationId, 'fulky_opened');
    res.status(201).json({ conversationId: conversation.conversationId, greeting: conversation.transcript?.[0].content });
  }

  async context(req: any, res: Response) {
    const user = req.user;
    const [cart, lastOrder] = await Promise.all([Cart.findOne({ userId: user._id, status: 'active' }).populate('items.productId', 'name price packSize'), Order.findOne({ userId: user._id }).sort({ createdAt: -1 })]);
    res.json({ customer: { firstName: user.firstName, customerType: user.customerType }, cart: cart ? { items: cart.items, subtotal: cart.subtotal } : null, lastOrder: lastOrder ? { orderNumber: lastOrder.orderNumber, items: lastOrder.items.map(item => ({ name: item.productName, quantity: item.quantity })) } : null });
  }

  async message(req: any, res: Response) {
    const { conversationId, text } = req.body;
    if (!conversationId || !text?.trim()) return res.status(400).json({ error: 'conversationId and text are required' });
    const conversation = await Conversation.findOne({ conversationId, userId: req.user._id });
    if (!conversation) return res.status(404).json({ error: 'Fulky session not found' });
    const lower = String(text).toLowerCase();
    conversation.transcript?.push({ role: 'customer', content: text.trim(), timestamp: new Date() });
    let products: any[] = [];
    let reply = '';
    if (/where.*order|previous order|last order|what.*order/.test(lower)) {
      const order = await Order.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
      reply = order ? `Your latest order was ${order.orderNumber}: ${order.items.map(item => `${item.productName} ×${item.quantity}`).join(', ')}.` : "I can't find a previous order yet. Want help choosing your first case?";
      await record(req.user._id, conversationId, 'fulky_order_assistance');
    } else if (/what should i drink|don't know|dont know/.test(lower)) {
      reply = 'What kind of mood are we in today? Something fruity and refreshing, bold and fizzy, or a little more chill?';
    } else {
      const moods = intentWords.filter(word => lower.includes(word));
      products = await searchProducts({ query: text, mood: moods.join(' '), tags: moods, availableOnly: true });
      if (!products.length && moods.length) products = await searchProducts({ tags: moods, availableOnly: true });
      reply = products.length ? `I found ${products.length === 1 ? 'a great match' : 'a few live matches'} from the Fizzi fridge. ${products[0].name} looks like a good fit based on what you said.` : "I couldn't find an available match for that right now. Want to try a flavor, mood, or price range?";
      if (products.length) await record(req.user._id, conversationId, 'fulky_product_recommended', { query: text }, products[0]._id);
    }
    conversation.transcript?.push({ role: 'agent', content: reply, timestamp: new Date() });
    await conversation.save();
    await record(req.user._id, conversationId, 'fulky_message_sent', { length: text.length });
    res.json({ reply, products, conversationId });
  }

  async close(req: any, res: Response) {
    const conversation = await Conversation.findOneAndUpdate({ conversationId: req.params.conversationId, userId: req.user._id }, { $set: { status: 'completed', endedAt: new Date() } }, { new: true });
    if (!conversation) return res.status(404).json({ error: 'Fulky session not found' });
    await record(req.user._id, conversation.conversationId, 'fulky_closed');
    res.json({ conversation });
  }
}
export const fulkyController = new FulkyController();
