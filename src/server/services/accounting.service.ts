import mongoose, { ClientSession, Types } from 'mongoose';
import { connectDB } from '../db/connect';
import { ChartOfAccounts } from '../models/chart-of-accounts.model';
import { FinancialPeriod } from '../models/financial-period.model';
import { FiscalYear } from '../models/fiscal-year.model';
import { JournalEntry, JournalSourceType, IJournalEntry } from '../models/journal-entry.model';
import { JournalEntryLine, IJournalEntryLine } from '../models/journal-entry-line.model';
import { getNextSequenceNumber } from '../models/counter.model';
import {
  UnbalancedEntryError,
  PeriodClosedError,
  ValidationError,
  NotFoundError,
} from '../errors/app-error';
import { AuditService } from './audit.service';

export interface PostJournalLineInput {
  accountId: string | Types.ObjectId;
  debit: number; // integer paisa
  credit: number; // integer paisa
  description?: string;
  financialAccountId?: string | Types.ObjectId;
  investorId?: string | Types.ObjectId;
  partyType?: string;
  partyId?: string;
}

export interface PostJournalInput {
  date: Date | string;
  description: string;
  lines: PostJournalLineInput[];
  sourceType: JournalSourceType;
  sourceId?: string;
  idempotencyKey?: string;
  postedBy?: string | Types.ObjectId;
  allowPeriodOverride?: boolean;
}

export class AccountingService {
  /**
   * Core posting engine.
   * Enforces double-entry balance, period verification, and atomic entry creation.
   */
  static async postJournal(
    input: PostJournalInput,
    session?: ClientSession
  ): Promise<IJournalEntry> {
    await connectDB();

    const entryDate = new Date(input.date);
    if (isNaN(entryDate.getTime())) {
      throw new ValidationError('Invalid journal entry date.');
    }

    if (!input.lines || input.lines.length < 2) {
      throw new UnbalancedEntryError('A journal entry must contain at least 2 lines.');
    }

    // 1. Double-entry validation: sum(debits) must equal sum(credits)
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of input.lines) {
      const debit = Math.round(Number(line.debit) || 0);
      const credit = Math.round(Number(line.credit) || 0);

      if (debit < 0 || credit < 0) {
        throw new ValidationError('Debit and credit amounts cannot be negative.');
      }

      if ((debit > 0 && credit > 0) || (debit === 0 && credit === 0)) {
        throw new ValidationError('Each journal line must have either a positive debit OR credit, not both.');
      }

      totalDebit += debit;
      totalCredit += credit;
    }

    if (totalDebit !== totalCredit) {
      throw new UnbalancedEntryError(
        `Unbalanced entry: Total debit (৳${(totalDebit / 100).toFixed(2)}) must equal total credit (৳${(totalCredit / 100).toFixed(2)}). Difference: ৳${(Math.abs(totalDebit - totalCredit) / 100).toFixed(2)}`
      );
    }

    // 2. Resolve Financial Period & verify period is open
    const period = await this.resolvePeriod(entryDate, session);
    if (period.status !== 'open' && !input.allowPeriodOverride) {
      throw new PeriodClosedError(
        `Financial period "${period.name}" is ${period.status}. Posting is blocked for this period.`
      );
    }

    // 3. Verify accounts exist & allow posting
    const accountIds = input.lines.map((l) => l.accountId);
    const accounts = await ChartOfAccounts.find(
      { _id: { $in: accountIds } },
      null,
      session ? { session } : undefined
    );

    if (accounts.length !== new Set(accountIds.map((id) => id.toString())).size) {
      throw new ValidationError('One or more selected accounts do not exist in the Chart of Accounts.');
    }

    for (const acc of accounts) {
      if (!acc.isActive || !acc.allowPosting) {
        throw new ValidationError(
          `Account "${acc.name}" (${acc.code}) is inactive or does not allow posting.`
        );
      }
    }

    // 4. Generate entry number (e.g. JE-2026-000001)
    const entryNumber = await getNextSequenceNumber('JE', entryDate.getFullYear(), 6, session);

    // 5. Create Journal Entry header
    const journalEntryDoc = new JournalEntry({
      entryNumber,
      date: entryDate,
      periodId: period._id,
      description: input.description.trim(),
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      status: 'posted',
      totalDebit,
      totalCredit,
      postedBy: input.postedBy,
      postedAt: new Date(),
      idempotencyKey: input.idempotencyKey,
      createdBy: input.postedBy,
    });

    const savedEntry = await journalEntryDoc.save(session ? { session } : undefined);

    // 6. Create Journal Lines
    const linesToInsert = input.lines.map((line) => ({
      journalEntryId: savedEntry._id,
      accountId: line.accountId,
      debit: Math.round(Number(line.debit) || 0),
      credit: Math.round(Number(line.credit) || 0),
      description: line.description?.trim() || input.description.trim(),
      financialAccountId: line.financialAccountId,
      investorId: line.investorId,
      partyType: line.partyType,
      partyId: line.partyId,
      date: entryDate,
    }));

    await JournalEntryLine.insertMany(linesToInsert, session ? { session } : {});

    return savedEntry;
  }

  /**
   * Reverses a posted journal entry.
   * Creates a mirrored entry with swapped debit/credit lines and marks original reversed.
   */
  static async reverseJournal(
    entryId: string,
    reason: string,
    reversedBy?: string,
    session?: ClientSession
  ): Promise<IJournalEntry> {
    await connectDB();

    const original = await JournalEntry.findById(
      entryId,
      null,
      session ? { session } : undefined
    );

    if (!original) {
      throw new NotFoundError('Journal entry not found.');
    }

    if (original.status === 'reversed') {
      throw new ValidationError('Journal entry is already reversed.');
    }

    const originalLines = await JournalEntryLine.find(
      { journalEntryId: original._id },
      null,
      session ? { session } : undefined
    );

    // Create mirrored lines
    const reversedLines: PostJournalLineInput[] = originalLines.map((line) => ({
      accountId: line.accountId,
      debit: line.credit, // swap
      credit: line.debit, // swap
      description: `Reversal: ${line.description}`,
      financialAccountId: line.financialAccountId,
      investorId: line.investorId,
      partyType: line.partyType,
      partyId: line.partyId,
    }));

    const reversalEntry = await this.postJournal(
      {
        date: new Date(),
        description: `Reversal of ${original.entryNumber}: ${reason}`,
        lines: reversedLines,
        sourceType: 'reversal',
        sourceId: original._id.toString(),
        postedBy: reversedBy,
      },
      session
    );

    // Update original entry status
    await JournalEntry.collection.updateOne(
      { _id: original._id },
      { $set: { status: 'reversed', reversedBy: reversalEntry._id } },
      session ? { session } : undefined
    );

    // Link reversal entry to original
    await JournalEntry.collection.updateOne(
      { _id: reversalEntry._id },
      { $set: { reversalOf: original._id } },
      session ? { session } : undefined
    );

    await AuditService.log({
      actorId: reversedBy,
      action: 'JOURNAL_REVERSE',
      entityType: 'JournalEntry',
      entityId: original._id.toString(),
      after: { reversalEntryNumber: reversalEntry.entryNumber, reason },
    });

    return reversalEntry;
  }

  /**
   * Resolve or initialize the financial period for a given date.
   */
  static async resolvePeriod(date: Date, session?: ClientSession) {
    const period = await FinancialPeriod.findOne(
      {
        startDate: { $lte: date },
        endDate: { $gte: date },
      },
      null,
      session ? { session } : undefined
    );

    if (period) return period;

    // If no period exists, auto-provision current fiscal year and monthly period
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed

    let fiscalYear = await FiscalYear.findOne(
      { name: `FY-${year}` },
      null,
      session ? { session } : undefined
    );

    if (!fiscalYear) {
      const fyDoc = new FiscalYear({
        name: `FY-${year}`,
        startDate: new Date(year, 0, 1),
        endDate: new Date(year, 11, 31, 23, 59, 59, 999),
        status: 'active',
      });
      fiscalYear = await fyDoc.save(session ? { session } : undefined);
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const periodStartDate = new Date(year, month, 1);
    const periodEndDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const newPeriod = new FinancialPeriod({
      fiscalYearId: fiscalYear._id,
      name: `${monthNames[month]} ${year}`,
      startDate: periodStartDate,
      endDate: periodEndDate,
      status: 'open',
    });

    return await newPeriod.save(session ? { session } : undefined);
  }

  /**
   * General Ledger query for a specific account over an optional date range.
   */
  static async getGeneralLedger(params: {
    accountId: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    await connectDB();
    const account = await ChartOfAccounts.findById(params.accountId);
    if (!account) {
      throw new NotFoundError('Account not found');
    }

    const isNormalDebit = account.normalBalance === 'debit';
    const accObjId = new Types.ObjectId(params.accountId);

    // Calculate opening balance before startDate
    let openingBalance = 0;
    if (params.startDate) {
      const priorAgg = await JournalEntryLine.aggregate([
        {
          $match: {
            accountId: accObjId,
            date: { $lt: params.startDate },
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

      if (priorAgg.length > 0) {
        openingBalance = isNormalDebit
          ? priorAgg[0].totalDebit - priorAgg[0].totalCredit
          : priorAgg[0].totalCredit - priorAgg[0].totalDebit;
      }
    }

    // Build filter for movements
    const matchFilter: Record<string, unknown> = { accountId: accObjId };
    if (params.startDate || params.endDate) {
      matchFilter.date = {};
      if (params.startDate) (matchFilter.date as Record<string, unknown>).$gte = params.startDate;
      if (params.endDate) (matchFilter.date as Record<string, unknown>).$lte = params.endDate;
    }

    const lines = await JournalEntryLine.find(matchFilter)
      .sort({ date: 1, _id: 1 })
      .populate('journalEntryId', 'entryNumber description sourceType')
      .lean();

    let runningBalance = openingBalance;
    const ledgerEntries = lines.map((line) => {
      const movement = isNormalDebit
        ? line.debit - line.credit
        : line.credit - line.debit;
      runningBalance += movement;

      const je = line.journalEntryId as unknown as { entryNumber?: string; description?: string; sourceType?: string };

      return {
        id: line._id.toString(),
        date: line.date,
        entryNumber: je?.entryNumber || '',
        sourceType: je?.sourceType || '',
        description: line.description || je?.description || '',
        debit: line.debit,
        credit: line.credit,
        runningBalance,
      };
    });

    return {
      account: {
        id: account._id.toString(),
        code: account.code,
        name: account.name,
        type: account.type,
        normalBalance: account.normalBalance,
      },
      openingBalance,
      closingBalance: runningBalance,
      entries: ledgerEntries,
    };
  }

  /**
   * Trial Balance report as-of date.
   * Debits must equal credits.
   */
  static async getTrialBalance(asOfDate: Date = new Date()) {
    await connectDB();

    const agg = await JournalEntryLine.aggregate([
      {
        $match: {
          date: { $lte: asOfDate },
        },
      },
      {
        $group: {
          _id: '$accountId',
          totalDebit: { $sum: '$debit' },
          totalCredit: { $sum: '$credit' },
        },
      },
      {
        $lookup: {
          from: 'chartofaccounts',
          localField: '_id',
          foreignField: '_id',
          as: 'account',
        },
      },
      {
        $unwind: '$account',
      },
      {
        $sort: { 'account.code': 1 },
      },
    ]);

    let totalDebitBalance = 0;
    let totalCreditBalance = 0;

    const rows = agg.map((item) => {
      const net = item.totalDebit - item.totalCredit;
      const debitBalance = net > 0 ? net : 0;
      const creditBalance = net < 0 ? Math.abs(net) : 0;

      totalDebitBalance += debitBalance;
      totalCreditBalance += creditBalance;

      return {
        accountId: item._id.toString(),
        code: item.account.code,
        name: item.account.name,
        type: item.account.type,
        normalBalance: item.account.normalBalance,
        totalDebit: item.totalDebit,
        totalCredit: item.totalCredit,
        debitBalance,
        creditBalance,
      };
    });

    const isBalanced = totalDebitBalance === totalCreditBalance;
    const difference = Math.abs(totalDebitBalance - totalCreditBalance);

    return {
      asOfDate,
      isBalanced,
      totalDebitBalance,
      totalCreditBalance,
      difference,
      rows,
    };
  }
}
