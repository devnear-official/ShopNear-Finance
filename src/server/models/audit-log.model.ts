import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { ImmutableRecordError } from '../errors/app-error';

export interface IAuditLog extends Document {
  actorId?: Types.ObjectId;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  at: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    actorRole: {
      type: String,
      default: '',
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      index: true,
    },
    before: {
      type: Schema.Types.Mixed,
    },
    after: {
      type: Schema.Types.Mixed,
    },
    ip: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    at: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Immutability hooks: Prevent updates or deletes on audit logs
AuditLogSchema.pre('updateOne', function () {
  throw new ImmutableRecordError('Audit logs are append-only and cannot be updated.');
});

AuditLogSchema.pre('updateMany', function () {
  throw new ImmutableRecordError('Audit logs are append-only and cannot be updated.');
});

AuditLogSchema.pre('findOneAndUpdate', function () {
  throw new ImmutableRecordError('Audit logs are append-only and cannot be updated.');
});

AuditLogSchema.pre('deleteOne', function () {
  throw new ImmutableRecordError('Audit logs are append-only and cannot be deleted.');
});

AuditLogSchema.pre('deleteMany', function () {
  throw new ImmutableRecordError('Audit logs are append-only and cannot be deleted.');
});

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
export default AuditLog;
