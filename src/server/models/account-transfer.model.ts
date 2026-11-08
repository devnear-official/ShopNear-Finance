import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IAccountTransfer extends Document {
  fromAccountId: Types.ObjectId;
  toAccountId: Types.ObjectId;
  amount: number; // integer paisa transferred
  fee: number; // integer paisa fee (charged to fromAccount)
  date: Date;
  reference?: string;
  notes?: string;
  journalEntryId: Types.ObjectId;
  status: 'completed' | 'reversed';
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AccountTransferSchema = new Schema<IAccountTransfer>(
  {
    fromAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'FinancialAccount',
      required: true,
      index: true,
    },
    toAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'FinancialAccount',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    fee: {
      type: Number,
      default: 0,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    reference: {
      type: String,
      default: '',
    },
    notes: {
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
      enum: ['completed', 'reversed'],
      default: 'completed',
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

export const AccountTransfer: Model<IAccountTransfer> =
  mongoose.models.AccountTransfer ||
  mongoose.model<IAccountTransfer>('AccountTransfer', AccountTransferSchema);
export default AccountTransfer;
