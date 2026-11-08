import { NextRequest } from 'next/server';
import { requirePermission } from '@/server/auth/guards';
import { PERMISSIONS } from '@/server/auth/permissions';
import { ReportService } from '@/server/services/report.service';
import { ApiResponse } from '@/server/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.REPORTS_VIEW);

    const { searchParams } = new URL(req.url);
    const type = (searchParams.get('type') || 'receivables') as 'receivables' | 'payables';

    const report = await ReportService.getAgingReport(type);
    return ApiResponse.success(report);
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
