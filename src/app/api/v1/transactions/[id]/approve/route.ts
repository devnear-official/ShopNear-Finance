import { NextRequest } from 'next/server';
import { TransactionService } from '@/server/services/transaction.service';
import { ApiResponse } from '@/server/utils/api-response';
import { requirePermission } from '@/server/auth/guards';
import { PERMISSIONS } from '@/server/auth/permissions';
import { withTransaction } from '@/server/db/withTransaction';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(PERMISSIONS.TRANSACTIONS_APPROVE);
    const { id } = await params;

    const approved = await withTransaction(async (session) => {
      return await TransactionService.approveTransaction(id, user.id, user.role, session);
    });

    return ApiResponse.success(approved, `Transaction ${approved.transactionNumber} approved and posted.`);
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
