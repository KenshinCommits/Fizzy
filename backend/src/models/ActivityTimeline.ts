import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IActivityTimeline extends Document {
  userId: Types.ObjectId;
  leadId?: Types.ObjectId;
  type: string;
  title: string;
  description: string;
  metadata?: Record<string, any>;
  source: string;
  timestamp: Date;
}

const activityTimelineSchema = new Schema<IActivityTimeline>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', index: true },
    type: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    source: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, index: true }
  },
  { timestamps: false }
);

activityTimelineSchema.index({ userId: 1, timestamp: -1 });
activityTimelineSchema.index({ leadId: 1, timestamp: -1 });

export const ActivityTimeline = mongoose.model<IActivityTimeline>('ActivityTimeline', activityTimelineSchema);
