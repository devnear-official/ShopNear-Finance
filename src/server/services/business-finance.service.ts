import mongoose, { ClientSession, Types } from 'mongoose';
import { connectDB } from '../db/connect';
import { Loan, ILoan, LoanDirection } from '../models/loan.model';
import { LoanRepayment } from '../models/loan-repayment.model';
import { Party, PartyType } from '../models/party.model';
import { Invoice, IInvoice } from '../models/invoice.model';
import { Bill, IBill } from '../models/bill.model';
import { FinancialAccount } from '../models/financial-account.model';
import { ChartOfAccounts } from '../models/chart-of-accounts.model';
import { AccountingService } from './accounting.service';
import { AccountService } from './account.service';
import { AuditService } from './audit.service';
import { getNextSequenceNumber } from '../models/counter.model';
import {
  ValidationError,
  InsufficientFundsError,
  NotFoundError,
} from '../errors/app-error';

export interface CreateLoanInput {
  direction: LoanDirection;
  partyName: string;
  partyContact?: string;
  principal: number; // integer paisa
  interestRate?: number;
  interestType?: 'flat' | 'reducing';
  startDate?: Date | string;
  termMonths?: number;
  financialAccountId: string;
  notes?: string;
  userId?: string;
}

export interface RepayLoanInput {
  loanId: string;
  principal: number; // integer paisa
  interest?: number; // integer paisa
  financialAccountId: string;
  date?: Date | string;
  notes?: string;
  userId?: string;
}

export class BusinessFinanceService {
  /**
   * Records a new Loan Taken or Loan Given with transactional double-entry posting.
   */
  static async createLoan(input: CreateLoanInput, session?: ClientSession): Promise<ILoan> {
    await connectDB();

    const principal = Math.round(Number(input.principal) || 0);
    if (principal <= 0) {
      throw new ValidationError('Loan principal amount must be greater than zero.');
    }

    const account = await FinancialAccount.findById(input.financialAccountId);
    if (!account || account.status !== 'active') {
      throw new NotFoundError('Active financial account not found.');
    }

    const startDate = input.startDate ? new Date(input.startDate) : new Date();
    const termMonths = input.termMonths || 12;
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + termMonths);

    // If loan is given by business, check cash availability
    if (input.direction === 'given') {
      const availableCash = await AccountService.getAccountBalance(input.financialAccountId);
      if (availableCash < principal) {
        throw new InsufficientFundsError(
          `Insufficient funds in ${account.name} to disburse this loan.`
        );
      }
    }

    // Resolve COA accounts
    let loanCoa = await ChartOfAccounts.findOne({
      code: input.direction === 'taken' ? '2100' : '1310',
    });
    if (!loanCoa) {
      loanCoa = await ChartOfAccounts.findOne({
        type: input.direction === 'taken' ? 'liability' : 'asset',
      });
    }
    if (!loanCoa) throw new NotFoundError('Appropriate loan COA account not found.');

    const loanNumber = await getNextSequenceNumber('LN', startDate.getFullYear(), 6, session);

    // Double-entry posting:
    // Loan Taken: Debit Financial Account | Credit 2100 Loans Payable
    // Loan Given: Debit 1310 Loans Receivable | Credit Financial Account
    const debitCoaId = input.direction === 'taken' ? account.coaAccountId : loanCoa._id;
    const creditCoaId = input.direction === 'taken' ? loanCoa._id : account.coaAccountId;

    const je = await AccountingService.postJournal(
      {
        date: startDate,
        description: `Loan ${input.direction === 'taken' ? 'received from' : 'disbursed to'} ${input.partyName} [${loanNumber}]`,
        sourceType: 'loan',
        sourceId: loanNumber,
        postedBy: input.userId,
        lines: [
          {
            accountId: debitCoaId as Types.ObjectId,
            debit: principal,
            credit: 0,
            financialAccountId: input.direction === 'taken' ? (account._id as Types.ObjectId) : undefined,
            description: `Principal amount for ${loanNumber}`,
          },
          {
            accountId: creditCoaId as Types.ObjectId,
            debit: 0,
            credit: principal,
            financialAccountId: input.direction === 'given' ? (account._id as Types.ObjectId) : undefined,
            description: `Principal obligation for ${loanNumber}`,
          },
        ],
      },
      session
    );

    const loanDoc = new Loan({
      loanNumber,
      direction: input.direction,
      partyName: input.partyName.trim(),
      partyContact: input.partyContact || '',
      principal,
      outstandingPrincipal: principal,
      interestRate: input.interestRate || 0,
      interestType: input.interestType || 'flat',
      startDate,
      dueDate,
      termMonths,
      financialAccountId: account._id,
      journalEntryId: je._id,
      status: 'active',
      notes: input.notes || '',
      createdBy: input.userId,
    });

    const saved = await loanDoc.save(session ? { session } : undefined);
    await AccountService.getAccountBalance(account._id.toString());
    return saved;
  }

  /**
   * Repays principal and interest on an active loan.
   */
  static async recordLoanRepayment(input: RepayLoanInput, session?: ClientSession) {
    await connectDB();

    const principal = Math.round(Number(input.principal) || 0);
    const interest = Math.round(Number(input.interest) || 0);
    const totalAmount = principal + interest;

    if (totalAmount <= 0) {
      throw new ValidationError('Repayment amount must be greater than zero.');
    }

    const loan = await Loan.findById(input.loanId);
    if (!loan) throw new NotFoundError('Loan not found.');

    if (loan.status === 'repaid') {
      throw new ValidationError('This loan is already fully repaid.');
    }

    if (principal > loan.outstandingPrincipal) {
      throw new ValidationError(
        `Principal repayment (৳${(principal / 100).toFixed(2)}) cannot exceed outstanding principal (৳${(loan.outstandingPrincipal / 100).toFixed(2)}).`
      );
    }

    const account = await FinancialAccount.findById(input.financialAccountId);
    if (!account || account.status !== 'active') throw new NotFoundError('Active financial account not found.');

    const trxDate = input.date ? new Date(input.date) : new Date();

    if (loan.direction === 'taken') {
      // Repaying a borrowed loan: check business cash availability
      const availableCash = await AccountService.getAccountBalance(input.financialAccountId);
      if (availableCash < totalAmount) {
        throw new InsufficientFundsError(`Insufficient funds in ${account.name} for repayment.`);
      }

      const payableCoa = await ChartOfAccounts.findOne({ code: '2100' });
      let interestExpCoa = await ChartOfAccounts.findOne({ code: '5200' });
      if (!interestExpCoa) interestExpCoa = await ChartOfAccounts.findOne({ subType: 'interest_expense' });

      const lines: any[] = [
        {
          accountId: payableCoa!._id,
          debit: principal,
          credit: 0,
          description: `Principal reduction on loan ${loan.loanNumber}`,
        },
      ];

      if (interest > 0 && interestExpCoa) {
        lines.push({
          accountId: interestExpCoa._id,
          debit: interest,
          credit: 0,
          description: `Interest charge on loan ${loan.loanNumber}`,
        });
      }

      lines.push({
        accountId: account.coaAccountId,
        debit: 0,
        credit: totalAmount,
        financialAccountId: account._id,
        description: `Payment out for loan ${loan.loanNumber}`,
      });

      const je = await AccountingService.postJournal(
        {
          date: trxDate,
          description: `Repayment on loan taken ${loan.loanNumber}`,
          sourceType: 'loan_repayment',
          sourceId: loan.loanNumber,
          postedBy: input.userId,
          lines,
        },
        session
      );

      loan.outstandingPrincipal -= principal;
      if (loan.outstandingPrincipal === 0) loan.status = 'repaid';
      await loan.save(session ? { session } : undefined);

      const repayment = new LoanRepayment({
        loanId: loan._id,
        date: trxDate,
        principal,
        interest,
        totalAmount,
        financialAccountId: account._id,
        journalEntryId: je._id,
        notes: input.notes || '',
        createdBy: input.userId,
      });

      const saved = await repayment.save(session ? { session } : undefined);
      await AccountService.getAccountBalance(account._id.toString());
      return saved;
    } else {
      // Collecting on a loan given to someone
      const receivableCoa = await ChartOfAccounts.findOne({ code: '1310' });
      let interestIncCoa = await ChartOfAccounts.findOne({ code: '4004' });
      if (!interestIncCoa) interestIncCoa = await ChartOfAccounts.findOne({ subType: 'other_income' });

      const lines: any[] = [
        {
          accountId: account.coaAccountId,
          debit: totalAmount,
          credit: 0,
          financialAccountId: account._id,
          description: `Collection received on loan ${loan.loanNumber}`,
        },
        {
          accountId: receivableCoa!._id,
          debit: 0,
          credit: principal,
          description: `Principal collected on loan ${loan.loanNumber}`,
        },
      ];

      if (interest > 0 && interestIncCoa) {
        lines.push({
          accountId: interestIncCoa._id,
          debit: 0,
          credit: interest,
          description: `Interest earned on loan ${loan.loanNumber}`,
        });
      }

      const je = await AccountingService.postJournal(
        {
          date: trxDate,
          description: `Collection on loan given ${loan.loanNumber}`,
          sourceType: 'loan_repayment',
          sourceId: loan.loanNumber,
          postedBy: input.userId,
          lines,
        },
        session
      );

      loan.outstandingPrincipal -= principal;
      if (loan.outstandingPrincipal === 0) loan.status = 'repaid';
      await loan.save(session ? { session } : undefined);

      const repayment = new LoanRepayment({
        loanId: loan._id,
        date: trxDate,
        principal,
        interest,
        totalAmount,
        financialAccountId: account._id,
        journalEntryId: je._id,
        notes: input.notes || '',
        createdBy: input.userId,
      });

      const saved = await repayment.save(session ? { session } : undefined);
      await AccountService.getAccountBalance(account._id.toString());
      return saved;
    }
  }

  /**
   * Issues an invoice to a customer, posting Accounts Receivable (1300) on accrual basis.
   */
  static async issueInvoice(input: {
    partyId: string;
    items: Array<{ name: string; quantity: number; unitPrice: number }>;
    dueDate?: Date | string;
    notes?: string;
    userId?: string;
  }, session?: ClientSession): Promise<IInvoice> {
    await connectDB();

    const customer = await Party.findById(input.partyId);
    if (!customer) throw new NotFoundError('Customer not found.');

    const subtotal = input.items.reduce((acc, i) => acc + Math.round(i.quantity * i.unitPrice), 0);
    if (subtotal <= 0) throw new ValidationError('Invoice total must be greater than zero.');

    const issueDate = new Date();
    const dueDate = input.dueDate ? new Date(input.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const invoiceNumber = await getNextSequenceNumber('INV-SALES', issueDate.getFullYear(), 6, session);

    // Double-entry AR posting:
    // Debit: 1300 Accounts Receivable | Credit: 4001 Product Sales
    const arCoa = await ChartOfAccounts.findOne({ code: '1300' });
    let revCoa = await ChartOfAccounts.findOne({ code: '4001' });
    if (!revCoa) revCoa = await ChartOfAccounts.findOne({ type: 'revenue' });

    const je = await AccountingService.postJournal(
      {
        date: issueDate,
        description: `Invoice ${invoiceNumber} issued to ${customer.name}`,
        sourceType: 'invoice',
        sourceId: invoiceNumber,
        postedBy: input.userId,
        lines: [
          {
            accountId: arCoa!._id as Types.ObjectId,
            debit: subtotal,
            credit: 0,
            partyType: 'customer',
            partyId: customer._id.toString(),
            description: `AR accrual for ${invoiceNumber}`,
          },
          {
            accountId: revCoa!._id as Types.ObjectId,
            debit: 0,
            credit: subtotal,
            description: `Sales revenue for ${invoiceNumber}`,
          },
        ],
      },
      session
    );

    const doc = new Invoice({
      invoiceNumber,
      partyId: customer._id,
      issueDate,
      dueDate,
      items: input.items.map((i) => ({ ...i, total: Math.round(i.quantity * i.unitPrice) })),
      subtotal,
      total: subtotal,
      paidAmount: 0,
      status: 'issued',
      journalEntryId: je._id,
      notes: input.notes || '',
      createdBy: input.userId,
    });

    return await doc.save(session ? { session } : undefined);
  }

  /**
   * Records payment received against an open invoice.
   * Debit: Financial Account (Cash/Bank) | Credit: 1300 Accounts Receivable.
   */
  static async receiveInvoicePayment(input: {
    invoiceId: string;
    amount: number; // integer paisa
    financialAccountId: string;
    userId?: string;
  }, session?: ClientSession) {
    await connectDB();

    const invoice = await Invoice.findById(input.invoiceId).populate('partyId');
    if (!invoice) throw new NotFoundError('Invoice not found.');

    const remaining = invoice.total - invoice.paidAmount;
    const payAmount = Math.min(input.amount, remaining);

    if (payAmount <= 0) throw new ValidationError('Invoice is already paid in full.');

    const account = await FinancialAccount.findById(input.financialAccountId);
    if (!account || account.status !== 'active') throw new NotFoundError('Active financial account not found.');

    const arCoa = await ChartOfAccounts.findOne({ code: '1300' });

    const je = await AccountingService.postJournal(
      {
        date: new Date(),
        description: `Payment received for ${invoice.invoiceNumber}`,
        sourceType: 'receipt',
        sourceId: invoice.invoiceNumber,
        postedBy: input.userId,
        lines: [
          {
            accountId: account.coaAccountId,
            debit: payAmount,
            credit: 0,
            financialAccountId: account._id as Types.ObjectId,
            description: `Cash collection for ${invoice.invoiceNumber}`,
          },
          {
            accountId: arCoa!._id as Types.ObjectId,
            debit: 0,
            credit: payAmount,
            partyType: 'customer',
            partyId: invoice.partyId._id.toString(),
            description: `AR clearance for ${invoice.invoiceNumber}`,
          },
        ],
      },
      session
    );

    invoice.paidAmount += payAmount;
    invoice.status = invoice.paidAmount >= invoice.total ? 'paid' : 'partially_paid';
    await invoice.save(session ? { session } : undefined);

    await AccountService.getAccountBalance(account._id.toString());
    return invoice;
  }
}
