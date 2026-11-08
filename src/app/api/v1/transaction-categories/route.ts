import { NextRequest } from 'next/server';
import { TransactionCategory } from '@/server/models/transaction-category.model';
import { ChartOfAccounts } from '@/server/models/chart-of-accounts.model';
import { connectDB } from '@/server/db/connect';
import { ApiResponse } from '@/server/utils/api-response';
import { requireAuth } from '@/server/auth/guards';
import { z } from 'zod';

const createCategorySchema = z.object({
  name: z.string().min(2),
  type: z.enum(['income', 'expense']),
  defaultCoaAccountId: z.string().min(1),
});

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    const filter: Record<string, unknown> = { isActive: true };
    if (type) filter.type = type;

    let categories = await TransactionCategory.find(filter).sort({ name: 1 }).populate('defaultCoaAccountId').lean();

    // Auto-seed default categories if empty
    if (categories.length === 0) {
      const coaIncome = await ChartOfAccounts.findOne({ code: '4001' }) || await ChartOfAccounts.findOne({ type: 'revenue' });
      const coaExpense = await ChartOfAccounts.findOne({ code: '5100' }) || await ChartOfAccounts.findOne({ type: 'expense' });

      if (coaIncome && coaExpense) {
        await TransactionCategory.insertMany([
          { name: 'Product Sales', type: 'income', defaultCoaAccountId: coaIncome._id, isActive: true },
          { name: 'Service Revenue', type: 'income', defaultCoaAccountId: coaIncome._id, isActive: true },
          { name: 'Office Rent', type: 'expense', defaultCoaAccountId: coaExpense._id, isActive: true },
          { name: 'Employee Salary', type: 'expense', defaultCoaAccountId: coaExpense._id, isActive: true },
          { name: 'Marketing & Ads', type: 'expense', defaultCoaAccountId: coaExpense._id, isActive: true },
          { name: 'Utilities & Bills', type: 'expense', defaultCoaAccountId: coaExpense._id, isActive: true },
        ]);
        categories = await TransactionCategory.find(filter).sort({ name: 1 }).populate('defaultCoaAccountId').lean();
      }
    }

    return ApiResponse.success(categories);
  } catch (err) {
    return ApiResponse.handle(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    await connectDB();
    const body = await req.json();
    const validated = createCategorySchema.parse(body);

    const category = await TransactionCategory.create(validated);
    return ApiResponse.created(category, 'Category created');
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
