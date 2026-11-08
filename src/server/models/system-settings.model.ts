import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISystemSettings extends Document {
  makerCheckerEnabled: boolean;
  approvalThresholdPaisa: number;
  allowNegativeCash: boolean;
  autoLockClosedPeriods: boolean;
  defaultLoanInterestRate: number;
  loginRateLimitAttempts: number;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SystemSettingsSchema = new Schema<ISystemSettings>(
  {
    makerCheckerEnabled: {
      type: Boolean,
      default: true,
    },
    approvalThresholdPaisa: {
      type: Number,
      default: 5000000, // 50,000.00 BDT
    },
    allowNegativeCash: {
      type: Boolean,
      default: false,
    },
    autoLockClosedPeriods: {
      type: Boolean,
      default: true,
    },
    defaultLoanInterestRate: {
      type: Number,
      default: 9.0, // 9% per annum
    },
    loginRateLimitAttempts: {
      type: Number,
      default: 5,
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

export const SystemSettings: Model<ISystemSettings> =
  mongoose.models.SystemSettings ||
  mongoose.model<ISystemSettings>('SystemSettings', SystemSettingsSchema);
