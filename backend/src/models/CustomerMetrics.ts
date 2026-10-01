import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICustomerMetrics extends Document {
  userId: Types.ObjectId;
  totalVisits: number;
  totalTimeSeconds: number;
  averageSessionSeconds: number;
  totalPageViews: number;
  totalProductViews: number;
  uniqueProductsViewed: number;
  pricingViews: number;
  cartInteractions: number;
  checkoutAttempts: number;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  favoriteProducts: Array<{ productId: Types.ObjectId; count: number }>;
  mostViewedProducts: Array<{ productId: Types.ObjectId; viewCount: number }>;
  firstSeenAt: Date;
  lastActiveAt: Date;
  lastOrderDate?: Date;
  updatedAt: Date;
}

const customerMetricsSchema = new Schema<ICustomerMetrics>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    totalVisits: { type: Number, default: 0 },
    totalTimeSeconds: { type: Number, default: 0 },
    averageSessionSeconds: { type: Number, default: 0 },
    totalPageViews: { type: Number, default: 0 },
    totalProductViews: { type: Number, default: 0 },
    uniqueProductsViewed: { type: Number, default: 0 },
    pricingViews: { type: Number, default: 0 },
    cartInteractions: { type: Number, default: 0 },
    checkoutAttempts: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    favoriteProducts: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        count: { type: Number, required: true }
      }
    ],
    mostViewedProducts: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        viewCount: { type: Number, required: true }
      }
    ],
    firstSeenAt: { type: Date, default: Date.now },
    lastActiveAt: { type: Date, default: Date.now },
    lastOrderDate: { type: Date }
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export const CustomerMetrics = mongoose.model<ICustomerMetrics>('CustomerMetrics', customerMetricsSchema);
