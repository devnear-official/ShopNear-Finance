import { NextRequest } from 'next/server';
import { requirePermission } from '@/server/auth/guards';
import { PERMISSIONS } from '@/server/auth/permissions';
import { ReportService } from '@/server/services/report.service';
import { ApiResponse } from '@/server/utils/api-response';
import { startOfYear, endOfDay } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.REPORTS_VIEW);

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const startDate = startDateParam ? new Date(startDateParam) : startOfYear(new Date());
    const endDate = endDateParam ? endOfDay(new Date(endDateParam)) : endOfDay(new Date());

    const report = await ReportService.getProfitAndLoss(startDate, endDate);
    return ApiResponse.success(report);
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
