import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IReconciliationItem {
  lineId: Types.ObjectId;
  matched: boolean;
  notes?: string;
}

export interface IAccountReconciliation extends Document {
  financialAccountId: Types.ObjectId;
  statementDate: Date;
  statementBalance: number; // integer paisa from external statement
  ledgerBalance: number; // integer paisa computed from system ledger
  difference: number; // integer paisa
  items: IReconciliationItem[];
  status: 'draft' | 'reconciled';
  reconciledBy?: Types.ObjectId;
  reconciledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReconciliationItemSchema = new Schema<IReconciliationItem>(
  {
    lineId: {
      type: Schema.Types.ObjectId,
      ref: 'JournalEntryLine',
      required: true,
    },
    matched: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const AccountReconciliationSchema = new Schema<IAccountReconciliation>(
  {
    financialAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'FinancialAccount',
      required: true,
      index: true,
    },
    statementDate: {
      type: Date,
      required: true,
    },
    statementBalance: {
      type: Number,
      required: true,
    },
    ledgerBalance: {
      type: Number,
      required: true,
    },
    difference: {
      type: Number,
      default: 0,
    },
    items: [ReconciliationItemSchema],
    status: {
      type: String,
      enum: ['draft', 'reconciled'],
      default: 'reconciled',
    },
    reconciledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reconciledAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const AccountReconciliation: Model<IAccountReconciliation> =
  mongoose.models.AccountReconciliation ||
  mongoose.model<IAccountReconciliation>('AccountReconciliation', AccountReconciliationSchema);
export default AccountReconciliation;
