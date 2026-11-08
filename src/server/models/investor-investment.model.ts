import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IInvestorInvestment extends Document {
  investorId: Types.ObjectId;
  amount: number; // integer paisa
  date: Date;
  type: 'initial' | 'additional';
  financialAccountId: Types.ObjectId;
  journalEntryId: Types.ObjectId;
  notes?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InvestorInvestmentSchema = new Schema<IInvestorInvestment>(
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
    type: {
      type: String,
      enum: ['initial', 'additional'],
      default: 'additional',
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

export const InvestorInvestment: Model<IInvestorInvestment> =
  mongoose.models.InvestorInvestment ||
  mongoose.model<IInvestorInvestment>('InvestorInvestment', InvestorInvestmentSchema);
export default InvestorInvestment;
