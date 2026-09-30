import mongoose from 'mongoose';
import { config } from '../config/index.js';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { Lead } from '../models/Lead.js';
import { Event } from '../models/Event.js';
import { ScoreHistory } from '../models/ScoreHistory.js';
import { Conversation } from '../models/Conversation.js';
import { Settings } from '../models/Settings.js';
import { logger } from '../config/logger.js';

const FIZZI_PRODUCTS = [
  {
    name: 'Yuzu Citrus',
    slug: 'yuzu-citrus',
    description: 'Refreshing yuzu citrus flavor with a crisp finish',
    category: 'Soda',
    images: ['/products/yuzu-citrus.jpg'],
    price: 8.99,
    compareAtPrice: 12.99,
    currency: 'USD',
    sku: 'FIZZI-YUZU-001',
    packSize: '12-pack',
    ingredients: ['Carbonated Water', 'Yuzu Extract', 'Natural Flavors', 'Citric Acid'],
    tags: ['citrus', 'bestseller', 'refreshing'],
    inventory: 500,
    wholesaleAvailable: true,
    wholesalePrice: 6.99,
    minWholesaleQuantity: 10,
    status: 'active'
  },
  {
    name: 'Passionfruit Guava',
    slug: 'passionfruit-guava',
    description: 'Tropical blend of passionfruit and guava',
    category: 'Soda',
    images: ['/products/passionfruit-guava.jpg'],
    price: 8.99,
    compareAtPrice: 12.99,
    currency: 'USD',
    sku: 'FIZZI-PASSION-001',
    packSize: '12-pack',
    ingredients: ['Carbonated Water', 'Passionfruit Extract', 'Guava Extract', 'Natural Flavors'],
    tags: ['tropical', 'exotic', 'fruity'],
    inventory: 450,
    wholesaleAvailable: true,
    wholesalePrice: 6.99,
    minWholesaleQuantity: 10,
    status: 'active'
  },
  {
    name: 'Blood Orange',
    slug: 'blood-orange',
    description: 'Bold blood orange flavor with citrus notes',
    category: 'Soda',
    images: ['/products/blood-orange.jpg'],
    price: 8.99,
    currency: 'USD',
    sku: 'FIZZI-ORANGE-001',
    packSize: '12-pack',
    ingredients: ['Carbonated Water', 'Blood Orange Extract', 'Natural Flavors'],
    tags: ['citrus', 'bold'],
    inventory: 400,
    wholesaleAvailable: true,
    wholesalePrice: 6.99,
    minWholesaleQuantity: 10,
    status: 'active'
  },
  {
    name: 'Botanical Summer Cola',
    slug: 'botanical-summer-cola',
    description: 'Summer cola with botanical infusions',
    category: 'Soda',
    images: ['/products/botanical-cola.jpg'],
    price: 9.99,
    currency: 'USD',
    sku: 'FIZZI-COLA-001',
    packSize: '12-pack',
    ingredients: ['Carbonated Water', 'Cola Extract', 'Botanical Blend', 'Natural Flavors'],
    tags: ['cola', 'botanical', 'unique'],
    inventory: 350,
    wholesaleAvailable: true,
    wholesalePrice: 7.99,
    minWholesaleQuantity: 10,
    status: 'active'
  },
  {
    name: 'Ginger Lime Fizz',
    slug: 'ginger-lime-fizz',
    description: 'Spicy ginger with zesty lime',
    category: 'Soda',
    images: ['/products/ginger-lime.jpg'],
    price: 8.99,
    currency: 'USD',
    sku: 'FIZZI-GINGER-001',
    packSize: '12-pack',
    ingredients: ['Carbonated Water', 'Ginger Extract', 'Lime Juice', 'Natural Flavors'],
    tags: ['ginger', 'lime', 'spicy'],
    inventory: 300,
    wholesaleAvailable: true,
    wholesalePrice: 6.99,
    minWholesaleQuantity: 10,
    status: 'active'
  }
];

async function seed() {
  try {
    await mongoose.connect(config.mongoUri);
    logger.info('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Lead.deleteMany({});
    await Event.deleteMany({});
    await ScoreHistory.deleteMany({});
    await Conversation.deleteMany({});
    await Settings.deleteMany({});

    logger.info('Cleared existing data');

    // Create admin user
    const admin = await User.create({
      email: 'admin@fizzi.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'super_admin',
      customerType: 'd2c'
    });

    logger.info('Admin user created');

    // Create products
    const products = await Product.insertMany(FIZZI_PRODUCTS);
    logger.info(`${products.length} products created`);

    // Create customers
    const customers = [];
    const customerNames = [
      { firstName: 'Ruthvik', lastName: 'Kumar', email: 'ruthvik@example.com' },
      { firstName: 'Vinay', lastName: 'Reddy', email: 'vinay@example.com' },
      { firstName: 'Sarah', lastName: 'Johnson', email: 'sarah@example.com' },
      { firstName: 'Michael', lastName: 'Chen', email: 'michael@example.com' },
      { firstName: 'Emma', lastName: 'Williams', email: 'emma@example.com' },
      { firstName: 'James', lastName: 'Brown', email: 'james@example.com' },
      { firstName: 'Sophia', lastName: 'Davis', email: 'sophia@example.com' },
      { firstName: 'Oliver', lastName: 'Garcia', email: 'oliver@example.com' },
      { firstName: 'Ava', lastName: 'Martinez', email: 'ava@example.com' },
      { firstName: 'Liam', lastName: 'Rodriguez', email: 'liam@example.com' }
    ];

    for (const name of customerNames) {
      const customer = await User.create({
        ...name,
        password: 'password123',
        phone: `+1555${Math.floor(Math.random() * 10000000)}`,
        customerType: Math.random() > 0.7 ? 'b2b' : 'd2c',
        role: 'customer'
      });
      customers.push(customer);
    }

    logger.info(`${customers.length} customers created`);

    // Create orders
    let orderCount = 0;
    for (let i = 0; i < 30; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const productCount = Math.floor(Math.random() * 3) + 1;
      const orderProducts = [];
      let subtotal = 0;

      for (let j = 0; j < productCount; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const total = product.price * quantity;
        subtotal += total;

        orderProducts.push({
          product: product._id,
          productName: product.name,
          productSku: product.sku,
          quantity,
          price: product.price,
          total
        });
      }

      await Order.create({
        userId: customer._id,
        orderNumber: `ORD-${Date.now()}-${i}`,
        items: orderProducts,
        subtotal,
        discount: 0,
        shipping: 5.99,
        tax: subtotal * 0.08,
        total: subtotal + 5.99 + (subtotal * 0.08),
        currency: 'USD',
        paymentStatus: 'paid',
        fulfillmentStatus: ['pending', 'confirmed', 'shipped', 'delivered'][Math.floor(Math.random() * 4)],
        shippingAddress: {
          name: `${customer.firstName} ${customer.lastName}`,
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zip: '10001',
          country: 'USA',
          phone: customer.phone || ''
        }
      });
      orderCount++;
    }

    logger.info(`${orderCount} orders created`);

    // Create events and leads
    for (const customer of customers.slice(0, 5)) {
      const lead = await Lead.create({
        userId: customer._id,
        score: Math.floor(Math.random() * 100),
        intentLevel: ['low', 'medium', 'high', 'very_high'][Math.floor(Math.random() * 4)],
        pipelineStage: ['new', 'qualified', 'high_intent'][Math.floor(Math.random() * 3)],
        currentProduct: products[0]._id,
        currentProductName: products[0].name,
        productViewCount: Math.floor(Math.random() * 10) + 1,
        pricingViewCount: Math.floor(Math.random() * 5),
        visitCount: Math.floor(Math.random() * 10) + 1,
        totalTimeSpent: Math.floor(Math.random() * 5000) + 500,
        averageSessionDuration: Math.floor(Math.random() * 500) + 100,
        cartValue: 0,
        cartAbandoned: false,
        totalOrders: 2,
        totalSpent: 180,
        favoriteProducts: ['Yuzu Citrus', 'Passionfruit Guava'],
        lastActiveAt: new Date(),
        firstSeenAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      });

      // Create events
      const eventTypes: any[] = ['product_viewed', 'pricing_viewed', 'cart_updated', 'page_viewed'];
      for (let i = 0; i < 20; i++) {
        await Event.create({
          userId: customer._id,
          sessionId: `session_${customer._id}_${Math.floor(i / 5)}`,
          eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
          productId: products[Math.floor(Math.random() * products.length)]._id,
          source: 'web',
          timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        });
      }

      // Create score history
      for (let i = 0; i < 5; i++) {
        await ScoreHistory.create({
          leadId: lead._id,
          userId: customer._id,
          previousScore: Math.floor(Math.random() * 50),
          change: Math.floor(Math.random() * 20) - 5,
          newScore: Math.floor(Math.random() * 70),
          reason: 'Product viewed',
          timestamp: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000)
        });
      }
    }

    logger.info('Events and leads created');

    // Create conversations
    for (const customer of customers.slice(0, 3)) {
      await Conversation.create({
        conversationId: `conv_${customer._id}_${Date.now()}`,
        userId: customer._id,
        retellCallId: `call_${Date.now()}`,
        direction: 'outbound',
        triggerReason: 'High intent detected',
        startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        endedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000),
        durationSeconds: 300,
        status: 'completed',
        summary: 'Customer interested in Yuzu Citrus. Discussed pricing and delivery options.',
        intentBefore: 'medium',
        intentAfter: 'high',
        scoreBefore: 50,
        scoreAfter: 75,
        productInterest: ['Yuzu Citrus'],
        purchaseIntent: true,
        recommendedAction: 'Follow up with quote',
        outcome: 'qualified'
      });
    }

    logger.info('Conversations created');

    logger.info('✅ Seed completed successfully!');
    logger.info(`Admin login: admin@fizzi.com / admin123`);
    
    process.exit(0);
  } catch (error) {
    logger.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
