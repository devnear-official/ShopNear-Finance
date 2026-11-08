import { NextRequest } from 'next/server';
import { FinancialPeriod } from '@/server/models/financial-period.model';
import { FiscalYear } from '@/server/models/fiscal-year.model';
import { connectDB } from '@/server/db/connect';
import { ApiResponse } from '@/server/utils/api-response';
import { requirePermission } from '@/server/auth/guards';
import { PERMISSIONS } from '@/server/auth/permissions';

export async function GET() {
  try {
    await requirePermission(PERMISSIONS.PERIODS_VIEW);
    await connectDB();

    const [periods, fiscalYears] = await Promise.all([
      FinancialPeriod.find().sort({ startDate: -1 }).populate('closedBy', 'name').lean(),
      FiscalYear.find().sort({ startDate: -1 }).lean(),
    ]);

    return ApiResponse.success({ periods, fiscalYears });
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
