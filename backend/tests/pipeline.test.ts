import mongoose from 'mongoose';
import { Lead } from '../src/models/Lead.js';
import { User } from '../src/models/User.js';
import { pipelineService } from '../src/services/pipelineService.js';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fizzi_test';

beforeAll(async () => { await mongoose.connect(MONGO_URI); });
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

async function createTestLead(overrides: any = {}) {
  const user = await User.create({
    email: `pipeline_${Date.now()}@fizzi.test`,
    password: 'test12345678',
    firstName: 'Pipeline', lastName: 'Test',
    role: 'customer', customerType: 'd2c'
  });
  const lead = await Lead.create({
    userId: user._id, score: 50, intentLevel: 'medium',
    pipelineStage: 'new', productViewCount: 0, pricingViewCount: 0,
    visitCount: 0, totalTimeSpent: 0, averageSessionDuration: 0,
    cartValue: 0, cartAbandoned: false, totalOrders: 0, totalSpent: 0,
    favoriteProducts: [], lastActiveAt: new Date(), firstSeenAt: new Date(),
    ...overrides
  });
  return lead;
}

describe('Pipeline Service', () => {
  it('qualifies a lead with score >= 40', async () => {
    const lead = await createTestLead({ score: 45, pipelineStage: 'new' });
    const stage = await pipelineService.updateStage(lead._id as mongoose.Types.ObjectId, 'qualified');
    expect(stage).toBe('qualified');
  });

  it('moves to high_intent for high intentLevel', async () => {
    const lead = await createTestLead({ score: 70, intentLevel: 'high', pipelineStage: 'qualified' });
    const stage = await pipelineService.updateStage(lead._id as mongoose.Types.ObjectId, 'high_intent');
    expect(stage).toBe('high_intent');
  });

  it('moves to cart_abandoned when cart is abandoned', async () => {
    const lead = await createTestLead({ score: 60, cartAbandoned: true, cartValue: 1899, pipelineStage: 'qualified' });
    const stage = await pipelineService.updateStage(lead._id as mongoose.Types.ObjectId, 'cart_abandoned');
    expect(stage).toBe('cart_abandoned');
  });

  it('closes to closed_won after purchase', async () => {
    const lead = await createTestLead({ score: 80, intentLevel: 'very_high', pipelineStage: 'high_intent' });
    const stage = await pipelineService.updateStage(lead._id as mongoose.Types.ObjectId, 'purchase');
    expect(stage).toBe('closed_won');
  });
});
