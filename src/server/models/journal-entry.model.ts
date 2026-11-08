import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { ImmutableRecordError } from '../errors/app-error';

export type JournalSourceType =
  | 'investment'
  | 'withdrawal'
  | 'income'
  | 'expense'
  | 'transfer'
  | 'loan'
  | 'loan_repayment'
  | 'invoice'
  | 'receipt'
  | 'payable'
  | 'adjustment'
  | 'reversal'
  | 'opening'
  | 'manual'
  | 'profit_allocation';

export type JournalStatus = 'draft' | 'posted' | 'reversed';

export interface IJournalEntry extends Document {
  entryNumber: string;
  date: Date;
  periodId: Types.ObjectId;
  description: string;
  sourceType: JournalSourceType;
  sourceId?: string;
  status: JournalStatus;
  totalDebit: number; // integer paisa
  totalCredit: number; // integer paisa
  reversalOf?: Types.ObjectId;
  reversedBy?: Types.ObjectId;
  postedBy?: Types.ObjectId;
  postedAt?: Date;
  idempotencyKey?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const JournalEntrySchema = new Schema<IJournalEntry>(
  {
    entryNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    periodId: {
      type: Schema.Types.ObjectId,
      ref: 'FinancialPeriod',
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    sourceType: {
      type: String,
      required: true,
      index: true,
    },
    sourceId: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'posted', 'reversed'],
      default: 'posted',
      index: true,
    },
    totalDebit: {
      type: Number,
      required: true,
    },
    totalCredit: {
      type: Number,
      required: true,
    },
    reversalOf: {
      type: Schema.Types.ObjectId,
      ref: 'JournalEntry',
    },
    reversedBy: {
      type: Schema.Types.ObjectId,
      ref: 'JournalEntry',
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    postedAt: {
      type: Date,
      default: Date.now,
    },
    idempotencyKey: {
      type: String,
      index: true,
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

// Prevent editing or deleting posted journal entries (immutability)
JournalEntrySchema.pre('updateOne', function () {
  throw new ImmutableRecordError('Posted journal entries cannot be edited. Create a reversal entry.');
});

JournalEntrySchema.pre('updateMany', function () {
  throw new ImmutableRecordError('Posted journal entries cannot be edited. Create a reversal entry.');
});

JournalEntrySchema.pre('deleteOne', function () {
  throw new ImmutableRecordError('Posted journal entries cannot be deleted.');
});

JournalEntrySchema.pre('deleteMany', function () {
  throw new ImmutableRecordError('Posted journal entries cannot be deleted.');
});

export const JournalEntry: Model<IJournalEntry> =
  mongoose.models.JournalEntry ||
  mongoose.model<IJournalEntry>('JournalEntry', JournalEntrySchema);
export default JournalEntry;
