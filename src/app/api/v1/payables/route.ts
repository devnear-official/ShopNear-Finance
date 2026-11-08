import { NextRequest } from 'next/server';
import { Bill } from '@/server/models/bill.model';
import { ChartOfAccounts } from '@/server/models/chart-of-accounts.model';
import { FinancialAccount } from '@/server/models/financial-account.model';
import { AccountingService } from '@/server/services/accounting.service';
import { AccountService } from '@/server/services/account.service';
import { connectDB } from '@/server/db/connect';
import { ApiResponse } from '@/server/utils/api-response';
import { requirePermission } from '@/server/auth/guards';
import { PERMISSIONS } from '@/server/auth/permissions';
import { withTransaction } from '@/server/db/withTransaction';
import { getNextSequenceNumber } from '@/server/models/counter.model';
import { z } from 'zod';
import { Types } from 'mongoose';

const billSchema = z.object({
  partyId: z.string().min(1, 'Supplier is required'),
  total: z.number().int().positive('Total bill amount must be greater than zero'),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    await requirePermission(PERMISSIONS.BILLS_VIEW);
    await connectDB();

    const bills = await Bill.find()
      .sort({ createdAt: -1 })
      .populate('partyId', 'name phone')
      .lean();

    return ApiResponse.success(bills);
  } catch (err) {
    return ApiResponse.handle(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission(PERMISSIONS.BILLS_CREATE);
    const body = await req.json();
    const validated = billSchema.parse(body);

    const bill = await withTransaction(async (session) => {
      const issueDate = new Date();
      const dueDate = validated.dueDate ? new Date(validated.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const billNumber = await getNextSequenceNumber('BILL', issueDate.getFullYear(), 6, session);

      // Accrual AP Posting:
      // Debit: 5001 COGS / Expense | Credit: 2001 Accounts Payable
      let expCoa = await ChartOfAccounts.findOne({ code: '5001' }) || await ChartOfAccounts.findOne({ type: 'expense' });
      const apCoa = await ChartOfAccounts.findOne({ code: '2001' });

      const je = await AccountingService.postJournal(
        {
          date: issueDate,
          description: `Bill ${billNumber} received`,
          sourceType: 'payable',
          sourceId: billNumber,
          postedBy: user.id,
          lines: [
            {
              accountId: expCoa!._id as Types.ObjectId,
              debit: validated.total,
              credit: 0,
              description: `Expense accrual for ${billNumber}`,
            },
            {
              accountId: apCoa!._id as Types.ObjectId,
              debit: 0,
              credit: validated.total,
              partyType: 'supplier',
              partyId: validated.partyId,
              description: `AP obligation for ${billNumber}`,
            },
          ],
        },
        session
      );

      const doc = new Bill({
        billNumber,
        partyId: validated.partyId,
        issueDate,
        dueDate,
        total: validated.total,
        paidAmount: 0,
        status: 'issued',
        journalEntryId: je._id,
        notes: validated.notes || '',
        createdBy: user.id,
      });

      return await doc.save(session ? { session } : undefined);
    });

    return ApiResponse.created(bill, `Bill ${bill.billNumber} recorded and posted to Accounts Payable.`);
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
