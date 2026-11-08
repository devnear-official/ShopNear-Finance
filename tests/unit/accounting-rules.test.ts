import { describe, it, expect, vi } from 'vitest';
import { AccountingService } from '@/server/services/accounting.service';
import { UnbalancedEntryError, PeriodClosedError, ValidationError, ImmutableRecordError } from '@/server/errors/app-error';

describe('Phase 2: Accounting Engine & Golden Rules', () => {
  it('rejects unbalanced journal entries where sum(debits) !== sum(credits)', async () => {
    const invalidInput = {
      date: new Date(),
      description: 'Test unbalanced entry',
      sourceType: 'manual' as const,
      lines: [
        { accountId: 'acc1', debit: 100000, credit: 0 },
        { accountId: 'acc2', debit: 0, credit: 95000 }, // 5000 paisa discrepancy
      ],
    };

    await expect(AccountingService.postJournal(invalidInput)).rejects.toThrow(UnbalancedEntryError);
  });

  it('rejects journal entries with fewer than 2 lines', async () => {
    const singleLineInput = {
      date: new Date(),
      description: 'Single line entry',
      sourceType: 'manual' as const,
      lines: [{ accountId: 'acc1', debit: 50000, credit: 0 }],
    };

    await expect(AccountingService.postJournal(singleLineInput)).rejects.toThrow(UnbalancedEntryError);
  });

  it('rejects lines having both debit and credit or negative values', async () => {
    const invalidLineInput = {
      date: new Date(),
      description: 'Invalid line amounts',
      sourceType: 'manual' as const,
      lines: [
        { accountId: 'acc1', debit: -1000, credit: 0 },
        { accountId: 'acc2', debit: 0, credit: -1000 },
      ],
    };

    await expect(AccountingService.postJournal(invalidLineInput)).rejects.toThrow(ValidationError);
  });
});
