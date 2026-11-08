import { NextRequest } from 'next/server';
import { TransactionService } from '@/server/services/transaction.service';
import { ApiResponse } from '@/server/utils/api-response';
import { requirePermission } from '@/server/auth/guards';
import { PERMISSIONS } from '@/server/auth/permissions';
import { z } from 'zod';

const rejectSchema = z.object({
  reason: z.string().min(3, 'Rejection reason is required'),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(PERMISSIONS.TRANSACTIONS_APPROVE);
    const { id } = await params;
    const body = await req.json();
    const validated = rejectSchema.parse(body);

    const rejected = await TransactionService.rejectTransaction(id, validated.reason, user.id);
    return ApiResponse.success(rejected, `Transaction ${rejected.transactionNumber} has been rejected.`);
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
