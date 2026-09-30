import mongoose, { Document, Schema, Types } from 'mongoose';
import { PipelineStage } from './Lead.js';

export interface ILeadStageHistory extends Document {
  leadId: Types.ObjectId;
  previousStage: PipelineStage;
  newStage: PipelineStage;
  reason: string;
  eventId?: Types.ObjectId;
  changedBy?: Types.ObjectId;
  timestamp: Date;
}

const leadStageHistorySchema = new Schema<ILeadStageHistory>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    previousStage: { type: String, required: true },
    newStage: { type: String, required: true },
    reason: { type: String, required: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event' },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now, index: true }
  },
  { timestamps: false }
);

leadStageHistorySchema.index({ leadId: 1, timestamp: -1 });

export const LeadStageHistory = mongoose.model<ILeadStageHistory>('LeadStageHistory', leadStageHistorySchema);
