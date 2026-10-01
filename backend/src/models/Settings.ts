import mongoose, { Document, Schema } from 'mongoose';

export interface IScoringRule {
  eventType: string;
  scoreChange: number;
  description: string;
}

export interface ISettings extends Document {
  scoringRules: IScoringRule[];
  cartAbandonmentThresholdMinutes: number;
  cartAbandonmentMinValue: number;
  highIntentScoreThreshold: number;
  veryHighIntentScoreThreshold: number;
  stalledLeadDays: number;
  inactivityDecayEnabled: boolean;
  inactivityDecayDays: number;
  inactivityDecayAmount: number;
  outboundTriggers: {
    repeatedProductViews: { enabled: boolean; minViews: number; minVisits: number };
    highValueCart: { enabled: boolean; minValue: number };
    wholesaleInterest: { enabled: boolean; minPricingViews: number };
  };
  quietHours: {
    enabled: boolean;
    startHour: number;
    endHour: number;
    timezone: string;
  };
  cooldownMinutes: number;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    scoringRules: [
      {
        eventType: { type: String, required: true },
        scoreChange: { type: Number, required: true },
        description: { type: String, required: true }
      }
    ],
    cartAbandonmentThresholdMinutes: { type: Number, default: 30 },
    cartAbandonmentMinValue: { type: Number, default: 50 },
    highIntentScoreThreshold: { type: Number, default: 60 },
    veryHighIntentScoreThreshold: { type: Number, default: 80 },
    stalledLeadDays: { type: Number, default: 7 },
    inactivityDecayEnabled: { type: Boolean, default: true },
    inactivityDecayDays: { type: Number, default: 14 },
    inactivityDecayAmount: { type: Number, default: 10 },
    outboundTriggers: {
      repeatedProductViews: {
        enabled: { type: Boolean, default: true },
        minViews: { type: Number, default: 3 },
        minVisits: { type: Number, default: 3 }
      },
      highValueCart: {
        enabled: { type: Boolean, default: true },
        minValue: { type: Number, default: 100 }
      },
      wholesaleInterest: {
        enabled: { type: Boolean, default: true },
        minPricingViews: { type: Number, default: 2 }
      }
    },
    quietHours: {
      enabled: { type: Boolean, default: true },
      startHour: { type: Number, default: 22 },
      endHour: { type: Number, default: 8 },
      timezone: { type: String, default: 'America/New_York' }
    },
    cooldownMinutes: { type: Number, default: 60 }
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export const Settings = mongoose.model<ISettings>('Settings', settingsSchema);
