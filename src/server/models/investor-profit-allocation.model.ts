import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IInvestorProfitAllocation extends Document {
  investorId: Types.ObjectId;
  periodId: Types.ObjectId;
  amount: number; // integer paisa
  kind: 'profit' | 'loss';
  basis?: string; // e.g. "Q3 FY26 Profit Distribution"
  journalEntryId: Types.ObjectId;
  status: 'posted' | 'reversed';
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InvestorProfitAllocationSchema = new Schema<IInvestorProfitAllocation>(
  {
    investorId: {
      type: Schema.Types.ObjectId,
      ref: 'Investor',
      required: true,
      index: true,
    },
    periodId: {
      type: Schema.Types.ObjectId,
      ref: 'FinancialPeriod',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    kind: {
      type: String,
      enum: ['profit', 'loss'],
      default: 'profit',
    },
    basis: {
      type: String,
      default: '',
    },
    journalEntryId: {
      type: Schema.Types.ObjectId,
      ref: 'JournalEntry',
      required: true,
    },
    status: {
      type: String,
      enum: ['posted', 'reversed'],
      default: 'posted',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const InvestorProfitAllocation: Model<IInvestorProfitAllocation> =
  mongoose.models.InvestorProfitAllocation ||
  mongoose.model<IInvestorProfitAllocation>('InvestorProfitAllocation', InvestorProfitAllocationSchema);
export default InvestorProfitAllocation;
