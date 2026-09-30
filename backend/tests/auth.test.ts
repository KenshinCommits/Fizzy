import mongoose from 'mongoose';
import { User } from '../src/models/User.js';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fizzi_test';

beforeAll(async () => {
  await mongoose.connect(MONGO_URI);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('User model - authentication', () => {
  it('should hash password on save', async () => {
    const user = new User({
      email: 'test_auth@fizzi.test',
      password: 'plaintext123',
      firstName: 'Test',
      lastName: 'User',
      role: 'customer',
      customerType: 'd2c'
    });
    await user.save();
    expect(user.password).not.toBe('plaintext123');
    expect(user.password.startsWith('$2')).toBe(true);
  });

  it('comparePassword returns true for correct password', async () => {
    const user = await User.findOne({ email: 'test_auth@fizzi.test' });
    expect(user).toBeTruthy();
    const match = await user!.comparePassword('plaintext123');
    expect(match).toBe(true);
  });

  it('comparePassword returns false for wrong password', async () => {
    const user = await User.findOne({ email: 'test_auth@fizzi.test' });
    const match = await user!.comparePassword('wrongpassword');
    expect(match).toBe(false);
  });

  it('should not allow duplicate emails', async () => {
    await expect(User.create({
      email: 'test_auth@fizzi.test',
      password: 'another123',
      firstName: 'Duplicate',
      lastName: 'User',
      role: 'customer',
      customerType: 'd2c'
    })).rejects.toThrow();
  });
});
