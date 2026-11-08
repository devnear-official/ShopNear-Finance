export const PERMISSIONS = {
  // Users & Roles
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',
  ROLES_VIEW: 'roles.view',
  ROLES_MANAGE: 'roles.manage',

  // Investors
  INVESTORS_VIEW_ALL: 'investors.view_all',
  INVESTORS_VIEW_OWN: 'investors.view_own',
  INVESTORS_CREATE: 'investors.create',
  INVESTORS_EDIT: 'investors.edit',
  INVESTORS_INVEST: 'investors.invest',
  INVESTORS_WITHDRAW: 'investors.withdraw',
  INVESTORS_ALLOCATE_PROFIT: 'investors.allocate_profit',
  INVESTORS_STATEMENT_EXPORT: 'investors.statement_export',

  // Transactions (Income, Expense, Transfers)
  TRANSACTIONS_VIEW: 'transactions.view',
  TRANSACTIONS_CREATE: 'transactions.create',
  TRANSACTIONS_APPROVE: 'transactions.approve',
  TRANSACTIONS_REVERSE: 'transactions.reverse',
  TRANSACTIONS_RECURRING: 'transactions.recurring',

  // Accounts & Transfers
  ACCOUNTS_VIEW: 'accounts.view',
  ACCOUNTS_MANAGE: 'accounts.manage',
  ACCOUNTS_TRANSFER: 'accounts.transfer',
  ACCOUNTS_RECONCILE: 'accounts.reconcile',

  // Accounting & Journal
  COA_VIEW: 'coa.view',
  COA_MANAGE: 'coa.manage',
  JOURNAL_VIEW: 'journal.view',
  JOURNAL_POST: 'journal.post',
  JOURNAL_REVERSE: 'journal.reverse',
  PERIODS_VIEW: 'periods.view',
  PERIODS_CLOSE: 'periods.close',
  PERIODS_OVERRIDE: 'periods.override',

  // Loans
  LOANS_VIEW: 'loans.view',
  LOANS_CREATE: 'loans.create',
  LOANS_REPAY: 'loans.repay',

  // Receivables & Payables & Invoices
  INVOICES_VIEW: 'invoices.view',
  INVOICES_CREATE: 'invoices.create',
  INVOICES_PAY: 'invoices.pay',
  BILLS_VIEW: 'bills.view',
  BILLS_CREATE: 'bills.create',
  BILLS_PAY: 'bills.pay',

  // Reports
  REPORTS_VIEW: 'reports.view',
  REPORTS_FINANCIAL: 'reports.financial', // P&L, Balance Sheet, Cash Flow
  REPORTS_EXPORT: 'reports.export',

  // System & Audit
  AUDIT_VIEW: 'audit.view',
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_MANAGE: 'settings.manage',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export interface RoleDefinition {
  key: string;
  name: string;
  description: string;
  permissions: PermissionKey[];
  isSystem: boolean;
}

const ALL_PERMISSIONS = Object.values(PERMISSIONS) as PermissionKey[];

export const DEFAULT_ROLES: Record<string, RoleDefinition> = {
  owner: {
    key: 'owner',
    name: 'Business Owner',
    description: 'Full business ownership access across all financial records and settings.',
    permissions: ALL_PERMISSIONS,
    isSystem: true,
  },
  super_admin: {
    key: 'super_admin',
    name: 'Super Admin',
    description: 'Technical administrator with user and role management authority.',
    permissions: [
      PERMISSIONS.USERS_VIEW,
      PERMISSIONS.USERS_CREATE,
      PERMISSIONS.USERS_EDIT,
      PERMISSIONS.USERS_DELETE,
      PERMISSIONS.ROLES_VIEW,
      PERMISSIONS.ROLES_MANAGE,
      PERMISSIONS.AUDIT_VIEW,
      PERMISSIONS.SETTINGS_VIEW,
      PERMISSIONS.SETTINGS_MANAGE,
      PERMISSIONS.REPORTS_VIEW,
    ],
    isSystem: true,
  },
  admin: {
    key: 'admin',
    name: 'Administrator',
    description: 'Operational manager with operational access to transactions, accounts, and reports.',
    permissions: [
      PERMISSIONS.TRANSACTIONS_VIEW,
      PERMISSIONS.TRANSACTIONS_CREATE,
      PERMISSIONS.TRANSACTIONS_APPROVE,
      PERMISSIONS.ACCOUNTS_VIEW,
      PERMISSIONS.ACCOUNTS_TRANSFER,
      PERMISSIONS.INVESTORS_VIEW_ALL,
      PERMISSIONS.INVESTORS_INVEST,
      PERMISSIONS.INVESTORS_WITHDRAW,
      PERMISSIONS.LOANS_VIEW,
      PERMISSIONS.LOANS_CREATE,
      PERMISSIONS.LOANS_REPAY,
      PERMISSIONS.INVOICES_VIEW,
      PERMISSIONS.INVOICES_CREATE,
      PERMISSIONS.INVOICES_PAY,
      PERMISSIONS.BILLS_VIEW,
      PERMISSIONS.BILLS_CREATE,
      PERMISSIONS.BILLS_PAY,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.REPORTS_EXPORT,
      PERMISSIONS.USERS_VIEW,
    ],
    isSystem: true,
  },
  accountant: {
    key: 'accountant',
    name: 'Accountant',
    description: 'Double-entry bookkeeping, journal posting, reconciliation, financial statements.',
    permissions: [
      PERMISSIONS.TRANSACTIONS_VIEW,
      PERMISSIONS.TRANSACTIONS_CREATE,
      PERMISSIONS.ACCOUNTS_VIEW,
      PERMISSIONS.ACCOUNTS_RECONCILE,
      PERMISSIONS.COA_VIEW,
      PERMISSIONS.JOURNAL_VIEW,
      PERMISSIONS.JOURNAL_POST,
      PERMISSIONS.JOURNAL_REVERSE,
      PERMISSIONS.PERIODS_VIEW,
      PERMISSIONS.INVOICES_VIEW,
      PERMISSIONS.INVOICES_CREATE,
      PERMISSIONS.BILLS_VIEW,
      PERMISSIONS.BILLS_CREATE,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.REPORTS_FINANCIAL,
      PERMISSIONS.REPORTS_EXPORT,
      PERMISSIONS.INVESTORS_VIEW_ALL,
      PERMISSIONS.INVESTORS_STATEMENT_EXPORT,
    ],
    isSystem: true,
  },
  manager: {
    key: 'manager',
    name: 'Manager',
    description: 'Expense submission, transaction view within operational scope.',
    permissions: [
      PERMISSIONS.TRANSACTIONS_VIEW,
      PERMISSIONS.TRANSACTIONS_CREATE,
      PERMISSIONS.ACCOUNTS_VIEW,
      PERMISSIONS.INVOICES_VIEW,
      PERMISSIONS.BILLS_VIEW,
      PERMISSIONS.REPORTS_VIEW,
    ],
    isSystem: true,
  },
  investor: {
    key: 'investor',
    name: 'Investor',
    description: 'Restricted view strictly limited to own investments, capital balance, and statements.',
    permissions: [
      PERMISSIONS.INVESTORS_VIEW_OWN,
      PERMISSIONS.INVESTORS_STATEMENT_EXPORT,
    ],
    isSystem: true,
  },
};

export interface UserAuthContext {
  id: string;
  role: string;
  permissions?: string[];
  investorId?: string | null;
}

/**
 * Checks if a user has a specific permission.
 * Owners always have all permissions.
 */
export function can(user: UserAuthContext | null | undefined, permission: PermissionKey | string): boolean {
  if (!user) return false;
  if (user.role === 'owner') return true;
  if (user.permissions && user.permissions.includes(permission)) return true;
  return false;
}

/**
 * Checks if a user has ANY of the specified permissions.
 */
export function canAny(user: UserAuthContext | null | undefined, permissions: (PermissionKey | string)[]): boolean {
  if (!user) return false;
  if (user.role === 'owner') return true;
  return permissions.some((perm) => can(user, perm));
}
