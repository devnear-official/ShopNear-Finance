import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type PeriodStatus = 'open' | 'closed' | 'locked';

export interface IFinancialPeriod extends Document {
  fiscalYearId: Types.ObjectId;
  name: string;
  startDate: Date;
  endDate: Date;
  status: PeriodStatus;
  closedBy?: Types.ObjectId;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FinancialPeriodSchema = new Schema<IFinancialPeriod>(
  {
    fiscalYearId: {
      type: Schema.Types.ObjectId,
      ref: 'FiscalYear',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'closed', 'locked'],
      default: 'open',
      index: true,
    },
    closedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    closedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

FinancialPeriodSchema.index({ startDate: 1, endDate: 1 });

export const FinancialPeriod: Model<IFinancialPeriod> =
  mongoose.models.FinancialPeriod ||
  mongoose.model<IFinancialPeriod>('FinancialPeriod', FinancialPeriodSchema);
export default FinancialPeriod;
