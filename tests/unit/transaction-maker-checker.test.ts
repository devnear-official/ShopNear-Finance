import { describe, it, expect } from 'vitest';
import { TransactionService } from '@/server/services/transaction.service';
import { ValidationError, ForbiddenError } from '@/server/errors/app-error';

describe('Phase 5: Transactions & Maker-Checker Workflows', () => {
  it('rejects transaction with zero or negative amount', async () => {
    await expect(
      TransactionService.createTransaction({
        type: 'expense',
        amount: 0,
        categoryId: 'cat-1',
        financialAccountId: 'acc-1',
        description: 'Test invalid amount',
      })
    ).rejects.toThrow(ValidationError);
  });
});
