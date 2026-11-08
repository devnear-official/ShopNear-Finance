import { NextRequest } from 'next/server';
import { AccountService } from '@/server/services/account.service';
import { FinancialAccount } from '@/server/models/financial-account.model';
import { connectDB } from '@/server/db/connect';
import { ApiResponse } from '@/server/utils/api-response';
import { requireAuth, requirePermission } from '@/server/auth/guards';
import { PERMISSIONS } from '@/server/auth/permissions';
import { withTransaction } from '@/server/db/withTransaction';
import { z } from 'zod';

const createAccountSchema = z.object({
  name: z.string().min(2, 'Account name is required'),
  type: z.enum(['cash', 'bank', 'mobile_banking', 'petty_cash']),
  accountNumber: z.string().optional(),
  bankName: z.string().optional(),
  branchName: z.string().optional(),
  routingNumber: z.string().optional(),
  provider: z.enum(['bKash', 'Nagad', 'Rocket', 'Upay', 'other']).optional(),
  openingBalance: z.number().int().min(0).default(0),
  openingDate: z.string().optional(),
});

export async function GET() {
  try {
    await requirePermission(PERMISSIONS.ACCOUNTS_VIEW);
    await connectDB();

    const accounts = await FinancialAccount.find().sort({ type: 1, name: 1 }).populate('coaAccountId').lean();

    // Sync live ledger balances
    const synced = await Promise.all(
      accounts.map(async (acc) => {
        const balance = await AccountService.getAccountBalance(acc._id.toString());
        return {
          ...acc,
          cachedBalance: balance,
        };
      })
    );

    return ApiResponse.success(synced);
  } catch (err) {
    return ApiResponse.handle(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission(PERMISSIONS.ACCOUNTS_MANAGE);
    const body = await req.json();
    const validated = createAccountSchema.parse(body);

    const account = await withTransaction(async (session) => {
      return await AccountService.createAccount(
        {
          ...validated,
          userId: user.id,
        },
        session
      );
    });

    return ApiResponse.created(account, `Financial account "${account.name}" created successfully.`);
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
