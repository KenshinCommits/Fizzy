import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ILeadAssignment extends Document {
  leadId: Types.ObjectId;
  salespersonId: Types.ObjectId;
  reason: string;
  assignedBy?: Types.ObjectId;
  assignedAt: Date;
  unassignedAt?: Date;
  status: 'active' | 'completed' | 'reassigned';
}

const leadAssignmentSchema = new Schema<ILeadAssignment>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    salespersonId: { type: Schema.Types.ObjectId, ref: 'Salesperson', required: true, index: true },
    reason: { type: String, required: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedAt: { type: Date, default: Date.now },
    unassignedAt: { type: Date },
    status: { type: String, enum: ['active', 'completed', 'reassigned'], default: 'active', index: true }
  },
  { timestamps: false }
);

leadAssignmentSchema.index({ leadId: 1, assignedAt: -1 });
leadAssignmentSchema.index({ salespersonId: 1, status: 1 });

export const LeadAssignment = mongoose.model<ILeadAssignment>('LeadAssignment', leadAssignmentSchema);
