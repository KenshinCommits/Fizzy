import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IScoreHistory extends Document {
  leadId: Types.ObjectId;
  userId: Types.ObjectId;
  previousScore: number;
  change: number;
  newScore: number;
  reason: string;
  eventId?: Types.ObjectId;
  timestamp: Date;
}

const scoreHistorySchema = new Schema<IScoreHistory>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    previousScore: { type: Number, required: true },
    change: { type: Number, required: true },
    newScore: { type: Number, required: true },
    reason: { type: String, required: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event' },
    timestamp: { type: Date, default: Date.now, index: true }
  },
  { timestamps: false }
);

scoreHistorySchema.index({ leadId: 1, timestamp: -1 });

export const ScoreHistory = mongoose.model<IScoreHistory>('ScoreHistory', scoreHistorySchema);
