import { NextRequest } from 'next/server';
import { FinancialAccount } from '@/server/models/financial-account.model';
import { JournalEntryLine } from '@/server/models/journal-entry-line.model';
import { connectDB } from '@/server/db/connect';
import { ApiResponse } from '@/server/utils/api-response';
import { requirePermission } from '@/server/auth/guards';
import { PERMISSIONS } from '@/server/auth/permissions';
import { NotFoundError } from '@/server/errors/app-error';
import { Types } from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(PERMISSIONS.ACCOUNTS_VIEW);
    await connectDB();
    const { id } = await params;

    const account = await FinancialAccount.findById(id).lean();
    if (!account) {
      throw new NotFoundError('Financial account not found');
    }

    const { searchParams } = new URL(req.url);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    const accObjId = new Types.ObjectId(id);

    // Calculate opening balance before startDate
    let openingBalance = 0;
    if (startDateStr) {
      const priorAgg = await JournalEntryLine.aggregate([
        {
          $match: {
            financialAccountId: accObjId,
            date: { $lt: new Date(startDateStr) },
          },
        },
        {
          $group: {
            _id: null,
            totalDebit: { $sum: '$debit' },
            totalCredit: { $sum: '$credit' },
          },
        },
      ]);
      if (priorAgg.length > 0) {
        openingBalance = priorAgg[0].totalDebit - priorAgg[0].totalCredit;
      }
    }

    const matchFilter: Record<string, unknown> = { financialAccountId: accObjId };
    if (startDateStr || endDateStr) {
      matchFilter.date = {};
      if (startDateStr) (matchFilter.date as Record<string, unknown>).$gte = new Date(startDateStr);
      if (endDateStr) (matchFilter.date as Record<string, unknown>).$lte = new Date(endDateStr);
    }

    const lines = await JournalEntryLine.find(matchFilter)
      .sort({ date: 1, _id: 1 })
      .populate('journalEntryId', 'entryNumber description sourceType')
      .lean();

    let runningBalance = openingBalance;
    const entries = lines.map((l) => {
      runningBalance += l.debit - l.credit;
      const je = l.journalEntryId as unknown as { entryNumber?: string; description?: string; sourceType?: string };
      return {
        id: l._id.toString(),
        date: l.date,
        entryNumber: je?.entryNumber || '',
        sourceType: je?.sourceType || '',
        description: l.description || je?.description || '',
        debit: l.debit, // Inflow
        credit: l.credit, // Outflow
        runningBalance,
      };
    });

    return ApiResponse.success({
      account,
      openingBalance,
      closingBalance: runningBalance,
      entries,
    });
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
