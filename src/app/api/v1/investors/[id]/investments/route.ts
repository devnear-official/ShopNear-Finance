import { NextRequest } from 'next/server';
import { InvestorService } from '@/server/services/investor.service';
import { ApiResponse } from '@/server/utils/api-response';
import { requirePermission } from '@/server/auth/guards';
import { PERMISSIONS } from '@/server/auth/permissions';
import { withTransaction } from '@/server/db/withTransaction';
import { z } from 'zod';

const investSchema = z.object({
  amount: z.number().int().positive('Investment amount must be greater than 0'),
  financialAccountId: z.string().min(1, 'Target financial account is required'),
  date: z.string().optional(),
  type: z.enum(['initial', 'additional']).default('additional'),
  notes: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(PERMISSIONS.INVESTORS_INVEST);
    const { id } = await params;
    const body = await req.json();
    const validated = investSchema.parse(body);

    const investment = await withTransaction(async (session) => {
      return await InvestorService.recordInvestment(
        {
          ...validated,
          investorId: id,
          userId: user.id,
        },
        session
      );
    });

    return ApiResponse.created(investment, 'Investment recorded and posted to equity ledger.');
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
