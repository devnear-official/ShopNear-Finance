import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
export type NormalBalance = 'debit' | 'credit';

export interface IChartOfAccount extends Document {
  code: string;
  name: string;
  type: AccountType;
  subType: string;
  normalBalance: NormalBalance;
  parentId?: Types.ObjectId;
  isSystem: boolean;
  isActive: boolean;
  allowPosting: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChartOfAccountsSchema = new Schema<IChartOfAccount>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['asset', 'liability', 'equity', 'revenue', 'expense'],
      index: true,
    },
    subType: {
      type: String,
      required: true,
      trim: true,
    },
    normalBalance: {
      type: String,
      required: true,
      enum: ['debit', 'credit'],
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'ChartOfAccounts',
      default: null,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    allowPosting: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const ChartOfAccounts: Model<IChartOfAccount> =
  mongoose.models.ChartOfAccounts ||
  mongoose.model<IChartOfAccount>('ChartOfAccounts', ChartOfAccountsSchema);
export default ChartOfAccounts;
