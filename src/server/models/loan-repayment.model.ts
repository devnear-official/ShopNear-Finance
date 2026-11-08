import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ILoanRepayment extends Document {
  loanId: Types.ObjectId;
  date: Date;
  principal: number; // integer paisa
  interest: number; // integer paisa
  totalAmount: number; // integer paisa
  financialAccountId: Types.ObjectId;
  journalEntryId: Types.ObjectId;
  notes?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
}

const LoanRepaymentSchema = new Schema<ILoanRepayment>(
  {
    loanId: {
      type: Schema.Types.ObjectId,
      ref: 'Loan',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
    },
    principal: {
      type: Number,
      required: true,
    },
    interest: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
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
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const LoanRepayment: Model<ILoanRepayment> =
  mongoose.models.LoanRepayment ||
  mongoose.model<ILoanRepayment>('LoanRepayment', LoanRepaymentSchema);
export default LoanRepayment;
