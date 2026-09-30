import mongoose from 'mongoose';
import { Lead } from '../src/models/Lead.js';
import { ScoreHistory } from '../src/models/ScoreHistory.js';
import { User } from '../src/models/User.js';
import { scoringService } from '../src/services/scoringService.js';
import { Settings } from '../src/models/Settings.js';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fizzi_test';

let testUserId: mongoose.Types.ObjectId;
let testLeadId: mongoose.Types.ObjectId;

beforeAll(async () => {
  await mongoose.connect(MONGO_URI);

  const user = await User.create({
    email: 'scoring_test@fizzi.test',
    password: 'test123456',
    firstName: 'Score',
    lastName: 'Tester',
    role: 'customer',
    customerType: 'd2c'
  });
  testUserId = user._id as mongoose.Types.ObjectId;

  const lead = await Lead.create({
    userId: testUserId,
    score: 0,
    intentLevel: 'low',
    pipelineStage: 'new',
    productViewCount: 0,
    pricingViewCount: 0,
    visitCount: 0,
    totalTimeSpent: 0,
    averageSessionDuration: 0,
    cartValue: 0,
    cartAbandoned: false,
    totalOrders: 0,
    totalSpent: 0,
    favoriteProducts: [],
    lastActiveAt: new Date(),
    firstSeenAt: new Date()
  });
  testLeadId = lead._id as mongoose.Types.ObjectId;

  await Settings.create({
    scoringRules: [
      { eventType: 'product_viewed', scoreChange: 3, description: 'Product viewed' },
      { eventType: 'pricing_viewed', scoreChange: 10, description: 'Pricing viewed' },
      { eventType: 'cart_updated', scoreChange: 15, description: 'Cart updated' },
      { eventType: 'checkout_started', scoreChange: 20, description: 'Checkout started' },
      { eventType: 'purchase_completed', scoreChange: 30, description: 'Purchase completed' },
      { eventType: 'cart_abandoned', scoreChange: -5, description: 'Cart abandoned' }
    ]
  });

  await scoringService.initialize();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('Scoring Service', () => {
  it('should increase score for product_viewed', async () => {
    const newScore = await scoringService.updateScore(testUserId, testLeadId, 'product_viewed');
    expect(newScore).toBe(3);
  });

  it('should record ScoreHistory on score change', async () => {
    const history = await ScoreHistory.find({ leadId: testLeadId });
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].change).toBe(3);
    expect(history[0].reason).toBeTruthy();
  });

  it('should increase score for pricing_viewed', async () => {
    const newScore = await scoringService.updateScore(testUserId, testLeadId, 'pricing_viewed');
    expect(newScore).toBe(13); // 3 + 10
  });

  it('should apply negative score for cart_abandoned', async () => {
    const beforeLead = await Lead.findById(testLeadId);
    const scoreBefore = beforeLead!.score;
    const newScore = await scoringService.updateScore(testUserId, testLeadId, 'cart_abandoned');
    expect(newScore).toBe(scoreBefore - 5);
  });

  it('score should never go below 0', async () => {
    // Force score to 2
    await Lead.findByIdAndUpdate(testLeadId, { score: 2 });
    const newScore = await scoringService.updateScore(testUserId, testLeadId, 'cart_abandoned');
    expect(newScore).toBe(0);
  });

  it('score should never exceed 100', async () => {
    await Lead.findByIdAndUpdate(testLeadId, { score: 98 });
    const newScore = await scoringService.updateScore(testUserId, testLeadId, 'purchase_completed');
    expect(newScore).toBe(100);
  });
});
