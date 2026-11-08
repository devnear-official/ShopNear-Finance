import { NextRequest } from 'next/server';
import { AccountingService } from '@/server/services/accounting.service';
import { ApiResponse } from '@/server/utils/api-response';
import { requirePermission } from '@/server/auth/guards';
import { PERMISSIONS } from '@/server/auth/permissions';
import { withTransaction } from '@/server/db/withTransaction';
import { z } from 'zod';

const reverseSchema = z.object({
  reason: z.string().min(5, 'Reversal reason must be at least 5 characters'),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(PERMISSIONS.JOURNAL_REVERSE);
    const { id } = await params;
    const body = await req.json();
    const validated = reverseSchema.parse(body);

    const reversal = await withTransaction(async (session) => {
      return await AccountingService.reverseJournal(
        id,
        validated.reason,
        user.id,
        session
      );
    });

    return ApiResponse.success(
      reversal,
      `Journal entry reversed successfully. Reversal entry: ${reversal.entryNumber}`
    );
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
