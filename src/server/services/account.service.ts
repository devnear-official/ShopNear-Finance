import mongoose, { ClientSession, Types } from 'mongoose';
import { connectDB } from '../db/connect';
import { FinancialAccount, FinancialAccountType, MobileBankingProvider, IFinancialAccount } from '../models/financial-account.model';
import { ChartOfAccounts } from '../models/chart-of-accounts.model';
import { AccountTransfer } from '../models/account-transfer.model';
import { JournalEntryLine } from '../models/journal-entry-line.model';
import { AccountingService } from './accounting.service';
import { AuditService } from './audit.service';
import {
  ValidationError,
  InsufficientFundsError,
  NotFoundError,
} from '../errors/app-error';

export interface CreateAccountInput {
  name: string;
  type: FinancialAccountType;
  accountNumber?: string;
  bankName?: string;
  branchName?: string;
  routingNumber?: string;
  provider?: MobileBankingProvider;
  openingBalance?: number; // integer paisa
  openingDate?: Date | string;
  userId?: string;
}

export interface TransferFundsInput {
  fromAccountId: string;
  toAccountId: string;
  amount: number; // integer paisa
  fee?: number; // integer paisa
  date?: Date | string;
  reference?: string;
  notes?: string;
  userId?: string;
}

export class AccountService {
  /**
   * Creates a new financial account, provisions its COA sub-account,
   * and posts the opening balance as a double-entry journal transaction.
   */
  static async createAccount(
    input: CreateAccountInput,
    session?: ClientSession
  ): Promise<IFinancialAccount> {
    await connectDB();

    const openingPaisa = Math.round(Number(input.openingBalance) || 0);
    const openingDate = input.openingDate ? new Date(input.openingDate) : new Date();

    // 1. Resolve or create linked Chart of Accounts asset account
    let parentCode = '1100'; // Bank
    let parentSubtype = 'bank';
    if (input.type === 'cash' || input.type === 'petty_cash') {
      parentCode = input.type === 'petty_cash' ? '1002' : '1001';
      parentSubtype = 'cash';
    } else if (input.type === 'mobile_banking') {
      parentCode = '1200';
      parentSubtype = 'mobile_banking';
    }

    let coaAccount = await ChartOfAccounts.findOne({ code: parentCode });
    if (!coaAccount) {
      coaAccount = await ChartOfAccounts.create({
        code: parentCode,
        name: parentCode === '1001' ? 'Cash in Hand' : input.name,
        type: 'asset',
        subType: parentSubtype,
        normalBalance: 'debit',
        allowPosting: true,
        isSystem: true,
      });
    }

    // For bank & mobile accounts, generate a unique child sub-account code
    let linkedCoaId = coaAccount._id;
    if (input.type === 'bank' || input.type === 'mobile_banking') {
      const existingChildCount = await ChartOfAccounts.countDocuments({
        code: new RegExp(`^${parentCode.slice(0, 2)}`),
      });
      const newCode = `${parentCode.slice(0, 2)}${String(existingChildCount + 1).padStart(2, '0')}`;

      const subCoa = await ChartOfAccounts.create(
        [
          {
            code: newCode,
            name: `${input.name} (${input.accountNumber || input.provider || 'Account'})`,
            type: 'asset',
            subType: parentSubtype,
            normalBalance: 'debit',
            parentId: coaAccount._id,
            allowPosting: true,
            isSystem: false,
          },
        ],
        session ? { session } : undefined
      );
      linkedCoaId = subCoa[0]._id;
    }

    // 2. Create the Financial Account
    const accountDoc = new FinancialAccount({
      name: input.name.trim(),
      type: input.type,
      accountNumber: input.accountNumber?.trim() || '',
      bankName: input.bankName?.trim() || '',
      branchName: input.branchName?.trim() || '',
      routingNumber: input.routingNumber?.trim() || '',
      provider: input.provider,
      coaAccountId: linkedCoaId,
      openingBalance: openingPaisa,
      openingDate,
      cachedBalance: openingPaisa,
      status: 'active',
      createdBy: input.userId,
    });

    const savedAccount = await accountDoc.save(session ? { session } : undefined);

    // 3. If opening balance > 0, post opening journal entry
    if (openingPaisa > 0) {
      // Find equity account 3002 (Retained Earnings) or 3001 for balancing
      let equityAccount = await ChartOfAccounts.findOne({ code: '3002' });
      if (!equityAccount) {
        equityAccount = await ChartOfAccounts.findOne({ type: 'equity' });
      }

      if (equityAccount) {
        await AccountingService.postJournal(
          {
            date: openingDate,
            description: `Opening balance for ${savedAccount.name}`,
            sourceType: 'opening',
            sourceId: savedAccount._id.toString(),
            postedBy: input.userId,
            lines: [
              {
                accountId: linkedCoaId,
                debit: openingPaisa,
                credit: 0,
                financialAccountId: savedAccount._id,
                description: `Opening balance for ${savedAccount.name}`,
              },
              {
                accountId: equityAccount._id,
                debit: 0,
                credit: openingPaisa,
                description: `Opening equity credit for ${savedAccount.name}`,
              },
            ],
          },
          session
        );
      }
    }

    return savedAccount;
  }

  /**
   * Derives real-time ledger balance from journal lines.
   */
  static async getAccountBalance(accountId: string): Promise<number> {
    await connectDB();
    const accObjId = new Types.ObjectId(accountId);

    const agg = await JournalEntryLine.aggregate([
      { $match: { financialAccountId: accObjId } },
      {
        $group: {
          _id: null,
          totalDebit: { $sum: '$debit' },
          totalCredit: { $sum: '$credit' },
        },
      },
    ]);

    const balance = agg.length > 0 ? agg[0].totalDebit - agg[0].totalCredit : 0;

    // Keep cachedBalance in sync
    await FinancialAccount.findByIdAndUpdate(accountId, { cachedBalance: balance });

    return balance;
  }

  /**
   * Internal funds transfer with optional fee deduction.
   */
  static async transferFunds(
    input: TransferFundsInput,
    session?: ClientSession
  ) {
    await connectDB();

    if (input.fromAccountId === input.toAccountId) {
      throw new ValidationError('Source and destination accounts must be different.');
    }

    const transferAmount = Math.round(Number(input.amount) || 0);
    const feeAmount = Math.round(Number(input.fee) || 0);

    if (transferAmount <= 0) {
      throw new ValidationError('Transfer amount must be greater than zero.');
    }

    const fromAccount = await FinancialAccount.findById(input.fromAccountId);
    const toAccount = await FinancialAccount.findById(input.toAccountId);

    if (!fromAccount || !toAccount) {
      throw new NotFoundError('One or both financial accounts could not be found.');
    }

    if (fromAccount.status !== 'active' || toAccount.status !== 'active') {
      throw new ValidationError('Both accounts must be active to perform a transfer.');
    }

    // Check available balance
    const currentBalance = await this.getAccountBalance(input.fromAccountId);
    const totalDeduction = transferAmount + feeAmount;

    if (currentBalance < totalDeduction) {
      throw new InsufficientFundsError(
        `Insufficient funds in ${fromAccount.name}. Available: ৳${(currentBalance / 100).toFixed(2)}, Required: ৳${(totalDeduction / 100).toFixed(2)}`
      );
    }

    // Resolve Bank Charges COA account for fee
    let feeCoaId: Types.ObjectId | null = null;
    if (feeAmount > 0) {
      let feeCoa = await ChartOfAccounts.findOne({ code: '5190' });
      if (!feeCoa) {
        feeCoa = await ChartOfAccounts.findOne({ type: 'expense' });
      }
      if (feeCoa) {
        feeCoaId = feeCoa._id as Types.ObjectId;
      }
    }

    const transferDate = input.date ? new Date(input.date) : new Date();

    // Prepare double-entry lines
    const journalLines: Array<{
      accountId: Types.ObjectId;
      debit: number;
      credit: number;
      description: string;
      financialAccountId?: Types.ObjectId;
    }> = [
      {
        accountId: toAccount.coaAccountId,
        debit: transferAmount,
        credit: 0,
        financialAccountId: toAccount._id as Types.ObjectId,
        description: `Transfer in from ${fromAccount.name}${input.reference ? ` (Ref: ${input.reference})` : ''}`,
      },
    ];

    if (feeAmount > 0 && feeCoaId) {
      journalLines.push({
        accountId: feeCoaId,
        debit: feeAmount,
        credit: 0,
        description: `Transfer fee for moving funds from ${fromAccount.name} to ${toAccount.name}`,
      });
    }

    journalLines.push({
      accountId: fromAccount.coaAccountId,
      debit: 0,
      credit: totalDeduction,
      financialAccountId: fromAccount._id as Types.ObjectId,
      description: `Transfer out to ${toAccount.name}${input.reference ? ` (Ref: ${input.reference})` : ''}`,
    });

    // Post to ledger
    const journalEntry = await AccountingService.postJournal(
      {
        date: transferDate,
        description: `Fund transfer from ${fromAccount.name} to ${toAccount.name}`,
        sourceType: 'transfer',
        lines: journalLines,
        postedBy: input.userId,
      },
      session
    );

    // Record AccountTransfer entry
    const transferDoc = new AccountTransfer({
      fromAccountId: fromAccount._id,
      toAccountId: toAccount._id,
      amount: transferAmount,
      fee: feeAmount,
      date: transferDate,
      reference: input.reference || '',
      notes: input.notes || '',
      journalEntryId: journalEntry._id,
      status: 'completed',
      createdBy: input.userId,
    });

    const savedTransfer = await transferDoc.save(session ? { session } : undefined);

    // Update cached balances
    await Promise.all([
      this.getAccountBalance(fromAccount._id.toString()),
      this.getAccountBalance(toAccount._id.toString()),
    ]);

    await AuditService.log({
      actorId: input.userId,
      action: 'ACCOUNT_TRANSFER',
      entityType: 'AccountTransfer',
      entityId: savedTransfer._id.toString(),
      after: {
        from: fromAccount.name,
        to: toAccount.name,
        amount: transferAmount,
        fee: feeAmount,
      },
    });

    return savedTransfer;
  }
}
