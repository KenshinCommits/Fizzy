import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IConversationMessage {
  role: 'agent' | 'customer';
  content: string;
  timestamp: Date;
}

export interface IConversation extends Document {
  conversationId: string;
  userId?: Types.ObjectId;
  leadId?: Types.ObjectId;
  retellCallId?: string;
  recordingUrl?: string;
  direction: 'inbound' | 'outbound';
  triggerReason?: string;
  startedAt: Date;
  endedAt?: Date;
  durationSeconds?: number;
  status: 'active' | 'completed' | 'failed' | 'abandoned';
  transcript?: IConversationMessage[];
  summary?: string;
  intentBefore?: string;
  intentAfter?: string;
  scoreBefore?: number;
  scoreAfter?: number;
  productInterest?: string[];
  objections?: string[];
  purchaseIntent?: boolean;
  recommendedAction?: string;
  outcome?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    conversationId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', index: true },
    retellCallId: { type: String, index: true },
    recordingUrl: { type: String },
    direction: { type: String, enum: ['inbound', 'outbound'], required: true },
    triggerReason: { type: String },
    startedAt: { type: Date, required: true, default: Date.now },
    endedAt: { type: Date },
    durationSeconds: { type: Number },
    status: { type: String, enum: ['active', 'completed', 'failed', 'abandoned'], default: 'active', index: true },
    transcript: [
      {
        role: { type: String, enum: ['agent', 'customer'], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
      }
    ],
    summary: { type: String },
    intentBefore: { type: String },
    intentAfter: { type: String },
    scoreBefore: { type: Number },
    scoreAfter: { type: Number },
    productInterest: [{ type: String }],
    objections: [{ type: String }],
    purchaseIntent: { type: Boolean },
    recommendedAction: { type: String },
    outcome: { type: String },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

conversationSchema.index({ userId: 1, startedAt: -1 });
conversationSchema.index({ leadId: 1, startedAt: -1 });

export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);
