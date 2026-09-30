import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  legacyProductId: string; // Original frontend ID
  name: string;
  slug: string;
  description: string;
  category: string;
  flavor?: string;
  tone?: string;
  images: string[];
  price: number;
  compareAtPrice?: number;
  currency: string;
  sku: string;
  packSize?: string;
  ingredients?: string;
  tags: string[];
  stock: number;
  sold: number;
  views: number;
  conversion: number;
  wholesaleAvailable: boolean;
  status: 'Active' | 'Draft' | 'Archived';
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    legacyProductId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
    flavor: { type: String },
    tone: { type: String },
    images: [{ type: String }],
    price: { type: Number, required: true },
    compareAtPrice: { type: Number },
    currency: { type: String, default: 'INR' },
    sku: { type: String, required: true, unique: true, index: true },
    packSize: { type: String },
    ingredients: { type: String },
    tags: [{ type: String }],
    stock: { type: Number, required: true, default: 0 },
    sold: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    conversion: { type: Number, default: 0 },
    wholesaleAvailable: { type: Boolean, default: false },
    status: { type: String, enum: ['Active', 'Draft', 'Archived'], default: 'Active', index: true }
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, status: 1 });

export const Product = mongoose.model<IProduct>('Product', productSchema);
