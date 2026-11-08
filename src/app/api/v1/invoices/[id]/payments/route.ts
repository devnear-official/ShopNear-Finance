import { NextRequest } from 'next/server';
import { BusinessFinanceService } from '@/server/services/business-finance.service';
import { ApiResponse } from '@/server/utils/api-response';
import { requirePermission } from '@/server/auth/guards';
import { PERMISSIONS } from '@/server/auth/permissions';
import { withTransaction } from '@/server/db/withTransaction';
import { z } from 'zod';

const paySchema = z.object({
  amount: z.number().int().positive('Payment amount must be greater than zero'),
  financialAccountId: z.string().min(1, 'Deposit financial account is required'),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(PERMISSIONS.INVOICES_PAY);
    const { id } = await params;
    const body = await req.json();
    const validated = paySchema.parse(body);

    const invoice = await withTransaction(async (session) => {
      return await BusinessFinanceService.receiveInvoicePayment(
        {
          invoiceId: id,
          amount: validated.amount,
          financialAccountId: validated.financialAccountId,
          userId: user.id,
        },
        session
      );
    });

    return ApiResponse.success(invoice, `Payment recorded for ${invoice.invoiceNumber}. New status: ${invoice.status}`);
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
