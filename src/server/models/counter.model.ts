import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICounter extends Document {
  key: string;
  seq: number;
}

const CounterSchema = new Schema<ICounter>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    seq: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Counter: Model<ICounter> =
  mongoose.models.Counter || mongoose.model<ICounter>('Counter', CounterSchema);

/**
 * Atomically generates next formatted sequence number using findOneAndUpdate $inc.
 * E.g., getNextSequenceNumber('JE', 2026) -> 'JE-2026-000001'
 */
export async function getNextSequenceNumber(
  prefix: string,
  year: number = new Date().getFullYear(),
  digits: number = 6,
  session?: mongoose.ClientSession
): Promise<string> {
  const key = `${prefix}-${year}`;
  const options: mongoose.QueryOptions = {
    upsert: true,
    returnDocument: 'after',
  };
  if (session) {
    options.session = session;
  }

  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    options
  );

  const seq = counter ? counter.seq : 1;
  const seqStr = String(seq).padStart(digits, '0');
  return `${prefix}-${year}-${seqStr}`;
}

export default Counter;
