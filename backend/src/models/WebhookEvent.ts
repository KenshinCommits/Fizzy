import mongoose, { Document, Schema } from 'mongoose';

export interface IWebhookEvent extends Document {
  provider: string;
  externalEventId: string;
  eventType: string;
  payload: Record<string, any>;
  payloadHash: string;
  processed: boolean;
  processedAt?: Date;
  error?: string;
  createdAt: Date;
}

const webhookEventSchema = new Schema<IWebhookEvent>(
  {
    provider: { type: String, required: true, index: true },
    externalEventId: { type: String, required: true, index: true },
    eventType: { type: String, required: true, index: true },
    payload: { type: Schema.Types.Mixed, required: true },
    payloadHash: { type: String, required: true },
    processed: { type: Boolean, default: false, index: true },
    processedAt: { type: Date },
    error: { type: String }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

webhookEventSchema.index({ provider: 1, externalEventId: 1 }, { unique: true });

export const WebhookEvent = mongoose.model<IWebhookEvent>('WebhookEvent', webhookEventSchema);
