import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IWholesaleQuote extends Document {
  userId: Types.ObjectId;
  leadId?: Types.ObjectId;
  companyName: string;
  businessCategory?: string;
  requestedProducts: Array<{ productId: Types.ObjectId; quantity: number }>;
  requestedQuantity: number;
  expectedBudget?: number;
  requiredBy?: Date;
  location?: string;
  status: 'pending' | 'quoted' | 'accepted' | 'rejected' | 'expired';
  estimatedValue: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const wholesaleQuoteSchema = new Schema<IWholesaleQuote>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', index: true },
    companyName: { type: String, required: true },
    businessCategory: { type: String },
    requestedProducts: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true }
      }
    ],
    requestedQuantity: { type: Number, required: true },
    expectedBudget: { type: Number },
    requiredBy: { type: Date },
    location: { type: String },
    status: { 
      type: String, 
      enum: ['pending', 'quoted', 'accepted', 'rejected', 'expired'], 
      default: 'pending',
      index: true 
    },
    estimatedValue: { type: Number, required: true },
    notes: { type: String }
  },
  { timestamps: true }
);

export const WholesaleQuote = mongoose.model<IWholesaleQuote>('WholesaleQuote', wholesaleQuoteSchema);
