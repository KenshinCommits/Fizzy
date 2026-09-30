/**
 * Full database seed using real Fizzi frontend data.
 * Idempotent - safe to run multiple times.
 * Run: npm run seed
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';
import { logger } from '../config/logger.js';
import { migrateProducts } from '../migrations/migrateProducts.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { Order } from '../models/Order.js';
import { Lead } from '../models/Lead.js';
import { Event } from '../models/Event.js';
import { ScoreHistory } from '../models/ScoreHistory.js';
import { Conversation } from '../models/Conversation.js';
import { Cart } from '../models/Cart.js';
import { CustomerMetrics } from '../models/CustomerMetrics.js';
import { ActivityTimeline } from '../models/ActivityTimeline.js';
import { Settings } from '../models/Settings.js';
import { Types } from 'mongoose';

// ─────────────────────────────────────────────
// Real customers from existing frontend seed.ts
// ─────────────────────────────────────────────
const SEED_CUSTOMERS = [
  { id: "ruthvik", name: "Ruthvik Reddy",   email: "ruthvik@email.com",   type: "d2c",       company: "",              score: 82,  stage: "high_intent",    product: "yuzu",    orders: 4,  spent: 8940,   visits: 3,  phone: "+919876543210" },
  { id: "coastal", name: "Meera Nair",      email: "meera@company.in",    type: "wholesale", company: "Coastal Cafe",  score: 91,  stage: "bulk_quote",     product: "guava",   orders: 8,  spent: 126000, visits: 12, phone: "+919876543211" },
  { id: "priya",   name: "Priya Sharma",    email: "priya@email.com",     type: "d2c",       company: "",              score: 76,  stage: "cart_abandoned", product: "variety", orders: 2,  spent: 4298,   visits: 6,  phone: "+919876543212" },
  { id: "arjun",   name: "Arjun Mehta",     email: "arjun@email.com",     type: "d2c",       company: "",              score: 68,  stage: "qualified",      product: "cola",    orders: 3,  spent: 6197,   visits: 5,  phone: "+919876543213" },
  { id: "studio",  name: "Dev Kapoor",      email: "dev@company.in",      type: "wholesale", company: "Studio Coffee", score: 87,  stage: "negotiation",    product: "bulk",    orders: 5,  spent: 84000,  visits: 9,  phone: "+919876543214" },
  { id: "ananya",  name: "Ananya Rao",      email: "ananya@email.com",    type: "d2c",       company: "",              score: 59,  stage: "new",            product: "orange",  orders: 1,  spent: 1699,   visits: 2,  phone: "+919876543215" },
  { id: "harbor",  name: "Nikhil Shah",     email: "nikhil@company.in",   type: "wholesale", company: "The Harbor Hotel", score: 79, stage: "call_scheduled", product: "bulk", orders: 12, spent: 248000, visits: 16, phone: "+919876543216" },
  { id: "zoya",    name: "Zoya Ahmed",      email: "zoya@email.com",      type: "d2c",       company: "",              score: 42,  stage: "qualified",      product: "ginger",  orders: 2,  spent: 3398,   visits: 4,  phone: "+919876543217" },
  { id: "kabir",   name: "Kabir Sethi",     email: "kabir@email.com",     type: "d2c",       company: "",              score: 24,  stage: "new",            product: "yuzu",    orders: 0,  spent: 0,      visits: 1,  phone: "+919876543218" },
  { id: "tara",    name: "Tara Menon",      email: "tara@email.com",      type: "d2c",       company: "",              score: 94,  stage: "closed_won",     product: "variety", orders: 6,  spent: 11994,  visits: 8,  phone: "+919876543219" },
  { id: "rohan",   name: "Rohan Das",       email: "rohan@email.com",     type: "d2c",       company: "",              score: 18,  stage: "closed_lost",    product: "cola",    orders: 0,  spent: 0,      visits: 1,  phone: "+919876543220" },
  { id: "bloom",   name: "Isha Patel",      email: "isha@company.in",     type: "wholesale", company: "Bloom Kitchen", score: 72,  stage: "high_intent",    product: "guava",   orders: 3,  spent: 50400,  visits: 7,  phone: "+919876543221" },
];

const SEED_SALESPEOPLE = [
  { id: "s1", name: "Aditi Sharma",   role: "sales_rep",      email: "aditi@fizzi.in",  winRate: 32 },
  { id: "s2", name: "Karan Malhotra", role: "sales_manager",  email: "karan@fizzi.in",  winRate: 41 },
  { id: "s3", name: "Sana Khan",      role: "sales_rep",      email: "sana@fizzi.in",   winRate: 28 },
];

function nameToSlug(name: string) {
  return name.split(' ')[0].toLowerCase();
}

async function seed() {
  try {
    await connectDatabase();
    logger.info('='.repeat(60));
    logger.info('FIZZI DATABASE SEED - STARTING');
    logger.info('='.repeat(60));

    // ── Step 1: Migrate real products ────────────────────────────
    logger.info('\n[1/8] Migrating real Fizzi products...');
    const migrationResult = await migrateProducts();
    logger.info(`Products in DB: ${migrationResult.inserted} inserted, ${migrationResult.updated} updated`);

    // Build product ID lookup: legacyId → ObjectId
    const productDocs = await Product.find({});
    const productById: Record<string, Types.ObjectId> = {};
    for (const p of productDocs) {
      productById[p.legacyProductId] = p._id as Types.ObjectId;
    }
    logger.info(`Product lookup built: ${Object.keys(productById).length} products`);

    // ── Step 2: Seed admin & salespeople users ────────────────────
    logger.info('\n[2/8] Seeding admin and salespeople...');

    const adminEmail = 'admin@fizzi.in';
    let adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      adminUser = await User.create({
        email: adminEmail,
        password: 'Fizzi@Admin2026',
        firstName: 'Admin',
        lastName: 'Fizzi',
        customerType: 'd2c',
        role: 'super_admin'
      });
      logger.info('✓ Admin user created: admin@fizzi.in / Fizzi@Admin2026');
    } else {
      logger.info('✓ Admin user already exists, skipped');
    }

    // Salesperson users
    const salespersonUsers: Record<string, Types.ObjectId> = {};
    for (const sp of SEED_SALESPEOPLE) {
      let spUser = await User.findOne({ email: sp.email });
      if (!spUser) {
        spUser = await User.create({
          email: sp.email,
          password: 'Fizzi@2026',
          firstName: sp.name.split(' ')[0],
          lastName: sp.name.split(' ')[1] || '',
          customerType: 'd2c',
          role: sp.role as any
        });
        logger.info(`✓ Created salesperson: ${sp.email}`);
      }
      salespersonUsers[sp.id] = spUser._id as Types.ObjectId;
    }

    // ── Step 3: Seed customers ────────────────────────────────────
    logger.info('\n[3/8] Seeding customers...');
    const customerUsers: Record<string, Types.ObjectId> = {};

    for (const c of SEED_CUSTOMERS) {
      let user = await User.findOne({ email: c.email });
      if (!user) {
        const [firstName, ...rest] = c.name.split(' ');
        user = await User.create({
          email: c.email,
          password: 'Fizzi@2026',
          firstName,
          lastName: rest.join(' ') || 'User',
          phone: c.phone,
          customerType: c.type as any,
          role: 'customer',
          companyName: c.company || undefined
        });
        logger.info(`✓ Created customer: ${c.email}`);
      } else {
        logger.info(`- Skipped existing customer: ${c.email}`);
      }
      customerUsers[c.id] = user._id as Types.ObjectId;
    }

    // ── Step 4: Seed leads ────────────────────────────────────────
    logger.info('\n[4/8] Seeding leads & customer metrics...');

    for (const c of SEED_CUSTOMERS) {
      const userId = customerUsers[c.id];
      const currentProductId = productById[c.product];

      // Lead
      let lead = await Lead.findOne({ userId });
      if (!lead) {
        lead = await Lead.create({
          userId,
          score: c.score,
          intentLevel: c.score >= 80 ? 'very_high' : c.score >= 60 ? 'high' : c.score >= 30 ? 'medium' : 'low',
          pipelineStage: c.stage,
          currentProduct: currentProductId,
          currentProductName: productDocs.find(p => p.legacyProductId === c.product)?.name || c.product,
          productViewCount: 4 + Math.floor(Math.random() * 10),
          pricingViewCount: 2,
          visitCount: c.visits,
          totalTimeSpent: 1662 + Math.floor(Math.random() * 1000),
          averageSessionDuration: 554,
          cartValue: c.stage === 'cart_abandoned' ? 1899 : 0,
          cartAbandoned: c.stage === 'cart_abandoned',
          totalOrders: c.orders,
          totalSpent: c.spent,
          favoriteProducts: [productDocs.find(p => p.legacyProductId === c.product)?.name || c.product],
          lastActiveAt: new Date(),
          firstSeenAt: new Date(Date.now() - c.visits * 24 * 60 * 60 * 1000),
          nextBestAction: c.type === 'wholesale' ? 'Contact wholesale buyer' : c.stage === 'cart_abandoned' ? 'Trigger abandoned-cart recovery' : 'Start product conversation',
          triggerReason: c.score >= 80 ? 'Repeated product interest' : c.stage === 'cart_abandoned' ? 'High-value abandoned cart' : 'High purchase intent'
        });
        logger.info(`✓ Lead created for ${c.name}`);
      }

      // CustomerMetrics
      const existingMetrics = await CustomerMetrics.findOne({ userId });
      if (!existingMetrics) {
        await CustomerMetrics.create({
          userId,
          totalVisits: c.visits,
          totalTimeSeconds: 1662 + Math.floor(Math.random() * 500),
          averageSessionSeconds: 554,
          totalPageViews: c.visits * 4,
          totalProductViews: 4 + Math.floor(Math.random() * 8),
          uniqueProductsViewed: 2,
          pricingViews: 2,
          cartInteractions: c.stage === 'cart_abandoned' ? 2 : 1,
          checkoutAttempts: c.stage === 'cart_abandoned' ? 1 : c.orders > 0 ? 1 : 0,
          totalOrders: c.orders,
          totalSpent: c.spent,
          averageOrderValue: c.orders > 0 ? Math.round(c.spent / c.orders) : 0,
          mostViewedProducts: currentProductId ? [{ productId: currentProductId, viewCount: 4 }] : [],
          favoriteProducts: currentProductId ? [{ productId: currentProductId, count: c.orders }] : [],
          firstSeenAt: new Date(Date.now() - c.visits * 24 * 60 * 60 * 1000),
          lastActiveAt: new Date()
        });
      }
    }

    // ── Step 5: Seed orders ───────────────────────────────────────
    logger.info('\n[5/8] Seeding real orders from frontend data...');

    const rawOrders = [
      { id: "FZ-2048", customerId: "ruthvik",  productIds: ["yuzu"],              qtys: [1], amount: 1899,  status: "pending",    payment: "paid",    date: "2026-09-30" },
      { id: "FZ-2047", customerId: "coastal",  productIds: ["bulk"],              qtys: [50], amount: 42000, status: "shipped",   payment: "paid",    date: "2026-09-30" },
      { id: "FZ-2046", customerId: "tara",     productIds: ["variety"],           qtys: [1], amount: 1999,  status: "delivered",  payment: "paid",    date: "2026-09-29" },
      { id: "FZ-2045", customerId: "priya",    productIds: ["orange", "cola"],    qtys: [1, 1], amount: 3298, status: "delivered", payment: "paid",   date: "2026-09-28" },
      { id: "FZ-2044", customerId: "arjun",    productIds: ["cola"],              qtys: [2], amount: 3198,  status: "pending",    payment: "paid",    date: "2026-09-28" },
      { id: "FZ-2043", customerId: "studio",   productIds: ["bulk"],              qtys: [25], amount: 21000, status: "pending",   payment: "pending", date: "2026-09-27" },
      { id: "FZ-2042", customerId: "ruthvik",  productIds: ["yuzu"],              qtys: [1], amount: 1899,  status: "delivered",  payment: "paid",    date: "2026-09-24" },
      { id: "FZ-2041", customerId: "rohan",    productIds: ["cola"],              qtys: [1], amount: 1599,  status: "cancelled",  payment: "pending", date: "2026-09-22" },
    ];

    for (const rawOrder of rawOrders) {
      const existing = await Order.findOne({ orderNumber: rawOrder.id });
      if (existing) {
        logger.info(`- Order ${rawOrder.id} already exists, skipped`);
        continue;
      }

      const userId = customerUsers[rawOrder.customerId];
      const items = [];
      let subtotal = 0;

      for (let i = 0; i < rawOrder.productIds.length; i++) {
        const prod = productDocs.find(p => p.legacyProductId === rawOrder.productIds[i]);
        if (!prod) continue;
        const qty = rawOrder.qtys[i];
        const total = prod.price * qty;
        subtotal += total;
        items.push({
          product: prod._id,
          productName: prod.name,
          productSku: prod.sku,
          quantity: qty,
          price: prod.price,
          total
        });
      }

      const address = rawOrder.customerId === 'ruthvik' ? '14, Indiranagar, Bengaluru, Karnataka 560038'
        : rawOrder.customerId === 'coastal' ? 'Coastal Cafe, 21 Beach Road, Chennai, Tamil Nadu 600001'
        : rawOrder.customerId === 'tara' ? '8, Jubilee Hills, Hyderabad, Telangana 500033'
        : rawOrder.customerId === 'priya' ? '42, Koramangala, Bengaluru, Karnataka 560034'
        : rawOrder.customerId === 'arjun' ? '17, Bandra West, Mumbai, Maharashtra 400050'
        : rawOrder.customerId === 'studio' ? 'Studio Coffee, 12 Church Street, Bengaluru 560001'
        : '9, Salt Lake, Kolkata 700091';

      const [firstName, ...rest] = SEED_CUSTOMERS.find(c => c.id === rawOrder.customerId)?.name.split(' ') || ['Customer', ''];

      await Order.create({
        userId,
        orderNumber: rawOrder.id,
        items,
        subtotal,
        discount: rawOrder.id === 'FZ-2045' ? 200 : 0,
        shipping: 0,
        tax: Math.round(subtotal * 0.05),
        total: rawOrder.amount,
        currency: 'INR',
        paymentStatus: rawOrder.payment,
        fulfillmentStatus: rawOrder.status,
        shippingAddress: {
          name: `${firstName} ${rest.join(' ')}`.trim(),
          street: address.split(',')[0]?.trim() || '123 Main St',
          city: address.split(',')[1]?.trim() || 'Bengaluru',
          state: address.split(',')[2]?.trim() || 'Karnataka',
          zip: address.match(/\d{6}/)?.[0] || '560001',
          country: 'India',
          phone: SEED_CUSTOMERS.find(c => c.id === rawOrder.customerId)?.phone || ''
        },
        createdAt: new Date(rawOrder.date)
      });
      logger.info(`✓ Order ${rawOrder.id} created`);
    }

    // ── Step 6: Seed events ───────────────────────────────────────
    logger.info('\n[6/8] Seeding events from frontend data...');

    const rawEvents = [
      { id: "e1", customerId: "ruthvik", type: "product_viewed",    productId: "yuzu",    ts: "2026-09-30T10:42:08+05:30" },
      { id: "e2", customerId: "coastal", type: "bulk_quote_submitted", productId: "guava", ts: "2026-09-30T10:39:14+05:30" },
      { id: "e3", customerId: "priya",   type: "cart_abandoned",    productId: "variety", ts: "2026-09-30T10:35:32+05:30" },
      { id: "e4", customerId: "arjun",   type: "pricing_viewed",    productId: "cola",    ts: "2026-09-30T10:31:22+05:30" },
      { id: "e5", customerId: "ruthvik", type: "voice_agent_completed", productId: "yuzu", ts: "2026-09-30T10:26:18+05:30" },
      { id: "e6", customerId: "ruthvik", type: "checkout_started",  productId: "yuzu",    ts: "2026-09-30T10:22:00+05:30" },
      { id: "e7", customerId: "ruthvik", type: "cart_updated",      productId: "yuzu",    ts: "2026-09-30T10:20:00+05:30" },
      { id: "e8", customerId: "ruthvik", type: "user_logged_in",    productId: "yuzu",    ts: "2026-09-30T10:15:00+05:30" },
    ];

    for (const e of rawEvents) {
      const existing = await Event.findOne({ 'metadata.legacyEventId': e.id });
      if (existing) { logger.info(`- Event ${e.id} already exists, skipped`); continue; }

      await Event.create({
        userId: customerUsers[e.customerId],
        sessionId: `seed_session_${e.customerId}`,
        eventType: e.type as any,
        productId: productById[e.productId],
        source: 'web',
        timestamp: new Date(e.ts),
        metadata: {
          legacyEventId: e.id,
          productName: productDocs.find(p => p.legacyProductId === e.productId)?.name
        }
      });
      logger.info(`✓ Event ${e.id} created`);
    }

    // ── Step 7: Score history for Ruthvik ─────────────────────────
    logger.info('\n[7/8] Seeding score history...');

    const ruthvikLead = await Lead.findOne({ userId: customerUsers['ruthvik'] });
    if (ruthvikLead) {
      const rawScores = [
        { delta: 32, reason: "Opening score from earlier activity",     ts: "2026-09-27T09:00:00+05:30" },
        { delta: 15, reason: "Viewed pricing twice · legacy rule v1",   ts: "2026-09-28T10:00:00+05:30" },
        { delta: 12, reason: "Viewed Yuzu Citrus four times",            ts: "2026-09-28T11:00:00+05:30" },
        { delta: 20, reason: "Started checkout",                         ts: "2026-09-28T12:00:00+05:30" },
        { delta: 8,  reason: "Returning customer",                       ts: "2026-09-28T13:00:00+05:30" },
        { delta: -5, reason: "No activity for two days",                 ts: "2026-09-30T09:00:00+05:30" },
      ];

      let runningScore = 0;
      for (const s of rawScores) {
        const prev = runningScore;
        runningScore = Math.max(0, Math.min(100, runningScore + s.delta));

        const existing = await ScoreHistory.findOne({
          leadId: ruthvikLead._id,
          reason: s.reason
        });
        if (!existing) {
          await ScoreHistory.create({
            leadId: ruthvikLead._id,
            userId: customerUsers['ruthvik'],
            previousScore: prev,
            change: s.delta,
            newScore: runningScore,
            reason: s.reason,
            timestamp: new Date(s.ts)
          });
        }
      }
      logger.info('✓ Score history seeded for Ruthvik');
    }

    // ── Step 8: Conversations & Settings ─────────────────────────
    logger.info('\n[8/8] Seeding conversations and settings...');

    const conv1Exists = await Conversation.findOne({ conversationId: 'seed_conv_ruthvik_1' });
    if (!conv1Exists) {
      const ruthvikLead2 = await Lead.findOne({ userId: customerUsers['ruthvik'] });
      await Conversation.create({
        conversationId: 'seed_conv_ruthvik_1',
        userId: customerUsers['ruthvik'],
        leadId: ruthvikLead2?._id,
        retellCallId: 'seed_call_ruthvik_1',
        direction: 'outbound',
        triggerReason: 'Repeated product interest',
        startedAt: new Date('2026-09-30T10:22:00+05:30'),
        endedAt: new Date('2026-09-30T10:26:21+05:30'),
        durationSeconds: 261,
        status: 'completed',
        transcript: [
          { role: 'agent',    content: 'Hi Ruthvik. Would you like help choosing a Yuzu Citrus pack?', timestamp: new Date('2026-09-30T10:22:01+05:30') },
          { role: 'customer', content: 'I liked it last time. Is there a better price for a full pack?', timestamp: new Date('2026-09-30T10:22:24+05:30') },
          { role: 'agent',    content: 'The 12-pack is ₹1,899, which works out to ₹158.25 per can. Shipping is included for this order.', timestamp: new Date('2026-09-30T10:22:51+05:30') },
          { role: 'customer', content: 'That works. I will add the 12-pack.', timestamp: new Date('2026-09-30T10:23:18+05:30') },
          { role: 'agent',    content: 'You can select the 12-pack on the product page. I am here if you need anything else.', timestamp: new Date('2026-09-30T10:23:31+05:30') }
        ],
        summary: 'Customer Ruthvik asked about Yuzu Citrus pricing. Agent confirmed ₹1,899 for 12-pack with free shipping. Customer added to cart.',
        intentBefore: 'medium',
        intentAfter: 'high',
        scoreBefore: 64,
        scoreAfter: 82,
        productInterest: ['Yuzu Citrus'],
        purchaseIntent: true,
        recommendedAction: 'Follow up if cart not checked out within 24h',
        outcome: 'cart_updated'
      });
      logger.info('✓ Conversation seeded for Ruthvik');
    }

    // Settings
    const settingsExist = await Settings.findOne();
    if (!settingsExist) {
      await Settings.create({
        scoringRules: [
          { eventType: 'product_viewed', scoreChange: 3, description: 'Customer explores a product' },
          { eventType: 'repeated_product_view', scoreChange: 8, description: 'Viewed same product multiple times' },
          { eventType: 'pricing_viewed', scoreChange: 10, description: 'Customer checks pricing or pack options' },
          { eventType: 'wishlist_added', scoreChange: 5, description: 'Product added to wishlist' },
          { eventType: 'cart_created', scoreChange: 15, description: 'Product added to cart' },
          { eventType: 'cart_updated', scoreChange: 15, description: 'Cart updated with product' },
          { eventType: 'checkout_started', scoreChange: 20, description: 'Customer starts checkout process' },
          { eventType: 'purchase_completed', scoreChange: 30, description: 'Customer completes a purchase' },
          { eventType: 'wholesale_pricing_viewed', scoreChange: 15, description: 'Viewed wholesale pricing' },
          { eventType: 'bulk_quote_submitted', scoreChange: 25, description: 'Submitted wholesale bulk quote' },
          { eventType: 'high_value_cart', scoreChange: 10, description: 'Cart value above threshold' },
          { eventType: 'cart_abandoned', scoreChange: -5, description: 'Checkout left incomplete' }
        ],
        cartAbandonmentThresholdMinutes: 30,
        cartAbandonmentMinValue: 500,
        highIntentScoreThreshold: 60,
        veryHighIntentScoreThreshold: 80,
        stalledLeadDays: 7,
        cooldownMinutes: 60
      });
      logger.info('✓ Settings seeded');
    }

    // ── Summary ──────────────────────────────────────────────────
    logger.info('\n' + '='.repeat(60));
    logger.info('SEED COMPLETE');
    logger.info('='.repeat(60));
    logger.info(`Products:      ${await Product.countDocuments()}`);
    logger.info(`Users:         ${await User.countDocuments()}`);
    logger.info(`Orders:        ${await Order.countDocuments()}`);
    logger.info(`Leads:         ${await Lead.countDocuments()}`);
    logger.info(`Events:        ${await Event.countDocuments()}`);
    logger.info(`ScoreHistory:  ${await ScoreHistory.countDocuments()}`);
    logger.info(`Conversations: ${await Conversation.countDocuments()}`);
    logger.info('');
    logger.info('Admin login: admin@fizzi.in / Fizzi@Admin2026');
    logger.info('Customer login example: ruthvik@email.com / Fizzi@2026');
    logger.info('='.repeat(60));

    process.exit(0);
  } catch (error) {
    logger.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
