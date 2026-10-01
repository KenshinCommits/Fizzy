import mongoose from 'mongoose';
import { Product } from '../src/models/Product.js';
import { migrateProducts, validateMigration } from '../src/migrations/migrateProducts.js';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fizzi_test';

beforeAll(async () => {
  await mongoose.connect(MONGO_URI);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('Product Migration', () => {
  it('should migrate all 8 real Fizzi products', async () => {
    const result = await migrateProducts();
    expect(result.productsFound).toBe(8);
    expect(result.inserted + result.updated).toBe(8);
    expect(result.errors.length).toBe(0);
  });

  it('should be idempotent (no duplicates on second run)', async () => {
    const result = await migrateProducts();
    const totalProducts = await Product.countDocuments();
    expect(totalProducts).toBe(8);
    expect(result.duplicatesDetected).toBe(8);
    expect(result.inserted).toBe(0);
  });

  it('should have correct Yuzu Citrus data', async () => {
    const yuzu = await Product.findOne({ legacyProductId: 'yuzu' });
    expect(yuzu).toBeTruthy();
    expect(yuzu!.name).toBe('Yuzu Citrus');
    expect(yuzu!.price).toBe(1899);
    expect(yuzu!.currency).toBe('INR');
    expect(yuzu!.sku).toBe('FZ-YZ-12');
    expect(yuzu!.category).toBe('Sparkling juice');
    expect(yuzu!.stock).toBe(1248);
    expect(yuzu!.status).toBe('Active');
  });

  it('should have correct Wholesale Bulk Crate data', async () => {
    const bulk = await Product.findOne({ legacyProductId: 'bulk' });
    expect(bulk).toBeTruthy();
    expect(bulk!.name).toBe('Wholesale Bulk Crate');
    expect(bulk!.price).toBe(840);
    expect(bulk!.wholesaleAvailable).toBe(true);
    expect(bulk!.packSize).toBe('24 × 250 ml');
  });

  it('Midnight Cold Brew should be Draft status', async () => {
    const brew = await Product.findOne({ legacyProductId: 'brew' });
    expect(brew).toBeTruthy();
    expect(brew!.status).toBe('Draft');
    expect(brew!.stock).toBe(0);
  });

  it('all products should have INR currency', async () => {
    const nonInr = await Product.find({ currency: { $ne: 'INR' } });
    expect(nonInr.length).toBe(0);
  });

  it('all slugs should be unique', async () => {
    const products = await Product.find({});
    const slugs = products.map(p => p.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(products.length);
  });
});

describe('Product API Shape', () => {
  it('all active products should have required fields', async () => {
    const products = await Product.find({ status: 'Active' });
    for (const p of products) {
      expect(p.name).toBeTruthy();
      expect(p.sku).toBeTruthy();
      expect(p.price).toBeGreaterThan(0);
      expect(p.legacyProductId).toBeTruthy();
    }
  });
});
