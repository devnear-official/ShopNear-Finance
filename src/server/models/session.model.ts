import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ISession extends Document {
  userId: Types.ObjectId;
  refreshTokenHash: string;
  ip?: string;
  userAgent?: string;
  expiresAt: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
      index: true,
    },
    ip: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index to auto-clean expired sessions
    },
    revokedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Session: Model<ISession> = mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);
export default Session;
