import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface IApproval extends Document {
  entityType: 'Transaction' | 'Investment' | 'Withdrawal' | 'Period';
  entityId: Types.ObjectId;
  requestedBy: Types.ObjectId;
  status: ApprovalStatus;
  decidedBy?: Types.ObjectId;
  decidedAt?: Date;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ApprovalSchema = new Schema<IApproval>(
  {
    entityType: {
      type: String,
      enum: ['Transaction', 'Investment', 'Withdrawal', 'Period'],
      required: true,
      index: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    decidedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    decidedAt: {
      type: Date,
    },
    comment: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const Approval: Model<IApproval> =
  mongoose.models.Approval || mongoose.model<IApproval>('Approval', ApprovalSchema);
export default Approval;
