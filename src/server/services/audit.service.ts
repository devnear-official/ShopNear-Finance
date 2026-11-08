import { AuditLog } from '../models/audit-log.model';
import { connectDB } from '../db/connect';

export interface LogAuditParams {
  actorId?: string;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

export class AuditService {
  /**
   * Records an immutable audit log entry.
   */
  static async log(params: LogAuditParams): Promise<void> {
    try {
      await connectDB();
      await AuditLog.create({
        actorId: params.actorId,
        actorRole: params.actorRole || '',
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        before: params.before,
        after: params.after,
        ip: params.ip || '',
        userAgent: params.userAgent || '',
        at: new Date(),
      });
    } catch (err) {
      console.error('[AuditService.log] Failed to write audit log:', err);
    }
  }
}
