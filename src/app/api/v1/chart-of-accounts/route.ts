import { NextRequest } from 'next/server';
import { ChartOfAccounts } from '@/server/models/chart-of-accounts.model';
import { connectDB } from '@/server/db/connect';
import { ApiResponse } from '@/server/utils/api-response';
import { requireAuth, requirePermission } from '@/server/auth/guards';
import { PERMISSIONS } from '@/server/auth/permissions';
import { z } from 'zod';

const createCoaSchema = z.object({
  code: z.string().min(3).max(10),
  name: z.string().min(2),
  type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']),
  subType: z.string().min(2),
  normalBalance: z.enum(['debit', 'credit']),
  parentId: z.string().optional(),
  allowPosting: z.boolean().default(true),
  description: z.string().optional(),
});

export async function GET() {
  try {
    await requireAuth();
    await connectDB();

    const accounts = await ChartOfAccounts.find().sort({ code: 1 }).lean();
    return ApiResponse.success(accounts);
  } catch (err) {
    return ApiResponse.handle(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.COA_MANAGE);
    await connectDB();

    const body = await req.json();
    const validated = createCoaSchema.parse(body);

    const account = await ChartOfAccounts.create({
      ...validated,
      isSystem: false,
      isActive: true,
    });

    return ApiResponse.created(account, 'Account added to Chart of Accounts');
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
