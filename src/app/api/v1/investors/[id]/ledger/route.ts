import { NextRequest } from 'next/server';
import { InvestorService } from '@/server/services/investor.service';
import { ApiResponse } from '@/server/utils/api-response';
import { requireAuth } from '@/server/auth/guards';
import { can, PERMISSIONS } from '@/server/auth/permissions';
import { ForbiddenError } from '@/server/errors/app-error';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // RBAC: Investor can only see their own ledger
    if (user.role === 'investor' && user.investorId !== id) {
      throw new ForbiddenError('You can only access your own investment ledger.');
    } else if (user.role !== 'investor' && !can(user, PERMISSIONS.INVESTORS_VIEW_ALL)) {
      throw new ForbiddenError('You do not have permission to view investor ledgers.');
    }

    const { searchParams } = new URL(req.url);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    const result = await InvestorService.getInvestorLedger({
      investorId: id,
      startDate: startDateStr ? new Date(startDateStr) : undefined,
      endDate: endDateStr ? new Date(endDateStr) : undefined,
    });

    return ApiResponse.success(result);
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
