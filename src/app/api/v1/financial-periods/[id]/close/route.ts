import { NextRequest } from 'next/server';
import { FinancialPeriod } from '@/server/models/financial-period.model';
import { connectDB } from '@/server/db/connect';
import { ApiResponse } from '@/server/utils/api-response';
import { requirePermission } from '@/server/auth/guards';
import { PERMISSIONS } from '@/server/auth/permissions';
import { AuditService } from '@/server/services/audit.service';
import { NotFoundError } from '@/server/errors/app-error';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(PERMISSIONS.PERIODS_CLOSE);
    await connectDB();
    const { id } = await params;

    const period = await FinancialPeriod.findById(id);
    if (!period) {
      throw new NotFoundError('Financial period not found.');
    }

    period.status = 'closed';
    period.closedBy = user.id as unknown as typeof period.closedBy;
    period.closedAt = new Date();
    await period.save();

    await AuditService.log({
      actorId: user.id,
      action: 'PERIOD_CLOSE',
      entityType: 'FinancialPeriod',
      entityId: period._id.toString(),
      after: { name: period.name, status: 'closed' },
    });

    return ApiResponse.success(period, `Financial period "${period.name}" is now closed.`);
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
