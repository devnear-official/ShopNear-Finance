import { NextRequest } from 'next/server';
import { requirePermission } from '@/server/auth/guards';
import { PERMISSIONS } from '@/server/auth/permissions';
import { AuditService } from '@/server/services/audit.service';
import { ApiResponse } from '@/server/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.AUDIT_VIEW);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    const entityType = searchParams.get('entityType') || undefined;
    const action = searchParams.get('action') || undefined;
    const search = searchParams.get('search') || undefined;

    const result = await AuditService.getAuditLogs({
      page,
      limit,
      entityType,
      action,
      search,
    });

    return ApiResponse.success(result.logs, 'Audit logs retrieved', result.meta);
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
