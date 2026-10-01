import mongoose, { Document, Schema, Types } from 'mongoose';

export type IntentLevel = 'low' | 'medium' | 'high' | 'very_high';
export type PipelineStage = 
  | 'new'
  | 'qualified'
  | 'high_intent'
  | 'cart_abandoned'
  | 'bulk_quote'
  | 'call_scheduled'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost';

export interface ILead extends Document {
  userId: Types.ObjectId;
  score: number;
  intentLevel: IntentLevel;
  pipelineStage: PipelineStage;
  currentProduct?: Types.ObjectId;
  currentProductName?: string;
  productViewCount: number;
  pricingViewCount: number;
  visitCount: number;
  totalTimeSpent: number;
  averageSessionDuration: number;
  cartValue: number;
  cartAbandoned: boolean;
  totalOrders: number;
  totalSpent: number;
  favoriteProducts: string[];
  lastActiveAt: Date;
  firstSeenAt: Date;
  lastOrderDate?: Date;
  nextBestAction?: string;
  triggerReason?: string;
  assignedTo?: Types.ObjectId;
  stalled: boolean;
  suspicious: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const leadSchema = new Schema<ILead>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    score: { type: Number, default: 0, min: 0, max: 100, index: true },
    intentLevel: { type: String, enum: ['low', 'medium', 'high', 'very_high'], default: 'low', index: true },
    pipelineStage: { 
      type: String, 
      enum: ['new', 'qualified', 'high_intent', 'cart_abandoned', 'bulk_quote', 'call_scheduled', 'negotiation', 'closed_won', 'closed_lost'],
      default: 'new',
      index: true
    },
    currentProduct: { type: Schema.Types.ObjectId, ref: 'Product' },
    currentProductName: { type: String },
    productViewCount: { type: Number, default: 0 },
    pricingViewCount: { type: Number, default: 0 },
    visitCount: { type: Number, default: 0 },
    totalTimeSpent: { type: Number, default: 0 },
    averageSessionDuration: { type: Number, default: 0 },
    cartValue: { type: Number, default: 0 },
    cartAbandoned: { type: Boolean, default: false },
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    favoriteProducts: [{ type: String }],
    lastActiveAt: { type: Date, default: Date.now, index: true },
    firstSeenAt: { type: Date, default: Date.now },
    lastOrderDate: { type: Date },
    nextBestAction: { type: String },
    triggerReason: { type: String },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    stalled: { type: Boolean, default: false, index: true },
    suspicious: { type: Boolean, default: false, index: true },
    notes: { type: String }
  },
  { timestamps: true }
);

leadSchema.index({ score: -1, intentLevel: 1 });
leadSchema.index({ pipelineStage: 1, lastActiveAt: -1 });

export const Lead = mongoose.model<ILead>('Lead', leadSchema);
