import { NextRequest } from 'next/server';
import { AccountService } from '@/server/services/account.service';
import { AccountTransfer } from '@/server/models/account-transfer.model';
import { connectDB } from '@/server/db/connect';
import { ApiResponse } from '@/server/utils/api-response';
import { requirePermission } from '@/server/auth/guards';
import { PERMISSIONS } from '@/server/auth/permissions';
import { withTransaction } from '@/server/db/withTransaction';
import { z } from 'zod';

const transferSchema = z.object({
  fromAccountId: z.string().min(1, 'Source account is required'),
  toAccountId: z.string().min(1, 'Destination account is required'),
  amount: z.number().int().positive('Transfer amount must be greater than 0'),
  fee: z.number().int().min(0).default(0),
  date: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    await requirePermission(PERMISSIONS.ACCOUNTS_TRANSFER);
    await connectDB();

    const transfers = await AccountTransfer.find()
      .sort({ date: -1, createdAt: -1 })
      .populate('fromAccountId', 'name type')
      .populate('toAccountId', 'name type')
      .populate('journalEntryId', 'entryNumber')
      .lean();

    return ApiResponse.success(transfers);
  } catch (err) {
    return ApiResponse.handle(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission(PERMISSIONS.ACCOUNTS_TRANSFER);
    const body = await req.json();
    const validated = transferSchema.parse(body);

    const transfer = await withTransaction(async (session) => {
      return await AccountService.transferFunds(
        {
          ...validated,
          userId: user.id,
        },
        session
      );
    });

    return ApiResponse.created(transfer, 'Funds transferred successfully.');
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
