import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type PartyType = 'customer' | 'supplier';

export interface IParty extends Document {
  name: string;
  type: PartyType;
  phone: string;
  email?: string;
  address?: string;
  openingBalance: number; // integer paisa
  status: 'active' | 'inactive';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PartySchema = new Schema<IParty>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['customer', 'supplier'],
      required: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    openingBalance: {
      type: Number,
      default: 0,
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
  },
  {
    timestamps: true,
  }
);

export const Party: Model<IParty> =
  mongoose.models.Party || mongoose.model<IParty>('Party', PartySchema);
export default Party;
