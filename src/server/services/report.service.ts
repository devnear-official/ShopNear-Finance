import { connectDB } from '@/server/db/connect';
import { ChartOfAccounts, IChartOfAccount } from '@/server/models/chart-of-accounts.model';
import { JournalEntryLine } from '@/server/models/journal-entry-line.model';
import { Invoice } from '@/server/models/invoice.model';
import { Bill } from '@/server/models/bill.model';
import { Party } from '@/server/models/party.model';
import { differenceInDays } from 'date-fns';

export interface ProfitAndLossReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  revenue: {
    accounts: Array<{ code: string; name: string; amountPaisa: number }>;
    totalPaisa: number;
  };
  cogs: {
    accounts: Array<{ code: string; name: string; amountPaisa: number }>;
    totalPaisa: number;
  };
  grossProfitPaisa: number;
  grossMarginPercentage: number;
  operatingExpenses: {
    accounts: Array<{ code: string; name: string; amountPaisa: number }>;
    totalPaisa: number;
  };
  operatingProfitPaisa: number;
  otherIncomeExpenses: {
    accounts: Array<{ code: string; name: string; amountPaisa: number }>;
    totalPaisa: number;
  };
  netProfitPaisa: number;
  netMarginPercentage: number;
}

export interface BalanceSheetReport {
  asOfDate: Date;
  assets: {
    currentAssets: Array<{ code: string; name: string; amountPaisa: number }>;
    nonCurrentAssets: Array<{ code: string; name: string; amountPaisa: number }>;
    totalPaisa: number;
  };
  liabilities: {
    currentLiabilities: Array<{ code: string; name: string; amountPaisa: number }>;
    longTermLiabilities: Array<{ code: string; name: string; amountPaisa: number }>;
    totalPaisa: number;
  };
  equity: {
    capitalAccounts: Array<{ code: string; name: string; amountPaisa: number }>;
    retainedEarningsPaisa: number;
    totalPaisa: number;
  };
  summary: {
    totalAssetsPaisa: number;
    totalLiabilitiesAndEquityPaisa: number;
    differencePaisa: number;
    isBalanced: boolean;
  };
}

export interface CashFlowStatementReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  operatingActivities: {
    items: Array<{ description: string; amountPaisa: number }>;
    netPaisa: number;
  };
  investingActivities: {
    items: Array<{ description: string; amountPaisa: number }>;
    netPaisa: number;
  };
  financingActivities: {
    items: Array<{ description: string; amountPaisa: number }>;
    netPaisa: number;
  };
  netCashFlowPaisa: number;
  openingCashPaisa: number;
  closingCashPaisa: number;
}

export interface AgingBucket {
  partyId: string;
  partyName: string;
  partyPhone?: string;
  totalPaisa: number;
  currentPaisa: number; // 0-30 days
  days31To60Paisa: number;
  days61To90Paisa: number;
  over90DaysPaisa: number;
}

export class ReportService {
  /**
   * Profit & Loss (Income Statement)
   */
  static async getProfitAndLoss(startDate: Date, endDate: Date): Promise<ProfitAndLossReport> {
    await connectDB();

    // Query all revenue, cogs, expense, and other accounts
    const accounts = await ChartOfAccounts.find({
      type: { $in: ['revenue', 'expense'] },
    }).lean();

    const accountIds = accounts.map((a) => a._id);

    // Aggregate journal lines in date range
    const lines = await JournalEntryLine.aggregate([
      {
        $match: {
          accountId: { $in: accountIds },
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$accountId',
          debit: { $sum: '$debit' },
          credit: { $sum: '$credit' },
        },
      },
    ]);

    const lineMap = new Map<string, { debit: number; credit: number }>();
    lines.forEach((l) => lineMap.set(l._id.toString(), { debit: l.debit, credit: l.credit }));

    const revenueList: Array<{ code: string; name: string; amountPaisa: number }> = [];
    const cogsList: Array<{ code: string; name: string; amountPaisa: number }> = [];
    const expenseList: Array<{ code: string; name: string; amountPaisa: number }> = [];
    const otherList: Array<{ code: string; name: string; amountPaisa: number }> = [];

    for (const acc of accounts) {
      const act = lineMap.get(acc._id.toString()) || { debit: 0, credit: 0 };
      if (acc.type === 'revenue') {
        const netRev = act.credit - act.debit;
        if (netRev !== 0) {
          if (acc.subType === 'other_income') {
            otherList.push({ code: acc.code, name: acc.name, amountPaisa: netRev });
          } else {
            revenueList.push({ code: acc.code, name: acc.name, amountPaisa: netRev });
          }
        }
      } else if (acc.type === 'expense') {
        const netExp = act.debit - act.credit;
        if (netExp !== 0) {
          if (acc.subType === 'cogs') {
            cogsList.push({ code: acc.code, name: acc.name, amountPaisa: netExp });
          } else if (acc.subType === 'other_expense') {
            otherList.push({ code: acc.code, name: acc.name, amountPaisa: -netExp });
          } else {
            expenseList.push({ code: acc.code, name: acc.name, amountPaisa: netExp });
          }
        }
      }
    }

    const totalRevenue = revenueList.reduce((sum, a) => sum + a.amountPaisa, 0);
    const totalCogs = cogsList.reduce((sum, a) => sum + a.amountPaisa, 0);
    const grossProfitPaisa = totalRevenue - totalCogs;
    const grossMarginPercentage = totalRevenue > 0 ? (grossProfitPaisa / totalRevenue) * 100 : 0;

    const totalExpense = expenseList.reduce((sum, a) => sum + a.amountPaisa, 0);
    const operatingProfitPaisa = grossProfitPaisa - totalExpense;

    const totalOther = otherList.reduce((sum, a) => sum + a.amountPaisa, 0);
    const netProfitPaisa = operatingProfitPaisa + totalOther;
    const netMarginPercentage = totalRevenue > 0 ? (netProfitPaisa / totalRevenue) * 100 : 0;

    return {
      period: { startDate, endDate },
      revenue: { accounts: revenueList, totalPaisa: totalRevenue },
      cogs: { accounts: cogsList, totalPaisa: totalCogs },
      grossProfitPaisa,
      grossMarginPercentage: Math.round(grossMarginPercentage * 100) / 100,
      operatingExpenses: { accounts: expenseList, totalPaisa: totalExpense },
      operatingProfitPaisa,
      otherIncomeExpenses: { accounts: otherList, totalPaisa: totalOther },
      netProfitPaisa,
      netMarginPercentage: Math.round(netMarginPercentage * 100) / 100,
    };
  }

  /**
   * Balance Sheet
   */
  static async getBalanceSheet(asOfDate: Date): Promise<BalanceSheetReport> {
    await connectDB();

    const accounts = await ChartOfAccounts.find().lean();
    const accountMap = new Map<string, IChartOfAccount>();
    accounts.forEach((a) => accountMap.set(a._id.toString(), a as any));

    // Aggregate all journal lines up to asOfDate
    const lines = await JournalEntryLine.aggregate([
      {
        $match: {
          createdAt: { $lte: asOfDate },
        },
      },
      {
        $group: {
          _id: '$accountId',
          debit: { $sum: '$debit' },
          credit: { $sum: '$credit' },
        },
      },
    ]);

    const currentAssets: Array<{ code: string; name: string; amountPaisa: number }> = [];
    const nonCurrentAssets: Array<{ code: string; name: string; amountPaisa: number }> = [];
    const currentLiabilities: Array<{ code: string; name: string; amountPaisa: number }> = [];
    const longTermLiabilities: Array<{ code: string; name: string; amountPaisa: number }> = [];
    const capitalAccounts: Array<{ code: string; name: string; amountPaisa: number }> = [];

    let totalRevenueCumulative = 0;
    let totalExpenseCumulative = 0;

    for (const l of lines) {
      const acc = accountMap.get(l._id.toString());
      if (!acc) continue;

      if (acc.type === 'asset') {
        const bal = l.debit - l.credit;
        if (bal !== 0) {
          if (acc.subType === 'fixed_asset') {
            nonCurrentAssets.push({ code: acc.code, name: acc.name, amountPaisa: bal });
          } else {
            currentAssets.push({ code: acc.code, name: acc.name, amountPaisa: bal });
          }
        }
      } else if (acc.type === 'liability') {
        const bal = l.credit - l.debit;
        if (bal !== 0) {
          if (acc.subType === 'loan_payable') {
            longTermLiabilities.push({ code: acc.code, name: acc.name, amountPaisa: bal });
          } else {
            currentLiabilities.push({ code: acc.code, name: acc.name, amountPaisa: bal });
          }
        }
      } else if (acc.type === 'equity') {
        const bal = l.credit - l.debit;
        if (bal !== 0) {
          capitalAccounts.push({ code: acc.code, name: acc.name, amountPaisa: bal });
        }
      } else if (acc.type === 'revenue') {
        totalRevenueCumulative += l.credit - l.debit;
      } else if (acc.type === 'expense') {
        totalExpenseCumulative += l.debit - l.credit;
      }
    }

    const totalAssetsCurrent = currentAssets.reduce((sum, a) => sum + a.amountPaisa, 0);
    const totalAssetsNonCurrent = nonCurrentAssets.reduce((sum, a) => sum + a.amountPaisa, 0);
    const totalAssetsPaisa = totalAssetsCurrent + totalAssetsNonCurrent;

    const totalLiabCurrent = currentLiabilities.reduce((sum, a) => sum + a.amountPaisa, 0);
    const totalLiabLongTerm = longTermLiabilities.reduce((sum, a) => sum + a.amountPaisa, 0);
    const totalLiabilitiesPaisa = totalLiabCurrent + totalLiabLongTerm;

    const retainedEarningsPaisa = totalRevenueCumulative - totalExpenseCumulative;
    const totalCapital = capitalAccounts.reduce((sum, a) => sum + a.amountPaisa, 0);
    const totalEquityPaisa = totalCapital + retainedEarningsPaisa;

    const totalLiabilitiesAndEquityPaisa = totalLiabilitiesPaisa + totalEquityPaisa;
    const differencePaisa = totalAssetsPaisa - totalLiabilitiesAndEquityPaisa;
    const isBalanced = Math.abs(differencePaisa) === 0;

    return {
      asOfDate,
      assets: {
        currentAssets,
        nonCurrentAssets,
        totalPaisa: totalAssetsPaisa,
      },
      liabilities: {
        currentLiabilities,
        longTermLiabilities,
        totalPaisa: totalLiabilitiesPaisa,
      },
      equity: {
        capitalAccounts,
        retainedEarningsPaisa,
        totalPaisa: totalEquityPaisa,
      },
      summary: {
        totalAssetsPaisa,
        totalLiabilitiesAndEquityPaisa,
        differencePaisa,
        isBalanced,
      },
    };
  }

  /**
   * Cash Flow Statement
   */
  static async getCashFlowStatement(startDate: Date, endDate: Date): Promise<CashFlowStatementReport> {
    await connectDB();

    // Cash and cash equivalents accounts (type: asset, subType in ['cash', 'bank', 'mobile_banking'])
    const cashAccounts = await ChartOfAccounts.find({
      type: 'asset',
      subType: { $in: ['cash', 'bank', 'mobile_banking'] },
    }).lean();

    const cashAccountIds = cashAccounts.map((a) => a._id);

    // Opening cash balance before startDate
    const openingAgg = await JournalEntryLine.aggregate([
      {
        $match: {
          accountId: { $in: cashAccountIds },
          createdAt: { $lt: startDate },
        },
      },
      {
        $group: {
          _id: null,
          debit: { $sum: '$debit' },
          credit: { $sum: '$credit' },
        },
      },
    ]);
    const openingCashPaisa = openingAgg.length > 0 ? openingAgg[0].debit - openingAgg[0].credit : 0;

    // Journal lines within period
    const periodLines = await JournalEntryLine.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$accountId',
          debit: { $sum: '$debit' },
          credit: { $sum: '$credit' },
        },
      },
    ]);

    const accounts = await ChartOfAccounts.find().lean();
    const accountMap = new Map<string, IChartOfAccount>();
    accounts.forEach((a) => accountMap.set(a._id.toString(), a as any));

    const opItems: Array<{ description: string; amountPaisa: number }> = [];
    const invItems: Array<{ description: string; amountPaisa: number }> = [];
    const finItems: Array<{ description: string; amountPaisa: number }> = [];

    for (const line of periodLines) {
      const acc = accountMap.get(line._id.toString());
      if (!acc) continue;

      if (acc.type === 'revenue') {
        const net = line.credit - line.debit;
        if (net !== 0) opItems.push({ description: `Cash from ${acc.name}`, amountPaisa: net });
      } else if (acc.type === 'expense' && acc.subType !== 'interest_expense') {
        const net = -(line.debit - line.credit);
        if (net !== 0) opItems.push({ description: `Cash paid for ${acc.name}`, amountPaisa: net });
      } else if (acc.subType === 'fixed_asset') {
        const net = -(line.debit - line.credit);
        if (net !== 0) invItems.push({ description: `Capital Expenditure (${acc.name})`, amountPaisa: net });
      } else if (acc.type === 'equity') {
        const net = line.credit - line.debit;
        if (net !== 0) finItems.push({ description: `Equity flow (${acc.name})`, amountPaisa: net });
      } else if (acc.subType === 'loan_payable') {
        const net = line.credit - line.debit;
        if (net !== 0) finItems.push({ description: `Loan borrowings/repayments`, amountPaisa: net });
      }
    }

    const netOp = opItems.reduce((sum, i) => sum + i.amountPaisa, 0);
    const netInv = invItems.reduce((sum, i) => sum + i.amountPaisa, 0);
    const netFin = finItems.reduce((sum, i) => sum + i.amountPaisa, 0);

    const netCashFlowPaisa = netOp + netInv + netFin;
    const closingCashPaisa = openingCashPaisa + netCashFlowPaisa;

    return {
      period: { startDate, endDate },
      operatingActivities: { items: opItems, netPaisa: netOp },
      investingActivities: { items: invItems, netPaisa: netInv },
      financingActivities: { items: finItems, netPaisa: netFin },
      netCashFlowPaisa,
      openingCashPaisa,
      closingCashPaisa,
    };
  }

  /**
   * Aging Report for Receivables or Payables
   */
  static async getAgingReport(type: 'receivables' | 'payables'): Promise<AgingBucket[]> {
    await connectDB();
    const now = new Date();

    if (type === 'receivables') {
      const unpaidInvoices = await Invoice.find({
        status: { $in: ['issued', 'partially_paid', 'overdue'] },
      }).populate('partyId', 'name phone').lean();

      const map = new Map<string, AgingBucket>();

      for (const inv of (unpaidInvoices as any[])) {
        const party = inv.partyId as any;
        const partyId = party?._id?.toString() || 'unknown';
        const partyName = party?.name || 'Walk-in Customer';
        const partyPhone = party?.phone;

        const balancePaisa = inv.total - (inv.paidAmount || 0);
        if (balancePaisa <= 0) continue;

        const ageDays = differenceInDays(now, new Date(inv.dueDate || inv.issueDate));

        if (!map.has(partyId)) {
          map.set(partyId, {
            partyId,
            partyName,
            partyPhone,
            totalPaisa: 0,
            currentPaisa: 0,
            days31To60Paisa: 0,
            days61To90Paisa: 0,
            over90DaysPaisa: 0,
          });
        }

        const bucket = map.get(partyId)!;
        bucket.totalPaisa += balancePaisa;

        if (ageDays <= 30) {
          bucket.currentPaisa += balancePaisa;
        } else if (ageDays <= 60) {
          bucket.days31To60Paisa += balancePaisa;
        } else if (ageDays <= 90) {
          bucket.days61To90Paisa += balancePaisa;
        } else {
          bucket.over90DaysPaisa += balancePaisa;
        }
      }

      return Array.from(map.values()).sort((a, b) => b.totalPaisa - a.totalPaisa);
    } else {
      const unpaidBills = await Bill.find({
        status: { $in: ['issued', 'partially_paid', 'overdue'] },
      }).populate('partyId', 'name phone').lean();

      const map = new Map<string, AgingBucket>();

      for (const bill of (unpaidBills as any[])) {
        const party = bill.partyId as any;
        const partyId = party?._id?.toString() || 'unknown';
        const partyName = party?.name || 'General Supplier';
        const partyPhone = party?.phone;

        const balancePaisa = bill.total - (bill.paidAmount || 0);
        if (balancePaisa <= 0) continue;

        const ageDays = differenceInDays(now, new Date(bill.dueDate || bill.issueDate));

        if (!map.has(partyId)) {
          map.set(partyId, {
            partyId,
            partyName,
            partyPhone,
            totalPaisa: 0,
            currentPaisa: 0,
            days31To60Paisa: 0,
            days61To90Paisa: 0,
            over90DaysPaisa: 0,
          });
        }

        const bucket = map.get(partyId)!;
        bucket.totalPaisa += balancePaisa;

        if (ageDays <= 30) {
          bucket.currentPaisa += balancePaisa;
        } else if (ageDays <= 60) {
          bucket.days31To60Paisa += balancePaisa;
        } else if (ageDays <= 90) {
          bucket.days61To90Paisa += balancePaisa;
        } else {
          bucket.over90DaysPaisa += balancePaisa;
        }
      }

      return Array.from(map.values()).sort((a, b) => b.totalPaisa - a.totalPaisa);
    }
  }
}
