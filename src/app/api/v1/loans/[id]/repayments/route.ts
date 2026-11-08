import { NextRequest } from 'next/server';
import { BusinessFinanceService } from '@/server/services/business-finance.service';
import { ApiResponse } from '@/server/utils/api-response';
import { requirePermission } from '@/server/auth/guards';
import { PERMISSIONS } from '@/server/auth/permissions';
import { withTransaction } from '@/server/db/withTransaction';
import { z } from 'zod';

const repaySchema = z.object({
  principal: z.number().int().min(0),
  interest: z.number().int().min(0).default(0),
  financialAccountId: z.string().min(1, 'Financial account is required'),
  date: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(PERMISSIONS.LOANS_REPAY);
    const { id } = await params;
    const body = await req.json();
    const validated = repaySchema.parse(body);

    const repayment = await withTransaction(async (session) => {
      return await BusinessFinanceService.recordLoanRepayment(
        {
          ...validated,
          loanId: id,
          userId: user.id,
        },
        session
      );
    });

    return ApiResponse.created(repayment, 'Loan repayment recorded and posted successfully.');
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
