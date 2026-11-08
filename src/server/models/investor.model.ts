import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type InvestmentType = 'equity' | 'fixed_return' | 'profit_share';

export interface IInvestor extends Document {
  investorCode: string;
  userId?: Types.ObjectId;
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  nidRef?: string;
  joiningDate: Date;
  investmentType: InvestmentType;
  profitSharePercentage?: number; // e.g. 15.5%
  lossBearing: boolean;
  status: 'active' | 'inactive';
  notes?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InvestorSchema = new Schema<IInvestor>(
  {
    investorCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    nidRef: {
      type: String,
      default: '',
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    investmentType: {
      type: String,
      enum: ['equity', 'fixed_return', 'profit_share'],
      default: 'equity',
    },
    profitSharePercentage: {
      type: Number,
      default: 0,
    },
    lossBearing: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
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

export const Investor: Model<IInvestor> =
  mongoose.models.Investor || mongoose.model<IInvestor>('Investor', InvestorSchema);
export default Investor;
