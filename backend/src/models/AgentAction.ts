import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAgentAction extends Document {
  userId: Types.ObjectId;
  leadId?: Types.ObjectId;
  conversationId?: Types.ObjectId;
  actionType: string;
  reason: string;
  status: 'pending' | 'completed' | 'failed';
  metadata?: Record<string, any>;
  result?: string;
  createdAt: Date;
  updatedAt: Date;
}

const agentActionSchema = new Schema<IAgentAction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', index: true },
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', index: true },
    actionType: { type: String, required: true, index: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending', index: true },
    metadata: { type: Schema.Types.Mixed },
    result: { type: String }
  },
  { timestamps: true }
);

agentActionSchema.index({ userId: 1, createdAt: -1 });

export const AgentAction = mongoose.model<IAgentAction>('AgentAction', agentActionSchema);
