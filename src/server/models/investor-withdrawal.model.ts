import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IInvestorWithdrawal extends Document {
  investorId: Types.ObjectId;
  amount: number; // integer paisa
  date: Date;
  financialAccountId: Types.ObjectId;
  journalEntryId: Types.ObjectId;
  status: 'posted' | 'reversed';
  notes?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InvestorWithdrawalSchema = new Schema<IInvestorWithdrawal>(
  {
    investorId: {
      type: Schema.Types.ObjectId,
      ref: 'Investor',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    financialAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'FinancialAccount',
      required: true,
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
    notes: {
      type: String,
      default: '',
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

export const InvestorWithdrawal: Model<IInvestorWithdrawal> =
  mongoose.models.InvestorWithdrawal ||
  mongoose.model<IInvestorWithdrawal>('InvestorWithdrawal', InvestorWithdrawalSchema);
export default InvestorWithdrawal;
