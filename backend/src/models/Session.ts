import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISession extends Document {
  sessionId: string;
  userId?: Types.ObjectId;
  anonymousId?: string;
  startedAt: Date;
  endedAt?: Date;
  durationSeconds?: number;
  pageViews: number;
  productViews: number;
  pricingViews: number;
  cartInteractions: number;
  checkoutAttempts: number;
  device?: string;
  browser?: string;
  referrer?: string;
  source?: string;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    anonymousId: { type: String, index: true },
    startedAt: { type: Date, required: true, default: Date.now },
    endedAt: { type: Date },
    durationSeconds: { type: Number },
    pageViews: { type: Number, default: 0 },
    productViews: { type: Number, default: 0 },
    pricingViews: { type: Number, default: 0 },
    cartInteractions: { type: Number, default: 0 },
    checkoutAttempts: { type: Number, default: 0 },
    device: { type: String },
    browser: { type: String },
    referrer: { type: String },
    source: { type: String },
    ipAddress: { type: String }
  },
  { timestamps: true }
);

sessionSchema.index({ userId: 1, startedAt: -1 });
sessionSchema.index({ startedAt: -1 });

export const Session = mongoose.model<ISession>('Session', sessionSchema);
