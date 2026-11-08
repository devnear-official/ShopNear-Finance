import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/server/auth/guards';
import { DashboardService } from '@/server/services/dashboard.service';
import { ApiResponse } from '@/server/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return ApiResponse.error('Unauthorized', 401, 'UNAUTHORIZED');
    }

    if (user.role === 'investor') {
      const data = await DashboardService.getInvestorOverview(user.id);
      return ApiResponse.success({
        isInvestor: true,
        data,
      });
    }

    const data = await DashboardService.getAdminOverview();
    return ApiResponse.success({
      isInvestor: false,
      data,
    });
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
