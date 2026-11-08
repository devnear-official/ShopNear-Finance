import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type FinancialAccountType = 'cash' | 'bank' | 'mobile_banking' | 'petty_cash';
export type MobileBankingProvider = 'bKash' | 'Nagad' | 'Rocket' | 'Upay' | 'other';

export interface IFinancialAccount extends Document {
  name: string;
  type: FinancialAccountType;
  accountNumber?: string;
  bankName?: string;
  branchName?: string;
  routingNumber?: string;
  provider?: MobileBankingProvider;
  coaAccountId: Types.ObjectId; // Linked asset account in Chart of Accounts
  openingBalance: number; // integer paisa
  openingDate: Date;
  cachedBalance: number; // integer paisa
  status: 'active' | 'inactive';
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FinancialAccountSchema = new Schema<IFinancialAccount>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['cash', 'bank', 'mobile_banking', 'petty_cash'],
      required: true,
      index: true,
    },
    accountNumber: {
      type: String,
      trim: true,
      default: '',
    },
    bankName: {
      type: String,
      trim: true,
      default: '',
    },
    branchName: {
      type: String,
      trim: true,
      default: '',
    },
    routingNumber: {
      type: String,
      trim: true,
      default: '',
    },
    provider: {
      type: String,
      enum: ['bKash', 'Nagad', 'Rocket', 'Upay', 'other'],
    },
    coaAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'ChartOfAccounts',
      required: true,
      index: true,
    },
    openingBalance: {
      type: Number,
      default: 0,
    },
    openingDate: {
      type: Date,
      default: Date.now,
    },
    cachedBalance: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
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

export const FinancialAccount: Model<IFinancialAccount> =
  mongoose.models.FinancialAccount ||
  mongoose.model<IFinancialAccount>('FinancialAccount', FinancialAccountSchema);
export default FinancialAccount;
