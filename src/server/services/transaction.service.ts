import mongoose, { ClientSession, Types } from 'mongoose';
import { connectDB } from '../db/connect';
import { Transaction, ITransaction, BusinessTransactionType } from '../models/transaction.model';
import { TransactionCategory } from '../models/transaction-category.model';
import { FinancialAccount } from '../models/financial-account.model';
import { ChartOfAccounts } from '../models/chart-of-accounts.model';
import { Approval } from '../models/approval.model';
import { Notification } from '../models/notification.model';
import { AccountingService } from './accounting.service';
import { AccountService } from './account.service';
import { AuditService } from './audit.service';
import { getNextSequenceNumber } from '../models/counter.model';
import {
  ValidationError,
  InsufficientFundsError,
  ForbiddenError,
  NotFoundError,
} from '../errors/app-error';

export interface CreateTransactionInput {
  type: BusinessTransactionType;
  amount: number; // integer paisa
  categoryId: string;
  financialAccountId: string;
  date?: Date | string;
  subcategory?: string;
  partyName?: string;
  paymentMethod?: string;
  referenceNo?: string;
  invoiceNo?: string;
  description: string;
  requireApproval?: boolean;
  userId?: string;
  userRole?: string;
}

export class TransactionService {
  /**
   * Record a new income, expense, or asset purchase transaction.
   */
  static async createTransaction(
    input: CreateTransactionInput,
    session?: ClientSession
  ): Promise<ITransaction> {
    await connectDB();

    const amount = Math.round(Number(input.amount) || 0);
    if (amount <= 0) {
      throw new ValidationError('Transaction amount must be greater than zero.');
    }

    const category = await TransactionCategory.findById(input.categoryId).populate('defaultCoaAccountId');
    if (!category) {
      throw new NotFoundError('Transaction category not found.');
    }

    const account = await FinancialAccount.findById(input.financialAccountId);
    if (!account || account.status !== 'active') {
      throw new NotFoundError('Active financial account not found.');
    }

    const trxDate = input.date ? new Date(input.date) : new Date();
    const trxNumber = await getNextSequenceNumber('TRX', trxDate.getFullYear(), 6, session);

    // If an expense or asset purchase, verify available cash before posting
    if (input.type === 'expense' || input.type === 'asset_purchase') {
      const currentCash = await AccountService.getAccountBalance(input.financialAccountId);
      if (currentCash < amount && !input.requireApproval) {
        throw new InsufficientFundsError(
          `Insufficient funds in ${account.name}. Available: ৳${(currentCash / 100).toFixed(2)}, Required: ৳${(amount / 100).toFixed(2)}`
        );
      }
    }

    // Check if requires approval
    const needsApproval = Boolean(input.requireApproval || input.userRole === 'manager');
    const initialStatus = needsApproval ? 'pending_approval' : 'posted';

    let journalEntryId: Types.ObjectId | undefined = undefined;

    if (!needsApproval) {
      // Execute double-entry posting immediately
      let debitCoaId: Types.ObjectId;
      let creditCoaId: Types.ObjectId;

      if (input.type === 'income') {
        debitCoaId = account.coaAccountId;
        creditCoaId = category.defaultCoaAccountId._id as Types.ObjectId;
      } else if (input.type === 'expense') {
        debitCoaId = category.defaultCoaAccountId._id as Types.ObjectId;
        creditCoaId = account.coaAccountId;
      } else if (input.type === 'asset_purchase') {
        // Golden rule: Asset purchase debits Fixed Asset COA, NOT operating expense!
        let fixedAssetCoa = await ChartOfAccounts.findOne({ code: '1500' });
        if (!fixedAssetCoa) fixedAssetCoa = await ChartOfAccounts.findOne({ subType: 'fixed_asset' });
        debitCoaId = fixedAssetCoa ? (fixedAssetCoa._id as Types.ObjectId) : (category.defaultCoaAccountId._id as Types.ObjectId);
        creditCoaId = account.coaAccountId;
      } else {
        debitCoaId = account.coaAccountId;
        creditCoaId = category.defaultCoaAccountId._id as Types.ObjectId;
      }

      const je = await AccountingService.postJournal(
        {
          date: trxDate,
          description: `${input.type.toUpperCase()}: ${input.description} [${trxNumber}]`,
          sourceType: input.type as any,
          sourceId: trxNumber,
          postedBy: input.userId,
          lines: [
            {
              accountId: debitCoaId,
              debit: amount,
              credit: 0,
              financialAccountId: input.type === 'income' ? (account._id as Types.ObjectId) : undefined,
              description: input.description,
            },
            {
              accountId: creditCoaId,
              debit: 0,
              credit: amount,
              financialAccountId: input.type !== 'income' ? (account._id as Types.ObjectId) : undefined,
              description: input.description,
            },
          ],
        },
        session
      );

      journalEntryId = je._id as Types.ObjectId;
      // Sync cached account balance
      await AccountService.getAccountBalance(account._id.toString());
    }

    const trxDoc = new Transaction({
      transactionNumber: trxNumber,
      type: input.type,
      date: trxDate,
      amount,
      categoryId: category._id,
      subcategory: input.subcategory || '',
      partyName: input.partyName || '',
      financialAccountId: account._id,
      paymentMethod: input.paymentMethod || 'cash',
      referenceNo: input.referenceNo || '',
      invoiceNo: input.invoiceNo || '',
      description: input.description.trim(),
      status: initialStatus,
      journalEntryId,
      submittedBy: input.userId,
      submittedAt: new Date(),
    });

    const saved = await trxDoc.save(session ? { session } : undefined);

    if (needsApproval) {
      await Approval.create(
        [
          {
            entityType: 'Transaction',
            entityId: saved._id,
            requestedBy: input.userId,
            status: 'pending',
          },
        ],
        session ? { session } : undefined
      );
    }

    await AuditService.log({
      actorId: input.userId,
      action: `TRANSACTION_CREATE_${input.type.toUpperCase()}`,
      entityType: 'Transaction',
      entityId: saved._id.toString(),
      after: {
        transactionNumber: trxNumber,
        amount,
        status: initialStatus,
      },
    });

    return saved;
  }

  /**
   * Approve a pending transaction (Maker-Checker enforced).
   */
  static async approveTransaction(
    transactionId: string,
    approverId: string,
    approverRole: string,
    session?: ClientSession
  ) {
    await connectDB();

    const trx = await Transaction.findById(transactionId).populate('categoryId').populate('financialAccountId');
    if (!trx) throw new NotFoundError('Transaction not found.');

    if (trx.status !== 'pending_approval') {
      throw new ValidationError(`Transaction is not pending approval. Current status: ${trx.status}`);
    }

    // Maker-Checker: Creator cannot approve their own entry unless owner
    if (trx.submittedBy && trx.submittedBy.toString() === approverId && approverRole !== 'owner') {
      throw new ForbiddenError('Maker-Checker violation: You cannot approve a transaction that you submitted.');
    }

    const category = trx.categoryId as any;
    const account = trx.financialAccountId as any;

    // Check cash balance
    if (trx.type === 'expense' || trx.type === 'asset_purchase') {
      const currentCash = await AccountService.getAccountBalance(account._id.toString());
      if (currentCash < trx.amount) {
        throw new InsufficientFundsError(
          `Insufficient funds in ${account.name} to approve this transaction.`
        );
      }
    }

    let debitCoaId = account.coaAccountId;
    let creditCoaId = category.defaultCoaAccountId;

    if (trx.type === 'expense') {
      debitCoaId = category.defaultCoaAccountId;
      creditCoaId = account.coaAccountId;
    } else if (trx.type === 'asset_purchase') {
      let fixedAssetCoa = await ChartOfAccounts.findOne({ code: '1500' });
      debitCoaId = fixedAssetCoa ? fixedAssetCoa._id : category.defaultCoaAccountId;
      creditCoaId = account.coaAccountId;
    }

    const je = await AccountingService.postJournal(
      {
        date: trx.date,
        description: `Approved ${trx.type}: ${trx.description} [${trx.transactionNumber}]`,
        sourceType: trx.type as any,
        sourceId: trx.transactionNumber,
        postedBy: approverId,
        lines: [
          {
            accountId: debitCoaId,
            debit: trx.amount,
            credit: 0,
            financialAccountId: trx.type === 'income' ? account._id : undefined,
            description: trx.description,
          },
          {
            accountId: creditCoaId,
            debit: 0,
            credit: trx.amount,
            financialAccountId: trx.type !== 'income' ? account._id : undefined,
            description: trx.description,
          },
        ],
      },
      session
    );

    trx.status = 'posted';
    trx.journalEntryId = je._id as Types.ObjectId;
    trx.approvedBy = new Types.ObjectId(approverId);
    trx.approvedAt = new Date();
    await trx.save(session ? { session } : undefined);

    // Update approval record
    await Approval.updateOne(
      { entityType: 'Transaction', entityId: trx._id, status: 'pending' },
      { $set: { status: 'approved', decidedBy: approverId, decidedAt: new Date() } },
      session ? { session } : undefined
    );

    // Sync account balance
    await AccountService.getAccountBalance(account._id.toString());

    return trx;
  }

  /**
   * Reject a pending transaction.
   */
  static async rejectTransaction(transactionId: string, reason: string, userId: string) {
    await connectDB();
    const trx = await Transaction.findById(transactionId);
    if (!trx) throw new NotFoundError('Transaction not found.');

    trx.status = 'rejected';
    trx.rejectedBy = new Types.ObjectId(userId);
    trx.rejectedAt = new Date();
    trx.rejectionReason = reason;
    await trx.save();

    await Approval.updateOne(
      { entityType: 'Transaction', entityId: trx._id, status: 'pending' },
      { $set: { status: 'rejected', decidedBy: userId, decidedAt: new Date(), comment: reason } }
    );

    return trx;
  }

  /**
   * Reverses a posted transaction.
   */
  static async reverseTransaction(transactionId: string, reason: string, userId: string, session?: ClientSession) {
    await connectDB();
    const trx = await Transaction.findById(transactionId);
    if (!trx) throw new NotFoundError('Transaction not found.');
    if (trx.status !== 'posted' || !trx.journalEntryId) {
      throw new ValidationError('Only posted transactions with a valid journal entry can be reversed.');
    }

    await AccountingService.reverseJournal(trx.journalEntryId.toString(), reason, userId, session);

    trx.status = 'reversed';
    await trx.save(session ? { session } : undefined);

    await AccountService.getAccountBalance(trx.financialAccountId.toString());
    return trx;
  }
}
