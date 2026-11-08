import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type BusinessTransactionType = 'income' | 'expense' | 'asset_purchase' | 'adjustment';

export type TransactionStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'posted'
  | 'rejected'
  | 'cancelled'
  | 'reversed';

export interface ITransaction extends Document {
  transactionNumber: string;
  type: BusinessTransactionType;
  date: Date;
  amount: number; // integer paisa
  categoryId: Types.ObjectId;
  subcategory?: string;
  partyName?: string;
  financialAccountId: Types.ObjectId;
  paymentMethod: string;
  referenceNo?: string;
  invoiceNo?: string;
  description: string;
  status: TransactionStatus;
  journalEntryId?: Types.ObjectId;
  submittedBy?: Types.ObjectId;
  submittedAt?: Date;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  rejectedBy?: Types.ObjectId;
  rejectedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    transactionNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['income', 'expense', 'asset_purchase', 'adjustment'],
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'TransactionCategory',
      required: true,
      index: true,
    },
    subcategory: {
      type: String,
      default: '',
    },
    partyName: {
      type: String,
      default: '',
    },
    financialAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'FinancialAccount',
      required: true,
      index: true,
    },
    paymentMethod: {
      type: String,
      default: 'cash',
    },
    referenceNo: {
      type: String,
      default: '',
    },
    invoiceNo: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'approved', 'posted', 'rejected', 'cancelled', 'reversed'],
      default: 'posted',
      index: true,
    },
    journalEntryId: {
      type: Schema.Types.ObjectId,
      ref: 'JournalEntry',
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

TransactionSchema.index({ type: 1, date: -1 });

export const Transaction: Model<ITransaction> =
  mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
export default Transaction;
