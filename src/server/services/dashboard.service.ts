import { connectDB } from '@/server/db/connect';
import { FinancialAccount } from '@/server/models/financial-account.model';
import { Transaction } from '@/server/models/transaction.model';
import { Approval } from '@/server/models/approval.model';
import { Investor } from '@/server/models/investor.model';
import { InvestorService } from '@/server/services/investor.service';
import { Invoice } from '@/server/models/invoice.model';
import { Bill } from '@/server/models/bill.model';
import { Loan } from '@/server/models/loan.model';
import { JournalEntryLine } from '@/server/models/journal-entry-line.model';
import { ChartOfAccounts } from '@/server/models/chart-of-accounts.model';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export interface DashboardOverview {
  liquidity: {
    totalPaisa: number;
    cashPaisa: number;
    bankPaisa: number;
    mobileBankingPaisa: number;
  };
  metrics: {
    incomeCurrentMonthPaisa: number;
    expenseCurrentMonthPaisa: number;
    netProfitCurrentMonthPaisa: number;
    totalInvestorEquityPaisa: number;
    outstandingReceivablesPaisa: number;
    outstandingPayablesPaisa: number;
    outstandingLoansTakenPaisa: number;
    pendingApprovalsCount: number;
  };
  monthlyTrends: Array<{
    month: string;
    income: number;
    expense: number;
    net: number;
  }>;
  recentTransactions: Array<{
    id: string;
    transactionNumber: string;
    date: Date;
    type: string;
    categoryName: string;
    accountName: string;
    amountPaisa: number;
    status: string;
  }>;
}

export interface InvestorDashboardOverview {
  investor: {
    id: string;
    code: string;
    name: string;
    sharePercentage: number;
    status: string;
  };
  metrics: {
    currentCapitalPaisa: number;
    totalContributedPaisa: number;
    totalWithdrawnPaisa: number;
    totalProfitAllocatedPaisa: number;
  };
  recentHistory: Array<{
    id: string;
    date: Date;
    type: 'investment' | 'withdrawal' | 'profit_allocation';
    amountPaisa: number;
    description?: string;
  }>;
}

export class DashboardService {
  /**
   * General Admin/Accountant/Manager dashboard overview
   */
  static async getAdminOverview(): Promise<DashboardOverview> {
    await connectDB();

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // 1. Liquidity Breakdown
    const accounts = await FinancialAccount.find({ status: 'active' }).lean();
    let totalLiquidity = 0;
    let cashPaisa = 0;
    let bankPaisa = 0;
    let mobileBankingPaisa = 0;

    for (const acc of accounts) {
      const balance = acc.cachedBalance || 0;
      totalLiquidity += balance;
      if (acc.type === 'cash' || acc.type === 'petty_cash') {
        cashPaisa += balance;
      } else if (acc.type === 'bank') {
        bankPaisa += balance;
      } else if (acc.type === 'mobile_banking') {
        mobileBankingPaisa += balance;
      }
    }

    // 2. Current Month Income & Expense
    // Calculate from posted transactions or journal lines
    const revenueAccounts = await ChartOfAccounts.find({ type: 'revenue' }).select('_id').lean();
    const expenseAccounts = await ChartOfAccounts.find({ type: 'expense' }).select('_id').lean();

    const revenueAccountIds = revenueAccounts.map((a) => a._id);
    const expenseAccountIds = expenseAccounts.map((a) => a._id);

    // Aggregate JournalEntryLines for current month
    const currentMonthRevenueLines = await JournalEntryLine.aggregate([
      {
        $match: {
          accountId: { $in: revenueAccountIds },
          createdAt: { $gte: monthStart, $lte: monthEnd },
        },
      },
      {
        $group: {
          _id: null,
          totalCredit: { $sum: '$credit' },
          totalDebit: { $sum: '$debit' },
        },
      },
    ]);

    const incomeCurrentMonthPaisa =
      currentMonthRevenueLines.length > 0
        ? currentMonthRevenueLines[0].totalCredit - currentMonthRevenueLines[0].totalDebit
        : 0;

    const currentMonthExpenseLines = await JournalEntryLine.aggregate([
      {
        $match: {
          accountId: { $in: expenseAccountIds },
          createdAt: { $gte: monthStart, $lte: monthEnd },
        },
      },
      {
        $group: {
          _id: null,
          totalDebit: { $sum: '$debit' },
          totalCredit: { $sum: '$credit' },
        },
      },
    ]);

    const expenseCurrentMonthPaisa =
      currentMonthExpenseLines.length > 0
        ? currentMonthExpenseLines[0].totalDebit - currentMonthExpenseLines[0].totalCredit
        : 0;

    const netProfitCurrentMonthPaisa = incomeCurrentMonthPaisa - expenseCurrentMonthPaisa;

    // 3. Outstanding Receivables (Invoices)
    const unpaidInvoices = await Invoice.find({
      status: { $in: ['issued', 'partially_paid', 'overdue'] },
    }).lean();
    const outstandingReceivablesPaisa = (unpaidInvoices as any[]).reduce(
      (sum: number, inv: any) => sum + (inv.total - (inv.paidAmount || 0)),
      0
    );

    // 4. Outstanding Payables (Bills)
    const unpaidBills = await Bill.find({
      status: { $in: ['issued', 'partially_paid', 'overdue'] },
    }).lean();
    const outstandingPayablesPaisa = (unpaidBills as any[]).reduce(
      (sum: number, b: any) => sum + (b.total - (b.paidAmount || 0)),
      0
    );

    // 5. Total Investor Capital
    const investors = await Investor.find({ status: 'active' }).lean();
    let totalInvestorEquityPaisa = 0;
    for (const inv of investors) {
      try {
        const bal = await InvestorService.getInvestorCapitalBalance(inv._id.toString());
        totalInvestorEquityPaisa += bal;
      } catch {
        // ignore
      }
    }

    // 6. Outstanding Loans Taken
    const activeLoans = await Loan.find({
      type: 'taken',
      status: { $in: ['active', 'defaulted'] },
    }).lean();
    const outstandingLoansTakenPaisa = (activeLoans as any[]).reduce(
      (sum: number, l: any) => sum + (l.principalRemaining || 0),
      0
    );

    // 7. Pending Approvals
    const pendingApprovalsCount = await Approval.countDocuments({ status: 'pending' });

    // 8. Monthly Trends (Last 6 Months)
    const monthlyTrends: DashboardOverview['monthlyTrends'] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      const mStart = startOfMonth(d);
      const mEnd = endOfMonth(d);
      const mLabel = format(d, 'MMM yyyy');

      const revAgg = await JournalEntryLine.aggregate([
        {
          $match: {
            accountId: { $in: revenueAccountIds },
            createdAt: { $gte: mStart, $lte: mEnd },
          },
        },
        {
          $group: {
            _id: null,
            totalCredit: { $sum: '$credit' },
            totalDebit: { $sum: '$debit' },
          },
        },
      ]);
      const inc = revAgg.length > 0 ? revAgg[0].totalCredit - revAgg[0].totalDebit : 0;

      const expAgg = await JournalEntryLine.aggregate([
        {
          $match: {
            accountId: { $in: expenseAccountIds },
            createdAt: { $gte: mStart, $lte: mEnd },
          },
        },
        {
          $group: {
            _id: null,
            totalDebit: { $sum: '$debit' },
            totalCredit: { $sum: '$credit' },
          },
        },
      ]);
      const exp = expAgg.length > 0 ? expAgg[0].totalDebit - expAgg[0].totalCredit : 0;

      monthlyTrends.push({
        month: mLabel,
        income: inc,
        expense: exp,
        net: inc - exp,
      });
    }

    // 9. Recent Transactions
    const recentTx = await Transaction.find()
      .sort({ date: -1, createdAt: -1 })
      .limit(6)
      .populate('categoryId', 'name')
      .populate('financialAccountId', 'name')
      .lean();

    const recentTransactions = recentTx.map((t: any) => ({
      id: t._id.toString(),
      transactionNumber: t.transactionNumber,
      date: t.date,
      type: t.type,
      categoryName: t.categoryId?.name || 'Uncategorized',
      accountName: t.financialAccountId?.name || 'Account',
      amountPaisa: t.amount,
      status: t.status,
    }));

    return {
      liquidity: {
        totalPaisa: totalLiquidity,
        cashPaisa,
        bankPaisa,
        mobileBankingPaisa,
      },
      metrics: {
        incomeCurrentMonthPaisa,
        expenseCurrentMonthPaisa,
        netProfitCurrentMonthPaisa,
        totalInvestorEquityPaisa,
        outstandingReceivablesPaisa,
        outstandingPayablesPaisa,
        outstandingLoansTakenPaisa,
        pendingApprovalsCount,
      },
      monthlyTrends,
      recentTransactions,
    };
  }

  /**
   * Investor specific dashboard overview
   */
  static async getInvestorOverview(userId: string): Promise<InvestorDashboardOverview | null> {
    await connectDB();

    const investor = await Investor.findOne({ userId }).lean();
    if (!investor) {
      return null;
    }

    const stmt = await InvestorService.getInvestorLedger({ investorId: investor._id.toString() });

    const history: InvestorDashboardOverview['recentHistory'] = stmt.entries.slice(0, 8).map((e: any) => ({
      id: e.id,
      date: e.date,
      type: (e.contribution > 0
        ? 'investment'
        : e.withdrawal > 0
        ? 'withdrawal'
        : 'profit_allocation') as any,
      amountPaisa: e.contribution || e.withdrawal || Math.abs(e.profitLoss),
      description: e.description,
    }));

    return {
      investor: {
        id: investor._id.toString(),
        code: investor.investorCode,
        name: investor.fullName,
        sharePercentage: investor.profitSharePercentage || 0,
        status: investor.status,
      },
      metrics: {
        currentCapitalPaisa: stmt.summary.currentCapital,
        totalContributedPaisa: stmt.summary.totalContributions,
        totalWithdrawnPaisa: stmt.summary.totalWithdrawals,
        totalProfitAllocatedPaisa: stmt.summary.totalProfitAllocated,
      },
      recentHistory: history,
    };
  }
}
