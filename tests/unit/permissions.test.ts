import { describe, it, expect } from 'vitest';
import { can, canAny, PERMISSIONS, DEFAULT_ROLES } from '@/server/auth/permissions';

describe('server/auth/permissions & RBAC', () => {
  it('allows owner role full access to all permissions unconditionally', () => {
    const ownerUser = { id: 'user-1', role: 'owner' };
    expect(can(ownerUser, PERMISSIONS.TRANSACTIONS_APPROVE)).toBe(true);
    expect(can(ownerUser, PERMISSIONS.JOURNAL_POST)).toBe(true);
    expect(can(ownerUser, PERMISSIONS.PERIODS_CLOSE)).toBe(true);
    expect(can(ownerUser, PERMISSIONS.INVESTORS_VIEW_ALL)).toBe(true);
    expect(can(ownerUser, 'any.custom.future.permission')).toBe(true);
  });

  it('correctly checks permissions for accountant role', () => {
    const accountantUser = {
      id: 'user-2',
      role: 'accountant',
      permissions: DEFAULT_ROLES.accountant.permissions,
    };

    expect(can(accountantUser, PERMISSIONS.JOURNAL_POST)).toBe(true);
    expect(can(accountantUser, PERMISSIONS.COA_VIEW)).toBe(true);
    expect(can(accountantUser, PERMISSIONS.REPORTS_FINANCIAL)).toBe(true);

    // Accountant cannot close periods without permission or manage roles
    expect(can(accountantUser, PERMISSIONS.PERIODS_CLOSE)).toBe(false);
    expect(can(accountantUser, PERMISSIONS.ROLES_MANAGE)).toBe(false);
  });

  it('restricts investor role strictly to own portfolio and prevents business-wide access', () => {
    const investorUser = {
      id: 'user-3',
      role: 'investor',
      permissions: DEFAULT_ROLES.investor.permissions,
      investorId: 'inv-123',
    };

    expect(can(investorUser, PERMISSIONS.INVESTORS_VIEW_OWN)).toBe(true);
    expect(can(investorUser, PERMISSIONS.INVESTORS_VIEW_ALL)).toBe(false);
    expect(can(investorUser, PERMISSIONS.TRANSACTIONS_VIEW)).toBe(false);
    expect(can(investorUser, PERMISSIONS.COA_VIEW)).toBe(false);
    expect(can(investorUser, PERMISSIONS.JOURNAL_POST)).toBe(false);
  });

  it('evaluates canAny correctly', () => {
    const managerUser = {
      id: 'user-4',
      role: 'manager',
      permissions: DEFAULT_ROLES.manager.permissions,
    };

    expect(canAny(managerUser, [PERMISSIONS.TRANSACTIONS_VIEW, PERMISSIONS.JOURNAL_POST])).toBe(true);
    expect(canAny(managerUser, [PERMISSIONS.JOURNAL_POST, PERMISSIONS.PERIODS_CLOSE])).toBe(false);
  });
});
