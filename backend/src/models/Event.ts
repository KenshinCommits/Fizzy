import mongoose, { Document, Schema, Types } from 'mongoose';

export type EventType = 
  | 'user_registered'
  | 'user_logged_in'
  | 'page_viewed'
  | 'product_viewed'
  | 'product_search'
  | 'product_comparison'
  | 'pricing_viewed'
  | 'wishlist_added'
  | 'wishlist_removed'
  | 'cart_created'
  | 'cart_updated'
  | 'cart_abandoned'
  | 'checkout_started'
  | 'purchase_completed'
  | 'wholesale_pricing_viewed'
  | 'bulk_quote_submitted'
  | 'voice_agent_started'
  | 'voice_agent_completed'
  | 'voice_agent_triggered';

export interface IEvent extends Document {
  userId?: Types.ObjectId;
  sessionId: string;
  eventType: EventType;
  productId?: Types.ObjectId;
  orderId?: Types.ObjectId;
  metadata?: Record<string, any>;
  timestamp: Date;
  source: string;
  ipAddress?: string;
  userAgent?: string;
}

const eventSchema = new Schema<IEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    sessionId: { type: String, required: true, index: true },
    eventType: { type: String, required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    metadata: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now, index: true },
    source: { type: String, required: true },
    ipAddress: { type: String },
    userAgent: { type: String }
  },
  { timestamps: false }
);

eventSchema.index({ userId: 1, eventType: 1, timestamp: -1 });
eventSchema.index({ sessionId: 1, timestamp: -1 });
eventSchema.index({ productId: 1, eventType: 1 });

export const Event = mongoose.model<IEvent>('Event', eventSchema);
