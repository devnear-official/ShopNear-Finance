import { NextRequest } from 'next/server';
import { requirePermission } from '@/server/auth/guards';
import { PERMISSIONS } from '@/server/auth/permissions';
import { ReportService } from '@/server/services/report.service';
import { ApiResponse } from '@/server/utils/api-response';
import { endOfDay } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.REPORTS_VIEW);

    const { searchParams } = new URL(req.url);
    const asOfDateParam = searchParams.get('asOfDate');
    const asOfDate = asOfDateParam ? endOfDay(new Date(asOfDateParam)) : endOfDay(new Date());

    const report = await ReportService.getBalanceSheet(asOfDate);
    return ApiResponse.success(report);
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
