import { NextRequest } from 'next/server';
import { BusinessFinanceService } from '@/server/services/business-finance.service';
import { Loan } from '@/server/models/loan.model';
import { connectDB } from '@/server/db/connect';
import { ApiResponse } from '@/server/utils/api-response';
import { requirePermission } from '@/server/auth/guards';
import { PERMISSIONS } from '@/server/auth/permissions';
import { withTransaction } from '@/server/db/withTransaction';
import { z } from 'zod';

const createLoanSchema = z.object({
  direction: z.enum(['taken', 'given']),
  partyName: z.string().min(2, 'Party name is required'),
  partyContact: z.string().optional(),
  principal: z.number().int().positive('Principal must be greater than zero'),
  interestRate: z.number().min(0).default(0),
  interestType: z.enum(['flat', 'reducing']).default('flat'),
  startDate: z.string().optional(),
  termMonths: z.number().int().min(1).default(12),
  financialAccountId: z.string().min(1, 'Financial account is required'),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.LOANS_VIEW);
    await connectDB();

    const { searchParams } = new URL(req.url);
    const direction = searchParams.get('direction');

    const filter: Record<string, unknown> = {};
    if (direction) filter.direction = direction;

    const loans = await Loan.find(filter)
      .sort({ createdAt: -1 })
      .populate('financialAccountId', 'name type')
      .lean();

    return ApiResponse.success(loans);
  } catch (err) {
    return ApiResponse.handle(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission(PERMISSIONS.LOANS_CREATE);
    const body = await req.json();
    const validated = createLoanSchema.parse(body);

    const loan = await withTransaction(async (session) => {
      return await BusinessFinanceService.createLoan(
        {
          ...validated,
          userId: user.id,
        },
        session
      );
    });

    return ApiResponse.created(loan, `Loan ${loan.loanNumber} created and disbursed successfully.`);
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
