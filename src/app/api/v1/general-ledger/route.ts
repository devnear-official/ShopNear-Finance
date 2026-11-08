import { NextRequest } from 'next/server';
import { AccountingService } from '@/server/services/accounting.service';
import { ApiResponse } from '@/server/utils/api-response';
import { requirePermission } from '@/server/auth/guards';
import { PERMISSIONS } from '@/server/auth/permissions';

export async function GET(req: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.JOURNAL_VIEW);
    const { searchParams } = new URL(req.url);

    const accountId = searchParams.get('accountId');
    if (!accountId) {
      return ApiResponse.error('Account ID query parameter is required.', 400, 'VALIDATION_ERROR');
    }

    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    const result = await AccountingService.getGeneralLedger({
      accountId,
      startDate: startDateStr ? new Date(startDateStr) : undefined,
      endDate: endDateStr ? new Date(endDateStr) : undefined,
    });

    return ApiResponse.success(result, 'General ledger retrieved successfully');
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
