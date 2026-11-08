import { describe, it, expect } from 'vitest';
import { AccountService } from '@/server/services/account.service';
import { ValidationError, InsufficientFundsError } from '@/server/errors/app-error';

describe('Phase 3: Financial Accounts & Transfers', () => {
  it('rejects transfer when fromAccount and toAccount are identical', async () => {
    await expect(
      AccountService.transferFunds({
        fromAccountId: 'acc-1',
        toAccountId: 'acc-1',
        amount: 50000,
      })
    ).rejects.toThrow(ValidationError);
  });

  it('rejects transfer when amount is zero or negative', async () => {
    await expect(
      AccountService.transferFunds({
        fromAccountId: 'acc-1',
        toAccountId: 'acc-2',
        amount: 0,
      })
    ).rejects.toThrow(ValidationError);

    await expect(
      AccountService.transferFunds({
        fromAccountId: 'acc-1',
        toAccountId: 'acc-2',
        amount: -500,
      })
    ).rejects.toThrow(ValidationError);
  });
});
