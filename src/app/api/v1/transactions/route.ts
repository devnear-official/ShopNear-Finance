import { NextRequest } from 'next/server';
import { TransactionService } from '@/server/services/transaction.service';
import { Transaction } from '@/server/models/transaction.model';
import { connectDB } from '@/server/db/connect';
import { ApiResponse } from '@/server/utils/api-response';
import { requireAuth, requirePermission } from '@/server/auth/guards';
import { PERMISSIONS } from '@/server/auth/permissions';
import { withTransaction } from '@/server/db/withTransaction';
import { z } from 'zod';

const createTrxSchema = z.object({
  type: z.enum(['income', 'expense', 'asset_purchase', 'adjustment']),
  amount: z.number().int().positive('Amount must be greater than zero'),
  categoryId: z.string().min(1, 'Category is required'),
  financialAccountId: z.string().min(1, 'Financial account is required'),
  date: z.string().optional(),
  subcategory: z.string().optional(),
  partyName: z.string().optional(),
  paymentMethod: z.string().optional(),
  referenceNo: z.string().optional(),
  invoiceNo: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  description: z.string().min(3, 'Description must be at least 3 characters'),
  requireApproval: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.TRANSACTIONS_VIEW);
    await connectDB();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (type && type !== 'all') filter.type = type;
    if (status && status !== 'all') filter.status = status;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('categoryId', 'name type')
        .populate('financialAccountId', 'name type')
        .populate('submittedBy', 'name')
        .populate('journalEntryId', 'entryNumber')
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    return ApiResponse.success(transactions, 'Transactions retrieved', {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    return ApiResponse.handle(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission(PERMISSIONS.TRANSACTIONS_CREATE);
    const body = await req.json();
    const validated = createTrxSchema.parse(body);

    const transaction = await withTransaction(async (session) => {
      return await TransactionService.createTransaction(
        {
          ...validated,
          userId: user.id,
          userRole: user.role,
        },
        session
      );
    });

    const msg =
      transaction.status === 'pending_approval'
        ? 'Transaction submitted for approval.'
        : `Transaction ${transaction.transactionNumber} posted successfully.`;

    return ApiResponse.created(transaction, msg);
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
