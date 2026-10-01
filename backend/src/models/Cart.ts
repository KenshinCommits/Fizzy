import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICartItem {
  productId: Types.ObjectId;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  // Legacy aliases allow historic carts to be read during the migration.
  product?: Types.ObjectId;
  price?: number;
}

export interface ICart extends Document {
  userId?: Types.ObjectId;
  sessionId?: string;
  items: ICartItem[];
  subtotal: number;
  lastActivityAt: Date;
  status: 'active' | 'abandoned' | 'converted';
  lastActivity?: Date;
  abandoned?: boolean;
  abandonedAt?: Date;
  recovered: boolean;
  recoveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const cartSchema = new Schema<ICart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    sessionId: { type: String, index: true },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        variantId: { type: String },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 }
      }
    ],
    subtotal: { type: Number, required: true, default: 0 },
    lastActivityAt: { type: Date, default: Date.now, index: true },
    status: { type: String, enum: ['active', 'abandoned', 'converted'], default: 'active', index: true },
    abandonedAt: { type: Date },
    recovered: { type: Boolean, default: false },
    recoveredAt: { type: Date }
  },
  { timestamps: true }
);

cartSchema.index({ userId: 1, status: 1 });
cartSchema.index({ abandonedAt: 1 });

export const Cart = mongoose.model<ICart>('Cart', cartSchema);
