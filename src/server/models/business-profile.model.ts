import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBusinessProfile extends Document {
  name: string;
  legalName?: string;
  logo?: string;
  address?: string;
  phone: string;
  email: string;
  tinBin?: string;
  currency: string;
  currencySymbol: string;
  fiscalYearStartMonth: number;
  invoicePrefix: string;
  billPrefix: string;
  receiptPrefix: string;
  voucherPrefix: string;
  timezone: string;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessProfileSchema = new Schema<IBusinessProfile>(
  {
    name: {
      type: String,
      required: true,
      default: 'ShopNear Finance',
      trim: true,
    },
    legalName: {
      type: String,
      default: 'ShopNear Technologies Ltd.',
      trim: true,
    },
    logo: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: 'Dhaka, Bangladesh',
    },
    phone: {
      type: String,
      default: '+880 1700-000000',
    },
    email: {
      type: String,
      default: 'finance@shopnear.test',
      trim: true,
    },
    tinBin: {
      type: String,
      default: 'BIN-9876543210',
    },
    currency: {
      type: String,
      default: 'BDT',
    },
    currencySymbol: {
      type: String,
      default: '৳',
    },
    fiscalYearStartMonth: {
      type: Number,
      default: 1, // January
    },
    invoicePrefix: {
      type: String,
      default: 'INV',
    },
    billPrefix: {
      type: String,
      default: 'BILL',
    },
    receiptPrefix: {
      type: String,
      default: 'RCT',
    },
    voucherPrefix: {
      type: String,
      default: 'JV',
    },
    timezone: {
      type: String,
      default: 'Asia/Dhaka',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const BusinessProfile: Model<IBusinessProfile> =
  mongoose.models.BusinessProfile ||
  mongoose.model<IBusinessProfile>('BusinessProfile', BusinessProfileSchema);
