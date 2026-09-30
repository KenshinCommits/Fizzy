/**
 * Database utility scripts
 * Usage:
 *   npm run db:migrate   -> run product migration
 *   npm run db:validate  -> validate migration against frontend data
 *   npm run db:indexes   -> ensure all indexes exist
 *   npm run db:status    -> print database status
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { config } from '../config/index.js';
import { connectDatabase } from '../config/database.js';
import { logger } from '../config/logger.js';
import { migrateProducts, validateMigration } from '../migrations/migrateProducts.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { Order } from '../models/Order.js';
import { Lead } from '../models/Lead.js';
import { Event } from '../models/Event.js';
import { Conversation } from '../models/Conversation.js';
import { ScoreHistory } from '../models/ScoreHistory.js';
import { Cart } from '../models/Cart.js';
import { CustomerMetrics } from '../models/CustomerMetrics.js';
import { Session } from '../models/Session.js';
import { ActivityTimeline } from '../models/ActivityTimeline.js';
import { Settings } from '../models/Settings.js';

const command = process.argv[2];

async function runMigration() {
  await connectDatabase();
  logger.info('Running product migration...');
  const result = await migrateProducts();
  logger.info('Migration complete:', result);
  process.exit(0);
}

async function runValidation() {
  await connectDatabase();
  logger.info('Running migration validation...');
  await validateMigration();
  process.exit(0);
}

async function ensureIndexes() {
  await connectDatabase();
  logger.info('Ensuring all indexes exist...');
  
  const models = [
    Product, User, Order, Lead, Event, Conversation,
    ScoreHistory, Cart, CustomerMetrics, Session, ActivityTimeline, Settings
  ];
  
  for (const model of models) {
    await model.ensureIndexes();
    logger.info(`✓ Indexes ensured for ${model.modelName}`);
  }
  
  logger.info('All indexes verified.');
  process.exit(0);
}

async function printStatus() {
  await connectDatabase();
  logger.info('='.repeat(50));
  logger.info('DATABASE STATUS');
  logger.info('='.repeat(50));
  
  const collections = [
    { name: 'Products', model: Product },
    { name: 'Users', model: User },
    { name: 'Orders', model: Order },
    { name: 'Leads', model: Lead },
    { name: 'Events', model: Event },
    { name: 'Conversations', model: Conversation },
    { name: 'ScoreHistories', model: ScoreHistory },
    { name: 'Carts', model: Cart },
    { name: 'CustomerMetrics', model: CustomerMetrics },
    { name: 'Sessions', model: Session },
    { name: 'ActivityTimelines', model: ActivityTimeline }
  ];
  
  for (const { name, model } of collections) {
    const count = await model.countDocuments();
    logger.info(`${name.padEnd(20)}: ${count} documents`);
  }
  
  logger.info('='.repeat(50));
  logger.info(`Database: ${mongoose.connection.name}`);
  logger.info(`Status: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
  logger.info('='.repeat(50));
  
  process.exit(0);
}

// Run command
switch (command) {
  case 'migrate':   runMigration().catch(err => { logger.error(err); process.exit(1); }); break;
  case 'validate':  runValidation().catch(err => { logger.error(err); process.exit(1); }); break;
  case 'indexes':   ensureIndexes().catch(err => { logger.error(err); process.exit(1); }); break;
  case 'status':    printStatus().catch(err => { logger.error(err); process.exit(1); }); break;
  default:
    logger.info('Usage: tsx src/utils/dbScripts.ts [migrate|validate|indexes|status]');
    process.exit(0);
}
