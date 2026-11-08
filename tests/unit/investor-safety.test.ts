import { describe, it, expect } from 'vitest';
import { InvestorService } from '@/server/services/investor.service';
import { ValidationError, InsufficientCapitalError, InsufficientFundsError } from '@/server/errors/app-error';

describe('Phase 4: Investor Management & Capital Safety', () => {
  it('rejects investment with zero or negative amount', async () => {
    await expect(
      InvestorService.recordInvestment({
        investorId: 'inv-1',
        amount: 0,
        financialAccountId: 'acc-1',
      })
    ).rejects.toThrow(ValidationError);

    await expect(
      InvestorService.recordInvestment({
        investorId: 'inv-1',
        amount: -5000,
        financialAccountId: 'acc-1',
      })
    ).rejects.toThrow(ValidationError);
  });

  it('rejects withdrawal with zero or negative amount', async () => {
    await expect(
      InvestorService.recordWithdrawal({
        investorId: 'inv-1',
        amount: 0,
        financialAccountId: 'acc-1',
      })
    ).rejects.toThrow(ValidationError);
  });
});
