import { ChartOfAccounts, AccountType, NormalBalance } from '../models/chart-of-accounts.model';

export interface DefaultAccountDef {
  code: string;
  name: string;
  type: AccountType;
  subType: string;
  normalBalance: NormalBalance;
  allowPosting: boolean;
  isSystem: boolean;
}

export const DEFAULT_CHART_OF_ACCOUNTS: DefaultAccountDef[] = [
  // Assets (1000 - 1999)
  { code: '1001', name: 'Cash in Hand', type: 'asset', subType: 'cash', normalBalance: 'debit', allowPosting: true, isSystem: true },
  { code: '1002', name: 'Petty Cash', type: 'asset', subType: 'cash', normalBalance: 'debit', allowPosting: true, isSystem: true },
  { code: '1100', name: 'Bank Accounts (Parent)', type: 'asset', subType: 'bank', normalBalance: 'debit', allowPosting: false, isSystem: true },
  { code: '1200', name: 'Mobile Banking (Parent)', type: 'asset', subType: 'mobile_banking', normalBalance: 'debit', allowPosting: false, isSystem: true },
  { code: '1300', name: 'Accounts Receivable', type: 'asset', subType: 'receivable', normalBalance: 'debit', allowPosting: true, isSystem: true },
  { code: '1310', name: 'Loans Receivable (Loan Given)', type: 'asset', subType: 'loan_receivable', normalBalance: 'debit', allowPosting: true, isSystem: true },
  { code: '1400', name: 'Inventory', type: 'asset', subType: 'inventory', normalBalance: 'debit', allowPosting: true, isSystem: true },
  { code: '1500', name: 'Fixed Assets', type: 'asset', subType: 'fixed_asset', normalBalance: 'debit', allowPosting: true, isSystem: true },
  { code: '1510', name: 'Equipment', type: 'asset', subType: 'fixed_asset', normalBalance: 'debit', allowPosting: true, isSystem: true },
  { code: '1520', name: 'Furniture & Fixtures', type: 'asset', subType: 'fixed_asset', normalBalance: 'debit', allowPosting: true, isSystem: true },

  // Liabilities (2000 - 2999)
  { code: '2001', name: 'Accounts Payable', type: 'liability', subType: 'payable', normalBalance: 'credit', allowPosting: true, isSystem: true },
  { code: '2100', name: 'Loans Payable (Loan Taken)', type: 'liability', subType: 'loan_payable', normalBalance: 'credit', allowPosting: true, isSystem: true },
  { code: '2200', name: 'Accrued Expenses', type: 'liability', subType: 'payable', normalBalance: 'credit', allowPosting: true, isSystem: true },
  { code: '2300', name: 'Tax Payable', type: 'liability', subType: 'payable', normalBalance: 'credit', allowPosting: true, isSystem: true },

  // Equity (3000 - 3999)
  { code: '3001', name: 'Investor Capital', type: 'equity', subType: 'capital', normalBalance: 'credit', allowPosting: true, isSystem: true },
  { code: '3002', name: 'Retained Earnings', type: 'equity', subType: 'retained_earnings', normalBalance: 'credit', allowPosting: true, isSystem: true },
  { code: '3003', name: 'Investor Profit Distribution / Drawings', type: 'equity', subType: 'drawings', normalBalance: 'debit', allowPosting: true, isSystem: true },
  { code: '3004', name: 'Current Year Earnings', type: 'equity', subType: 'capital', normalBalance: 'credit', allowPosting: true, isSystem: true },

  // Revenue (4000 - 4999)
  { code: '4001', name: 'Product Sales', type: 'revenue', subType: 'operating_revenue', normalBalance: 'credit', allowPosting: true, isSystem: true },
  { code: '4002', name: 'Service Revenue', type: 'revenue', subType: 'operating_revenue', normalBalance: 'credit', allowPosting: true, isSystem: true },
  { code: '4003', name: 'Commission Income', type: 'revenue', subType: 'other_income', normalBalance: 'credit', allowPosting: true, isSystem: true },
  { code: '4004', name: 'Interest Income', type: 'revenue', subType: 'other_income', normalBalance: 'credit', allowPosting: true, isSystem: true },
  { code: '4005', name: 'Other Operating Income', type: 'revenue', subType: 'other_income', normalBalance: 'credit', allowPosting: true, isSystem: true },

  // Expenses (5000 - 5999)
  { code: '5001', name: 'Cost of Goods Sold', type: 'expense', subType: 'cogs', normalBalance: 'debit', allowPosting: true, isSystem: true },
  { code: '5100', name: 'Office Rent', type: 'expense', subType: 'operating_expense', normalBalance: 'debit', allowPosting: true, isSystem: true },
  { code: '5110', name: 'Employee Salary', type: 'expense', subType: 'operating_expense', normalBalance: 'debit', allowPosting: true, isSystem: true },
  { code: '5120', name: 'Marketing & Advertising', type: 'expense', subType: 'operating_expense', normalBalance: 'debit', allowPosting: true, isSystem: true },
  { code: '5130', name: 'Transportation & Travel', type: 'expense', subType: 'operating_expense', normalBalance: 'debit', allowPosting: true, isSystem: true },
  { code: '5140', name: 'Utilities (Electricity, Water)', type: 'expense', subType: 'operating_expense', normalBalance: 'debit', allowPosting: true, isSystem: true },
  { code: '5150', name: 'Internet & Communications', type: 'expense', subType: 'operating_expense', normalBalance: 'debit', allowPosting: true, isSystem: true },
  { code: '5160', name: 'Software & Cloud Hosting', type: 'expense', subType: 'operating_expense', normalBalance: 'debit', allowPosting: true, isSystem: true },
  { code: '5170', name: 'Repairs & Maintenance', type: 'expense', subType: 'operating_expense', normalBalance: 'debit', allowPosting: true, isSystem: true },
  { code: '5180', name: 'Administrative Expenses', type: 'expense', subType: 'operating_expense', normalBalance: 'debit', allowPosting: true, isSystem: true },
  { code: '5190', name: 'Bank Charges & Gateway Fees', type: 'expense', subType: 'interest_expense', normalBalance: 'debit', allowPosting: true, isSystem: true },
  { code: '5200', name: 'Interest Expense', type: 'expense', subType: 'interest_expense', normalBalance: 'debit', allowPosting: true, isSystem: true },
  { code: '5900', name: 'Other Operating Expenses', type: 'expense', subType: 'other_expense', normalBalance: 'debit', allowPosting: true, isSystem: true },
];

export async function seedChartOfAccounts() {
  for (const acc of DEFAULT_CHART_OF_ACCOUNTS) {
    await ChartOfAccounts.findOneAndUpdate(
      { code: acc.code },
      { $set: acc },
      { upsert: true, returnDocument: 'after' }
    );
  }
}
