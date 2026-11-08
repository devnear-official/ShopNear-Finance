import { NextRequest } from 'next/server';
import { InvestorService } from '@/server/services/investor.service';
import { ApiResponse } from '@/server/utils/api-response';
import { requirePermission } from '@/server/auth/guards';
import { PERMISSIONS } from '@/server/auth/permissions';
import { withTransaction } from '@/server/db/withTransaction';
import { z } from 'zod';

const withdrawSchema = z.object({
  amount: z.number().int().positive('Withdrawal amount must be greater than 0'),
  financialAccountId: z.string().min(1, 'Source financial account is required'),
  date: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(PERMISSIONS.INVESTORS_WITHDRAW);
    const { id } = await params;
    const body = await req.json();
    const validated = withdrawSchema.parse(body);

    const withdrawal = await withTransaction(async (session) => {
      return await InvestorService.recordWithdrawal(
        {
          ...validated,
          investorId: id,
          userId: user.id,
        },
        session
      );
    });

    return ApiResponse.created(withdrawal, 'Withdrawal recorded and posted to ledger.');
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
