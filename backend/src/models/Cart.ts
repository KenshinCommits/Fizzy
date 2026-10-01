import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICartItem {
  product: Types.ObjectId;
  quantity: number;
  price: number;
}

export interface ICart extends Document {
  userId?: Types.ObjectId;
  sessionId?: string;
  items: ICartItem[];
  subtotal: number;
  lastActivity: Date;
  abandoned: boolean;
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
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true }
      }
    ],
    subtotal: { type: Number, required: true, default: 0 },
    lastActivity: { type: Date, default: Date.now, index: true },
    abandoned: { type: Boolean, default: false, index: true },
    abandonedAt: { type: Date },
    recovered: { type: Boolean, default: false },
    recoveredAt: { type: Date }
  },
  { timestamps: true }
);

cartSchema.index({ userId: 1, abandoned: 1 });
cartSchema.index({ abandonedAt: 1 });

export const Cart = mongoose.model<ICart>('Cart', cartSchema);
