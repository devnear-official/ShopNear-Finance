import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { ImmutableRecordError } from '../errors/app-error';

export interface IJournalEntryLine extends Document {
  journalEntryId: Types.ObjectId;
  accountId: Types.ObjectId; // COA account
  debit: number; // integer paisa
  credit: number; // integer paisa
  description: string;
  financialAccountId?: Types.ObjectId;
  investorId?: Types.ObjectId;
  partyType?: string;
  partyId?: string;
  date: Date; // denormalized for ledger queries
  createdAt: Date;
}

const JournalEntryLineSchema = new Schema<IJournalEntryLine>(
  {
    journalEntryId: {
      type: Schema.Types.ObjectId,
      ref: 'JournalEntry',
      required: true,
      index: true,
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'ChartOfAccounts',
      required: true,
      index: true,
    },
    debit: {
      type: Number,
      default: 0,
    },
    credit: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      default: '',
    },
    financialAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'FinancialAccount',
      index: true,
    },
    investorId: {
      type: Schema.Types.ObjectId,
      ref: 'Investor',
      index: true,
    },
    partyType: {
      type: String,
    },
    partyId: {
      type: String,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

// High performance compound indexes for General Ledger and Investor queries
JournalEntryLineSchema.index({ accountId: 1, date: 1 });
JournalEntryLineSchema.index({ investorId: 1, date: 1 });
JournalEntryLineSchema.index({ financialAccountId: 1, date: 1 });

// Immutability hooks
JournalEntryLineSchema.pre('updateOne', function () {
  throw new ImmutableRecordError('Posted journal lines cannot be updated.');
});
JournalEntryLineSchema.pre('updateMany', function () {
  throw new ImmutableRecordError('Posted journal lines cannot be updated.');
});
JournalEntryLineSchema.pre('deleteOne', function () {
  throw new ImmutableRecordError('Posted journal lines cannot be deleted.');
});
JournalEntryLineSchema.pre('deleteMany', function () {
  throw new ImmutableRecordError('Posted journal lines cannot be deleted.');
});

export const JournalEntryLine: Model<IJournalEntryLine> =
  mongoose.models.JournalEntryLine ||
  mongoose.model<IJournalEntryLine>('JournalEntryLine', JournalEntryLineSchema);
export default JournalEntryLine;
