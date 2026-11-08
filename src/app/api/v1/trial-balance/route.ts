import { NextRequest } from 'next/server';
import { AccountingService } from '@/server/services/accounting.service';
import { ApiResponse } from '@/server/utils/api-response';
import { requirePermission } from '@/server/auth/guards';
import { PERMISSIONS } from '@/server/auth/permissions';

export async function GET(req: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.REPORTS_FINANCIAL);
    const { searchParams } = new URL(req.url);

    const asOfStr = searchParams.get('asOfDate');
    const asOfDate = asOfStr ? new Date(asOfStr) : new Date();

    const report = await AccountingService.getTrialBalance(asOfDate);
    return ApiResponse.success(report, 'Trial balance calculated successfully');
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
