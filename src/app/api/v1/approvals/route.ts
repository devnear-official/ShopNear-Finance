import { NextRequest } from 'next/server';
import { Approval } from '@/server/models/approval.model';
import { Transaction } from '@/server/models/transaction.model';
import { connectDB } from '@/server/db/connect';
import { ApiResponse } from '@/server/utils/api-response';
import { requirePermission } from '@/server/auth/guards';
import { PERMISSIONS } from '@/server/auth/permissions';

export async function GET(req: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.TRANSACTIONS_APPROVE);
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = (searchParams.get('status') || 'pending') as 'pending' | 'approved' | 'rejected';

    const filter: Record<string, any> = {};
    if (status) filter.status = status;

    const approvals = await Approval.find(filter)
      .sort({ createdAt: -1 })
      .populate('requestedBy', 'name email role')
      .populate('decidedBy', 'name')
      .lean();

    // Enrich with transaction details
    const enriched = await Promise.all(
      approvals.map(async (app: any) => {
        let entityData = null;
        if (app.entityType === 'Transaction') {
          entityData = await Transaction.findById(app.entityId)
            .populate('categoryId', 'name')
            .populate('financialAccountId', 'name')
            .lean();
        }
        return {
          ...app,
          entity: entityData,
        };
      })
    );

    return ApiResponse.success(enriched);
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
