import { NextRequest } from 'next/server';
import { InvestorService } from '@/server/services/investor.service';
import { ApiResponse } from '@/server/utils/api-response';
import { requirePermission } from '@/server/auth/guards';
import { PERMISSIONS } from '@/server/auth/permissions';
import { withTransaction } from '@/server/db/withTransaction';
import { z } from 'zod';

const allocateSchema = z.object({
  periodId: z.string().min(1, 'Period is required'),
  amount: z.number().int().positive('Allocation amount must be greater than 0'),
  kind: z.enum(['profit', 'loss']).default('profit'),
  basis: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(PERMISSIONS.INVESTORS_ALLOCATE_PROFIT);
    const { id } = await params;
    const body = await req.json();
    const validated = allocateSchema.parse(body);

    const allocation = await withTransaction(async (session) => {
      return await InvestorService.allocateProfitLoss(
        {
          ...validated,
          investorId: id,
          userId: user.id,
        },
        session
      );
    });

    return ApiResponse.created(allocation, `${validated.kind === 'profit' ? 'Profit' : 'Loss'} allocated successfully.`);
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
