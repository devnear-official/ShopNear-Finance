import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type CategoryType = 'income' | 'expense';

export interface ITransactionCategory extends Document {
  name: string;
  type: CategoryType;
  parentId?: Types.ObjectId;
  defaultCoaAccountId: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionCategorySchema = new Schema<ITransactionCategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true,
      index: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'TransactionCategory',
      default: null,
    },
    defaultCoaAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'ChartOfAccounts',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const TransactionCategory: Model<ITransactionCategory> =
  mongoose.models.TransactionCategory ||
  mongoose.model<ITransactionCategory>('TransactionCategory', TransactionCategorySchema);
export default TransactionCategory;
