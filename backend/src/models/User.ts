import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  customerType: 'd2c' | 'b2b' | 'wholesale' | 'guest';
  role: 'customer' | 'super_admin' | 'admin' | 'sales_manager' | 'sales_rep' | 'support';
  companyName?: string;
  businessCategory?: string;
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  communicationPreferences?: {
    email: boolean;
    sms: boolean;
    phone: boolean;
  };
  optOut: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, index: true },
    customerType: { type: String, enum: ['d2c', 'b2b', 'wholesale', 'guest'], default: 'd2c', index: true },
    role: { 
      type: String, 
      enum: ['customer', 'super_admin', 'admin', 'sales_manager', 'sales_rep', 'support'], 
      default: 'customer',
      index: true
    },
    companyName: { type: String },
    businessCategory: { type: String },
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      zip: String,
      country: String
    },
    billingAddress: {
      street: String,
      city: String,
      state: String,
      zip: String,
      country: String
    },
    communicationPreferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      phone: { type: Boolean, default: true }
    },
    optOut: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.index({ email: 1, phone: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
