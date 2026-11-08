import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFiscalYear extends Document {
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

const FiscalYearSchema = new Schema<IFiscalYear>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'closed'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const FiscalYear: Model<IFiscalYear> =
  mongoose.models.FiscalYear || mongoose.model<IFiscalYear>('FiscalYear', FiscalYearSchema);
export default FiscalYear;
