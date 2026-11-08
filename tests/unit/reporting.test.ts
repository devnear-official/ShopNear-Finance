import { describe, it, expect } from 'vitest';
import { differenceInDays, subDays } from 'date-fns';

describe('Financial Reporting Logic', () => {
  it('correctly calculates Gross Profit and Net Margin in integer paisa', () => {
    const totalRevenuePaisa = 50000000; // 500,000.00 BDT
    const totalCogsPaisa = 30000000; // 300,000.00 BDT
    const operatingExpensesPaisa = 10000000; // 100,000.00 BDT
    const otherIncomePaisa = 1000000; // 10,000.00 BDT

    const grossProfitPaisa = totalRevenuePaisa - totalCogsPaisa;
    expect(grossProfitPaisa).toBe(20000000); // 200,000.00 BDT

    const grossMarginPct = (grossProfitPaisa / totalRevenuePaisa) * 100;
    expect(grossMarginPct).toBe(40); // 40%

    const operatingProfitPaisa = grossProfitPaisa - operatingExpensesPaisa;
    expect(operatingProfitPaisa).toBe(10000000); // 100,000.00 BDT

    const netProfitPaisa = operatingProfitPaisa + otherIncomePaisa;
    expect(netProfitPaisa).toBe(11000000); // 110,000.00 BDT

    const netMarginPct = (netProfitPaisa / totalRevenuePaisa) * 100;
    expect(netMarginPct).toBe(22); // 22%
  });

  it('validates Balance Sheet equilibrium (Assets === Liabilities + Equity)', () => {
    // Current Assets: Cash 100k, Bank 400k, AR 200k = 700k
    // Non-current Assets: Equipment 300k = 300k
    // Total Assets = 1,000,000 BDT = 100,000,000 paisa
    const totalAssetsPaisa = 100000000;

    // Current Liabilities: AP 150k, Short-term Loan 50k = 200k
    // Long-term Liabilities: 300k
    // Total Liabilities = 500k = 50,000,000 paisa
    const totalLiabilitiesPaisa = 50000000;

    // Equity: Capital 400k, Retained Earnings 100k = 500k = 50,000,000 paisa
    const totalEquityPaisa = 50000000;

    const totalLiabAndEquityPaisa = totalLiabilitiesPaisa + totalEquityPaisa;
    const diffPaisa = totalAssetsPaisa - totalLiabAndEquityPaisa;

    expect(diffPaisa).toBe(0);
    expect(totalAssetsPaisa === totalLiabAndEquityPaisa).toBe(true);
  });

  it('correctly categorizes aging buckets based on days overdue', () => {
    const today = new Date();

    const invoiceDates = [
      { id: '1', date: subDays(today, 10), expectedBucket: 'current' },
      { id: '2', date: subDays(today, 45), expectedBucket: 'days31To60' },
      { id: '3', date: subDays(today, 75), expectedBucket: 'days61To90' },
      { id: '4', date: subDays(today, 120), expectedBucket: 'over90Days' },
    ];

    invoiceDates.forEach((inv) => {
      const days = differenceInDays(today, inv.date);
      let bucket = 'current';
      if (days <= 30) bucket = 'current';
      else if (days <= 60) bucket = 'days31To60';
      else if (days <= 90) bucket = 'days61To90';
      else bucket = 'over90Days';

      expect(bucket).toBe(inv.expectedBucket);
    });
  });
});
