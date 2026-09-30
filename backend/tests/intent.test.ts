import mongoose from 'mongoose';
import { Lead } from '../src/models/Lead.js';
import { User } from '../src/models/User.js';
import { Settings } from '../src/models/Settings.js';
import { intentService } from '../src/services/intentService.js';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fizzi_test';

beforeAll(async () => {
  await mongoose.connect(MONGO_URI);

  await Settings.create({
    scoringRules: [],
    highIntentScoreThreshold: 60,
    veryHighIntentScoreThreshold: 80
  });
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

async function makeLeadWithScore(score: number) {
  const user = await User.create({
    email: `intent_${score}_${Date.now()}@fizzi.test`,
    password: 'test12345678',
    firstName: 'Intent',
    lastName: 'Test',
    role: 'customer',
    customerType: 'd2c'
  });
  const lead = await Lead.create({
    userId: user._id,
    score,
    intentLevel: 'low',
    pipelineStage: 'new',
    productViewCount: 0, pricingViewCount: 0, visitCount: 0,
    totalTimeSpent: 0, averageSessionDuration: 0, cartValue: 0,
    cartAbandoned: false, totalOrders: 0, totalSpent: 0,
    favoriteProducts: [], lastActiveAt: new Date(), firstSeenAt: new Date()
  });
  return { userId: user._id as mongoose.Types.ObjectId, leadId: lead._id as mongoose.Types.ObjectId };
}

describe('Intent Engine', () => {
  it('score < 30 → low intent', async () => {
    const { userId, leadId } = await makeLeadWithScore(10);
    const intent = await intentService.calculateIntent(userId, leadId);
    expect(intent).toBe('low');
  });

  it('score 30-59 → medium intent', async () => {
    const { userId, leadId } = await makeLeadWithScore(45);
    const intent = await intentService.calculateIntent(userId, leadId);
    expect(intent).toBe('medium');
  });

  it('score 60-79 → high intent', async () => {
    const { userId, leadId } = await makeLeadWithScore(65);
    const intent = await intentService.calculateIntent(userId, leadId);
    expect(intent).toBe('high');
  });

  it('score >= 80 → very_high intent', async () => {
    const { userId, leadId } = await makeLeadWithScore(85);
    const intent = await intentService.calculateIntent(userId, leadId);
    expect(intent).toBe('very_high');
  });
});
