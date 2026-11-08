import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type LoanDirection = 'taken' | 'given';
export type LoanStatus = 'active' | 'repaid' | 'defaulted';

export interface ILoan extends Document {
  loanNumber: string;
  direction: LoanDirection;
  partyName: string;
  partyContact?: string;
  principal: number; // integer paisa
  outstandingPrincipal: number; // integer paisa
  interestRate: number; // e.g. 9.5%
  interestType: 'flat' | 'reducing';
  startDate: Date;
  dueDate: Date;
  termMonths: number;
  financialAccountId: Types.ObjectId;
  journalEntryId: Types.ObjectId;
  status: LoanStatus;
  notes?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LoanSchema = new Schema<ILoan>(
  {
    loanNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    direction: {
      type: String,
      enum: ['taken', 'given'],
      required: true,
      index: true,
    },
    partyName: {
      type: String,
      required: true,
      trim: true,
    },
    partyContact: {
      type: String,
      default: '',
    },
    principal: {
      type: Number,
      required: true,
    },
    outstandingPrincipal: {
      type: Number,
      required: true,
    },
    interestRate: {
      type: Number,
      default: 0,
    },
    interestType: {
      type: String,
      enum: ['flat', 'reducing'],
      default: 'flat',
    },
    startDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    termMonths: {
      type: Number,
      default: 12,
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
      enum: ['active', 'repaid', 'defaulted'],
      default: 'active',
      index: true,
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

export const Loan: Model<ILoan> =
  mongoose.models.Loan || mongoose.model<ILoan>('Loan', LoanSchema);
export default Loan;
