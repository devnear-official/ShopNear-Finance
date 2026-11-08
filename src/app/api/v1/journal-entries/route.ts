import { NextRequest } from 'next/server';
import { AccountingService } from '@/server/services/accounting.service';
import { JournalEntry } from '@/server/models/journal-entry.model';
import { JournalEntryLine } from '@/server/models/journal-entry-line.model';
import { connectDB } from '@/server/db/connect';
import { ApiResponse } from '@/server/utils/api-response';
import { requireAuth, requirePermission } from '@/server/auth/guards';
import { PERMISSIONS } from '@/server/auth/permissions';
import { withTransaction } from '@/server/db/withTransaction';
import { z } from 'zod';

const journalLineSchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  debit: z.number().int().min(0),
  credit: z.number().int().min(0),
  description: z.string().optional(),
  financialAccountId: z.string().optional(),
  investorId: z.string().optional(),
});

const postJournalSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  description: z.string().min(3, 'Description must be at least 3 characters'),
  lines: z.array(journalLineSchema).min(2, 'At least 2 lines are required'),
  sourceType: z.enum([
    'investment',
    'withdrawal',
    'income',
    'expense',
    'transfer',
    'loan',
    'loan_repayment',
    'invoice',
    'receipt',
    'payable',
    'adjustment',
    'reversal',
    'opening',
    'manual',
    'profit_allocation',
  ]).default('manual'),
});

export async function GET(req: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.JOURNAL_VIEW);
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      JournalEntry.find()
        .sort({ date: -1, entryNumber: -1 })
        .skip(skip)
        .limit(limit)
        .populate('postedBy', 'name')
        .lean(),
      JournalEntry.countDocuments(),
    ]);

    // Fetch lines for each entry
    const entryIds = entries.map((e) => e._id);
    const lines = await JournalEntryLine.find({ journalEntryId: { $in: entryIds } })
      .populate('accountId', 'code name type')
      .lean();

    const linesByEntry = lines.reduce<Record<string, typeof lines>>((acc, line) => {
      const jId = line.journalEntryId.toString();
      if (!acc[jId]) acc[jId] = [];
      acc[jId].push(line);
      return acc;
    }, {});

    const enriched = entries.map((entry) => ({
      ...entry,
      lines: linesByEntry[entry._id.toString()] || [],
    }));

    return ApiResponse.success(enriched, 'Journal entries retrieved', {
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
    const user = await requirePermission(PERMISSIONS.JOURNAL_POST);
    const body = await req.json();
    const validated = postJournalSchema.parse(body);

    const idempotencyKey = req.headers.get('idempotency-key') || undefined;

    const entry = await withTransaction(async (session) => {
      return await AccountingService.postJournal(
        {
          date: new Date(validated.date),
          description: validated.description,
          lines: validated.lines,
          sourceType: validated.sourceType,
          idempotencyKey,
          postedBy: user.id,
        },
        session
      );
    });

    return ApiResponse.created(entry, `Journal entry ${entry.entryNumber} posted successfully.`);
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
