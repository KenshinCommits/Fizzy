import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  category: string;
  images: string[];
  price: number;
  compareAtPrice?: number;
  currency: string;
  sku: string;
  packSize?: string;
  ingredients?: string[];
  tags: string[];
  inventory: number;
  wholesaleAvailable: boolean;
  wholesalePrice?: number;
  minWholesaleQuantity?: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
    images: [{ type: String }],
    price: { type: Number, required: true },
    compareAtPrice: { type: Number },
    currency: { type: String, default: 'USD' },
    sku: { type: String, required: true, unique: true, index: true },
    packSize: { type: String },
    ingredients: [{ type: String }],
    tags: [{ type: String }],
    inventory: { type: Number, required: true, default: 0 },
    wholesaleAvailable: { type: Boolean, default: false },
    wholesalePrice: { type: Number },
    minWholesaleQuantity: { type: Number },
    status: { type: String, enum: ['active', 'inactive', 'out_of_stock'], default: 'active', index: true }
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text' });

export const Product = mongoose.model<IProduct>('Product', productSchema);
