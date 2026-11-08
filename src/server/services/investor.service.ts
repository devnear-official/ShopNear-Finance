import mongoose, { ClientSession, Types } from 'mongoose';
import { connectDB } from '../db/connect';
import { Investor, IInvestor, InvestmentType } from '../models/investor.model';
import { InvestorInvestment } from '../models/investor-investment.model';
import { InvestorWithdrawal } from '../models/investor-withdrawal.model';
import { InvestorProfitAllocation } from '../models/investor-profit-allocation.model';
import { FinancialAccount } from '../models/financial-account.model';
import { ChartOfAccounts } from '../models/chart-of-accounts.model';
import { JournalEntryLine } from '../models/journal-entry-line.model';
import { AccountingService } from './accounting.service';
import { AccountService } from './account.service';
import { AuditService } from './audit.service';
import { getNextSequenceNumber } from '../models/counter.model';
import {
  ValidationError,
  InsufficientFundsError,
  InsufficientCapitalError,
  NotFoundError,
} from '../errors/app-error';

export interface CreateInvestorInput {
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  nidRef?: string;
  joiningDate?: Date | string;
  investmentType?: InvestmentType;
  profitSharePercentage?: number;
  lossBearing?: boolean;
  notes?: string;
  userId?: string;
}

export interface RecordInvestmentInput {
  investorId: string;
  amount: number; // integer paisa
  financialAccountId: string;
  date?: Date | string;
  type?: 'initial' | 'additional';
  notes?: string;
  userId?: string;
}

export interface RecordWithdrawalInput {
  investorId: string;
  amount: number; // integer paisa
  financialAccountId: string;
  date?: Date | string;
  notes?: string;
  userId?: string;
}

export interface AllocateProfitInput {
  investorId: string;
  periodId: string;
  amount: number; // integer paisa
  kind: 'profit' | 'loss';
  basis?: string;
  userId?: string;
}

export class InvestorService {
  /**
   * Register a new investor profile with auto-generated code.
   */
  static async createInvestor(input: CreateInvestorInput, session?: ClientSession): Promise<IInvestor> {
    await connectDB();

    const investorCode = await getNextSequenceNumber('INV', new Date().getFullYear(), 4, session);

    const doc = new Investor({
      investorCode,
      fullName: input.fullName.trim(),
      phone: input.phone.trim(),
      email: input.email?.trim().toLowerCase() || '',
      address: input.address?.trim() || '',
      nidRef: input.nidRef?.trim() || '',
      joiningDate: input.joiningDate ? new Date(input.joiningDate) : new Date(),
      investmentType: input.investmentType || 'equity',
      profitSharePercentage: input.profitSharePercentage || 0,
      lossBearing: input.lossBearing ?? true,
      notes: input.notes || '',
      createdBy: input.userId,
    });

    return await doc.save(session ? { session } : undefined);
  }

  /**
   * Computes the real-time capital balance of an investor strictly from tagged ledger lines.
   * Capital = Sum of Credits on Equity 3001 - Sum of Debits on Equity 3001.
   */
  static async getInvestorCapitalBalance(investorId: string): Promise<number> {
    await connectDB();
    const invObjId = new Types.ObjectId(investorId);

    const capitalCoa = await ChartOfAccounts.findOne({ code: '3001' });
    if (!capitalCoa) return 0;

    const agg = await JournalEntryLine.aggregate([
      {
        $match: {
          investorId: invObjId,
          accountId: capitalCoa._id,
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

    if (agg.length === 0) return 0;
    // Normal balance of Equity is credit: Balance = credit - debit
    return agg[0].totalCredit - agg[0].totalDebit;
  }

  /**
   * Records capital contribution from an investor into a business account.
   * Debit: Financial Account | Credit: 3001 Investor Capital (tagged with investorId).
   */
  static async recordInvestment(
    input: RecordInvestmentInput,
    session?: ClientSession
  ) {
    await connectDB();

    const amount = Math.round(Number(input.amount) || 0);
    if (amount <= 0) {
      throw new ValidationError('Investment amount must be greater than zero.');
    }

    const investor = await Investor.findById(input.investorId);
    if (!investor) throw new NotFoundError('Investor not found.');

    const financialAccount = await FinancialAccount.findById(input.financialAccountId);
    if (!financialAccount || financialAccount.status !== 'active') {
      throw new NotFoundError('Active financial account not found.');
    }

    let capitalCoa = await ChartOfAccounts.findOne({ code: '3001' });
    if (!capitalCoa) {
      capitalCoa = await ChartOfAccounts.create({
        code: '3001',
        name: 'Investor Capital',
        type: 'equity',
        subType: 'capital',
        normalBalance: 'credit',
        allowPosting: true,
        isSystem: true,
      });
    }

    const trxDate = input.date ? new Date(input.date) : new Date();

    // Double-entry journal posting
    const journalEntry = await AccountingService.postJournal(
      {
        date: trxDate,
        description: `Capital investment by ${investor.fullName} (${investor.investorCode}) into ${financialAccount.name}`,
        sourceType: 'investment',
        sourceId: investor._id.toString(),
        postedBy: input.userId,
        lines: [
          {
            accountId: financialAccount.coaAccountId,
            debit: amount,
            credit: 0,
            financialAccountId: financialAccount._id as Types.ObjectId,
            investorId: investor._id as Types.ObjectId,
            description: `Capital contribution received in ${financialAccount.name}`,
          },
          {
            accountId: capitalCoa._id as Types.ObjectId,
            debit: 0,
            credit: amount,
            investorId: investor._id as Types.ObjectId,
            description: `Capital equity credit for ${investor.fullName}`,
          },
        ],
      },
      session
    );

    const investmentDoc = new InvestorInvestment({
      investorId: investor._id,
      amount,
      date: trxDate,
      type: input.type || 'additional',
      financialAccountId: financialAccount._id,
      journalEntryId: journalEntry._id,
      notes: input.notes || '',
      createdBy: input.userId,
    });

    const saved = await investmentDoc.save(session ? { session } : undefined);

    // Sync cached account balance
    await AccountService.getAccountBalance(financialAccount._id.toString());

    await AuditService.log({
      actorId: input.userId,
      action: 'INVESTOR_INVEST',
      entityType: 'InvestorInvestment',
      entityId: saved._id.toString(),
      after: {
        investor: investor.fullName,
        amount,
        account: financialAccount.name,
      },
    });

    return saved;
  }

  /**
   * Records capital withdrawal by an investor.
   * Concurrency-safe: verifies both available investor capital AND account cash before posting.
   */
  static async recordWithdrawal(
    input: RecordWithdrawalInput,
    session?: ClientSession
  ) {
    await connectDB();

    const amount = Math.round(Number(input.amount) || 0);
    if (amount <= 0) {
      throw new ValidationError('Withdrawal amount must be greater than zero.');
    }

    const investor = await Investor.findById(input.investorId);
    if (!investor) throw new NotFoundError('Investor not found.');

    const financialAccount = await FinancialAccount.findById(input.financialAccountId);
    if (!financialAccount || financialAccount.status !== 'active') {
      throw new NotFoundError('Active financial account not found.');
    }

    // 1. Verify Investor Capital Balance
    const availableCapital = await this.getInvestorCapitalBalance(input.investorId);
    if (availableCapital < amount) {
      throw new InsufficientCapitalError(
        `Withdrawal exceeds available capital. Available Capital: ৳${(availableCapital / 100).toFixed(2)}, Requested: ৳${(amount / 100).toFixed(2)}`
      );
    }

    // 2. Verify Available Cash in Selected Account
    const availableCash = await AccountService.getAccountBalance(input.financialAccountId);
    if (availableCash < amount) {
      throw new InsufficientFundsError(
        `Insufficient funds in ${financialAccount.name}. Available Cash: ৳${(availableCash / 100).toFixed(2)}, Requested: ৳${(amount / 100).toFixed(2)}`
      );
    }

    const capitalCoa = await ChartOfAccounts.findOne({ code: '3001' });
    if (!capitalCoa) throw new NotFoundError('Investor Capital account 3001 not found.');

    const trxDate = input.date ? new Date(input.date) : new Date();

    // Post double entry:
    // Debit: 3001 Investor Capital (equity decrease)
    // Credit: Financial Account COA (cash decrease)
    const journalEntry = await AccountingService.postJournal(
      {
        date: trxDate,
        description: `Capital withdrawal by ${investor.fullName} (${investor.investorCode}) from ${financialAccount.name}`,
        sourceType: 'withdrawal',
        sourceId: investor._id.toString(),
        postedBy: input.userId,
        lines: [
          {
            accountId: capitalCoa._id as Types.ObjectId,
            debit: amount,
            credit: 0,
            investorId: investor._id as Types.ObjectId,
            description: `Capital withdrawal reduction for ${investor.fullName}`,
          },
          {
            accountId: financialAccount.coaAccountId,
            debit: 0,
            credit: amount,
            financialAccountId: financialAccount._id as Types.ObjectId,
            investorId: investor._id as Types.ObjectId,
            description: `Cash payout from ${financialAccount.name}`,
          },
        ],
      },
      session
    );

    const withdrawalDoc = new InvestorWithdrawal({
      investorId: investor._id,
      amount,
      date: trxDate,
      financialAccountId: financialAccount._id,
      journalEntryId: journalEntry._id,
      status: 'posted',
      notes: input.notes || '',
      createdBy: input.userId,
    });

    const saved = await withdrawalDoc.save(session ? { session } : undefined);

    // Sync cached account balance
    await AccountService.getAccountBalance(financialAccount._id.toString());

    await AuditService.log({
      actorId: input.userId,
      action: 'INVESTOR_WITHDRAW',
      entityType: 'InvestorWithdrawal',
      entityId: saved._id.toString(),
      after: {
        investor: investor.fullName,
        amount,
        account: financialAccount.name,
      },
    });

    return saved;
  }

  /**
   * Allocates contractual profit or loss to an investor.
   */
  static async allocateProfitLoss(
    input: AllocateProfitInput,
    session?: ClientSession
  ) {
    await connectDB();

    const amount = Math.round(Number(input.amount) || 0);
    if (amount <= 0) {
      throw new ValidationError('Allocation amount must be greater than zero.');
    }

    const investor = await Investor.findById(input.investorId);
    if (!investor) throw new NotFoundError('Investor not found.');

    const capitalCoa = await ChartOfAccounts.findOne({ code: '3001' });
    let earningsCoa = await ChartOfAccounts.findOne({ code: '3004' });
    if (!earningsCoa) earningsCoa = await ChartOfAccounts.findOne({ code: '3002' });

    if (!capitalCoa || !earningsCoa) {
      throw new NotFoundError('Required equity accounts not found in Chart of Accounts.');
    }

    const trxDate = new Date();
    const isProfit = input.kind === 'profit';

    // If profit: Debit Retained Earnings/Current Year (3004) -> Credit Investor Capital (3001)
    // If loss: Debit Investor Capital (3001) -> Credit Retained Earnings (3004)
    const debitAccount = isProfit ? earningsCoa._id : capitalCoa._id;
    const creditAccount = isProfit ? capitalCoa._id : earningsCoa._id;

    const journalEntry = await AccountingService.postJournal(
      {
        date: trxDate,
        description: `${isProfit ? 'Profit' : 'Loss'} allocation for ${investor.fullName} (${input.basis || 'Contractual'})`,
        sourceType: 'profit_allocation',
        sourceId: investor._id.toString(),
        postedBy: input.userId,
        lines: [
          {
            accountId: debitAccount as Types.ObjectId,
            debit: amount,
            credit: 0,
            investorId: investor._id as Types.ObjectId,
            description: `${isProfit ? 'Earnings debit' : 'Capital loss debit'} for ${investor.fullName}`,
          },
          {
            accountId: creditAccount as Types.ObjectId,
            debit: 0,
            credit: amount,
            investorId: investor._id as Types.ObjectId,
            description: `${isProfit ? 'Capital profit credit' : 'Earnings recovery credit'} for ${investor.fullName}`,
          },
        ],
      },
      session
    );

    const allocDoc = new InvestorProfitAllocation({
      investorId: investor._id,
      periodId: new Types.ObjectId(input.periodId),
      amount,
      kind: input.kind,
      basis: input.basis || '',
      journalEntryId: journalEntry._id,
      status: 'posted',
      createdBy: input.userId,
    });

    return await allocDoc.save(session ? { session } : undefined);
  }

  /**
   * Generates single-source-of-truth Investor Ledger Statement.
   */
  static async getInvestorLedger(params: {
    investorId: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    await connectDB();
    const invObjId = new Types.ObjectId(params.investorId);

    const investor = await Investor.findById(invObjId).lean();
    if (!investor) throw new NotFoundError('Investor not found.');

    const capitalCoa = await ChartOfAccounts.findOne({ code: '3001' });
    if (!capitalCoa) throw new NotFoundError('Capital account not found.');

    const matchFilter: Record<string, unknown> = {
      investorId: invObjId,
      accountId: capitalCoa._id,
    };

    if (params.startDate || params.endDate) {
      matchFilter.date = {};
      if (params.startDate) (matchFilter.date as Record<string, unknown>).$gte = params.startDate;
      if (params.endDate) (matchFilter.date as Record<string, unknown>).$lte = params.endDate;
    }

    const lines = await JournalEntryLine.find(matchFilter)
      .sort({ date: 1, _id: 1 })
      .populate('journalEntryId', 'entryNumber description sourceType')
      .lean();

    let runningCapital = 0;
    let totalContributions = 0;
    let totalWithdrawals = 0;
    let totalProfitAllocated = 0;
    let totalLossAllocated = 0;

    const entries = lines.map((line) => {
      const je = line.journalEntryId as unknown as { entryNumber?: string; description?: string; sourceType?: string };
      const isCredit = line.credit > 0;
      const amount = isCredit ? line.credit : line.debit;

      let contribution = 0;
      let withdrawal = 0;
      let profitLoss = 0;

      if (je?.sourceType === 'investment' || (!je?.sourceType && isCredit)) {
        contribution = amount;
        totalContributions += amount;
        runningCapital += amount;
      } else if (je?.sourceType === 'withdrawal' || (!isCredit && je?.sourceType !== 'profit_allocation')) {
        withdrawal = amount;
        totalWithdrawals += amount;
        runningCapital -= amount;
      } else if (je?.sourceType === 'profit_allocation') {
        if (isCredit) {
          profitLoss = amount;
          totalProfitAllocated += amount;
          runningCapital += amount;
        } else {
          profitLoss = -amount;
          totalLossAllocated += amount;
          runningCapital -= amount;
        }
      }

      return {
        id: line._id.toString(),
        date: line.date,
        entryNumber: je?.entryNumber || '',
        description: line.description || je?.description || '',
        sourceType: je?.sourceType || '',
        contribution,
        withdrawal,
        profitLoss,
        runningCapital,
      };
    });

    return {
      investor,
      summary: {
        totalContributions,
        totalWithdrawals,
        totalProfitAllocated,
        totalLossAllocated,
        currentCapital: runningCapital,
      },
      entries,
    };
  }
}
