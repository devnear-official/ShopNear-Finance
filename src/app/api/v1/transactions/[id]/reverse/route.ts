import { NextRequest } from 'next/server';
import { TransactionService } from '@/server/services/transaction.service';
import { ApiResponse } from '@/server/utils/api-response';
import { requirePermission } from '@/server/auth/guards';
import { PERMISSIONS } from '@/server/auth/permissions';
import { withTransaction } from '@/server/db/withTransaction';
import { z } from 'zod';

const reverseSchema = z.object({
  reason: z.string().min(5, 'Reversal reason is required'),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(PERMISSIONS.TRANSACTIONS_REVERSE);
    const { id } = await params;
    const body = await req.json();
    const validated = reverseSchema.parse(body);

    const reversed = await withTransaction(async (session) => {
      return await TransactionService.reverseTransaction(id, validated.reason, user.id, session);
    });

    return ApiResponse.success(reversed, `Transaction ${reversed.transactionNumber} has been reversed.`);
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
