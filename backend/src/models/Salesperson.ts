import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISalesperson extends Document {
  userId: Types.ObjectId;
  territory?: string;
  skills: string[];
  activeLeadCount: number;
  workloadCapacity: number;
  winRate: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const salespersonSchema = new Schema<ISalesperson>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    territory: { type: String },
    skills: [{ type: String }],
    activeLeadCount: { type: Number, default: 0 },
    workloadCapacity: { type: Number, default: 10 },
    winRate: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Salesperson = mongoose.model<ISalesperson>('Salesperson', salespersonSchema);
