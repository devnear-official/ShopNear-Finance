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

export interface GetAuditLogsParams {
  page?: number;
  limit?: number;
  entityType?: string;
  action?: string;
  actorId?: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
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

  /**
   * Queries paginated audit logs with flexible filtering.
   */
  static async getAuditLogs(params: GetAuditLogsParams = {}) {
    await connectDB();

    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (params.entityType) {
      filter.entityType = params.entityType;
    }

    if (params.action) {
      filter.action = params.action;
    }

    if (params.actorId) {
      filter.actorId = params.actorId;
    }

    if (params.startDate || params.endDate) {
      filter.at = {};
      if (params.startDate) filter.at.$gte = params.startDate;
      if (params.endDate) filter.at.$lte = params.endDate;
    }

    if (params.search) {
      filter.$or = [
        { action: { $regex: params.search, $options: 'i' } },
        { entityType: { $regex: params.search, $options: 'i' } },
        { entityId: { $regex: params.search, $options: 'i' } },
        { ip: { $regex: params.search, $options: 'i' } },
      ];
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ at: -1 })
        .skip(skip)
        .limit(limit)
        .populate('actorId', 'name email role')
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    return {
      logs: logs.map((log: any) => ({
        id: log._id.toString(),
        actor: log.actorId
          ? {
              id: log.actorId._id.toString(),
              name: log.actorId.name,
              email: log.actorId.email,
              role: log.actorId.role,
            }
          : null,
        actorRole: log.actorRole,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        before: log.before,
        after: log.after,
        ip: log.ip,
        userAgent: log.userAgent,
        at: log.at,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
