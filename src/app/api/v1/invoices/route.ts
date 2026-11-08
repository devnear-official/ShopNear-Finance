import { NextRequest } from 'next/server';
import { BusinessFinanceService } from '@/server/services/business-finance.service';
import { Invoice } from '@/server/models/invoice.model';
import { connectDB } from '@/server/db/connect';
import { ApiResponse } from '@/server/utils/api-response';
import { requirePermission } from '@/server/auth/guards';
import { PERMISSIONS } from '@/server/auth/permissions';
import { withTransaction } from '@/server/db/withTransaction';
import { z } from 'zod';

const invoiceSchema = z.object({
  partyId: z.string().min(1, 'Customer is required'),
  items: z.array(
    z.object({
      name: z.string().min(1),
      quantity: z.number().int().min(1),
      unitPrice: z.number().int().min(1),
    })
  ).min(1, 'At least 1 item is required'),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    await requirePermission(PERMISSIONS.INVOICES_VIEW);
    await connectDB();

    const invoices = await Invoice.find()
      .sort({ createdAt: -1 })
      .populate('partyId', 'name phone email')
      .lean();

    return ApiResponse.success(invoices);
  } catch (err) {
    return ApiResponse.handle(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission(PERMISSIONS.INVOICES_CREATE);
    const body = await req.json();
    const validated = invoiceSchema.parse(body);

    const invoice = await withTransaction(async (session) => {
      return await BusinessFinanceService.issueInvoice(
        {
          ...validated,
          userId: user.id,
        },
        session
      );
    });

    return ApiResponse.created(invoice, `Invoice ${invoice.invoiceNumber} issued and posted to Accounts Receivable.`);
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
