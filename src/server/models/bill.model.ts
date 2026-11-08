import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type BillStatus = 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'void';

export interface IBill extends Document {
  billNumber: string;
  partyId: Types.ObjectId; // Supplier
  issueDate: Date;
  dueDate: Date;
  total: number; // integer paisa
  paidAmount: number; // integer paisa
  status: BillStatus;
  journalEntryId?: Types.ObjectId;
  notes?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BillSchema = new Schema<IBill>(
  {
    billNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    partyId: {
      type: Schema.Types.ObjectId,
      ref: 'Party',
      required: true,
      index: true,
    },
    issueDate: {
      type: Date,
      required: true,
      index: true,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    total: {
      type: Number,
      required: true,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'issued', 'partially_paid', 'paid', 'overdue', 'void'],
      default: 'issued',
      index: true,
    },
    journalEntryId: {
      type: Schema.Types.ObjectId,
      ref: 'JournalEntry',
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

export const Bill: Model<IBill> =
  mongoose.models.Bill || mongoose.model<IBill>('Bill', BillSchema);
export default Bill;
