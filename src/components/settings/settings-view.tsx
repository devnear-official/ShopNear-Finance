'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { formatBDT, toPaisa, fromPaisa } from '@/lib/money';
import {
  Building2,
  Sliders,
  Users,
  Tags,
  Check,
  Save,
  Plus,
  ShieldCheck,
  Lock,
  UserPlus,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

type SettingsTab = 'business' | 'system' | 'users' | 'categories';

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('business');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Business state
  const [business, setBusiness] = useState<any>({
    name: 'ShopNear Finance',
    legalName: '',
    phone: '',
    email: '',
    address: '',
    tinBin: '',
    invoicePrefix: 'INV',
    billPrefix: 'BILL',
    receiptPrefix: 'RCT',
    voucherPrefix: 'JV',
  });

  // System state
  const [system, setSystem] = useState<any>({
    makerCheckerEnabled: true,
    approvalThresholdBdt: '50000',
    allowNegativeCash: false,
    autoLockClosedPeriods: true,
    defaultLoanInterestRate: 9,
  });

  // Users & Roles state
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    roleKey: 'accountant',
  });

  // Categories state
  const [categories, setCategories] = useState<any[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bizRes, sysRes, usersRes, rolesRes, catsRes] = await Promise.all([
        fetch('/api/v1/settings/business'),
        fetch('/api/v1/settings/system'),
        fetch('/api/v1/users'),
        fetch('/api/v1/roles'),
        fetch('/api/v1/transaction-categories'),
      ]);

      const [bizJson, sysJson, usersJson, rolesJson, catsJson] = await Promise.all([
        bizRes.json(),
        sysRes.json(),
        usersRes.json(),
        rolesRes.json(),
        catsRes.json(),
      ]);

      if (bizJson.success && bizJson.data) setBusiness(bizJson.data);
      if (sysJson.success && sysJson.data) {
        setSystem({
          ...sysJson.data,
          approvalThresholdBdt: fromPaisa(sysJson.data.approvalThresholdPaisa || 5000000),
        });
      }
      if (usersJson.success) setUsers(usersJson.data || []);
      if (rolesJson.success) setRoles(rolesJson.data || []);
      if (catsJson.success) setCategories(catsJson.data || []);
    } catch (err: any) {
      toast.error('Failed to load settings: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch('/api/v1/settings/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(business),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      toast.success('Business profile updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save business profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        makerCheckerEnabled: system.makerCheckerEnabled,
        approvalThresholdPaisa: toPaisa(system.approvalThresholdBdt || '0'),
        allowNegativeCash: system.allowNegativeCash,
        autoLockClosedPeriods: system.autoLockClosedPeriods,
        defaultLoanInterestRate: Number(system.defaultLoanInterestRate),
      };

      const res = await fetch('/api/v1/settings/system', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      toast.success('System settings saved successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save system settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch('/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserData),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      toast.success('User account created successfully');
      setShowAddUserModal(false);
      setNewUserData({ name: '', email: '', phone: '', password: '', roleKey: 'accountant' });
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
      const res = await fetch(`/api/v1/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      toast.success(`User status updated to ${nextStatus}`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user status');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          Loading settings and configuration...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          System & Business Settings
        </h1>
        <p className="text-sm text-slate-500">
          Configure business profiles, maker-checker financial policies, user access, and categories.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('business')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === 'business'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="h-4 w-4" /> Business Profile
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === 'system'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sliders className="h-4 w-4" /> Financial Controls
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === 'users'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="h-4 w-4" /> Users & Roles ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === 'categories'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Tags className="h-4 w-4" /> Categories ({categories.length})
        </button>
      </div>

      {/* --- TAB 1: BUSINESS PROFILE --- */}
      {activeTab === 'business' && (
        <Card>
          <CardHeader>
            <CardTitle>Business Organization Details</CardTitle>
            <CardDescription>
              Legal business entity information displayed on official invoices, vouchers, and statements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveBusiness} className="space-y-4 max-w-2xl text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Trade / Display Name
                  </label>
                  <input
                    type="text"
                    value={business.name || ''}
                    onChange={(e) => setBusiness({ ...business, name: e.target.value })}
                    required
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Legal Registered Entity Name
                  </label>
                  <input
                    type="text"
                    value={business.legalName || ''}
                    onChange={(e) => setBusiness({ ...business, legalName: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={business.phone || ''}
                    onChange={(e) => setBusiness({ ...business, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={business.email || ''}
                    onChange={(e) => setBusiness({ ...business, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    TIN / BIN Registration Ref
                  </label>
                  <input
                    type="text"
                    value={business.tinBin || ''}
                    onChange={(e) => setBusiness({ ...business, tinBin: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Currency & Standard Timezone
                  </label>
                  <input
                    type="text"
                    disabled
                    value="BDT (৳) • Asia/Dhaka"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 px-3 py-2 text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Business Physical Address
                </label>
                <textarea
                  rows={2}
                  value={business.address || ''}
                  onChange={(e) => setBusiness({ ...business, address: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              {/* Numbering Prefixes */}
              <div className="pt-2">
                <span className="block font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">
                  Document Numbering Prefixes
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Invoice Prefix</label>
                    <input
                      type="text"
                      value={business.invoicePrefix || 'INV'}
                      onChange={(e) => setBusiness({ ...business, invoicePrefix: e.target.value })}
                      className="w-full rounded-lg border px-3 py-1.5 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Bill Prefix</label>
                    <input
                      type="text"
                      value={business.billPrefix || 'BILL'}
                      onChange={(e) => setBusiness({ ...business, billPrefix: e.target.value })}
                      className="w-full rounded-lg border px-3 py-1.5 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Receipt Prefix</label>
                    <input
                      type="text"
                      value={business.receiptPrefix || 'RCT'}
                      onChange={(e) => setBusiness({ ...business, receiptPrefix: e.target.value })}
                      className="w-full rounded-lg border px-3 py-1.5 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Voucher Prefix</label>
                    <input
                      type="text"
                      value={business.voucherPrefix || 'JV'}
                      onChange={(e) => setBusiness({ ...business, voucherPrefix: e.target.value })}
                      className="w-full rounded-lg border px-3 py-1.5 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-500 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Business Profile'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* --- TAB 2: SYSTEM & FINANCIAL CONTROLS --- */}
      {activeTab === 'system' && (
        <Card>
          <CardHeader>
            <CardTitle>Financial Controls & Approvals Policy</CardTitle>
            <CardDescription>
              Configure safety guardrails, maker-checker separation of duties, and transaction thresholds
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveSystem} className="space-y-6 max-w-2xl text-xs sm:text-sm">
              {/* Maker Checker toggle */}
              <div className="flex items-start justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="pr-4">
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Enforce Maker-Checker Separation of Duties
                  </span>
                  <p className="text-xs text-slate-500 mt-1">
                    When active, a transaction creator (Maker) cannot approve or self-post their own transactions.
                    An independent authorized manager or owner (Checker) must review and verify.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(system.makerCheckerEnabled)}
                  onChange={(e) => setSystem({ ...system, makerCheckerEnabled: e.target.checked })}
                  className="h-5 w-5 rounded text-emerald-600 focus:ring-emerald-500 mt-1"
                />
              </div>

              {/* Approval Threshold */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Mandatory Approval Threshold (BDT ৳)
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Expenses exceeding this amount automatically require managerial approval before ledger posting.
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-500">৳</span>
                  <input
                    type="number"
                    value={system.approvalThresholdBdt}
                    onChange={(e) => setSystem({ ...system, approvalThresholdBdt: e.target.value })}
                    className="w-48 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-slate-900 dark:text-white font-semibold"
                  />
                </div>
              </div>

              {/* Allow Negative Cash */}
              <div className="flex items-start justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="pr-4">
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Allow Negative Cash Balances (Strict Accounting Lock)
                  </span>
                  <p className="text-xs text-slate-500 mt-1">
                    Default is disabled (strict safety). Prevents posting any expense or withdrawal if the source
                    financial account does not have sufficient verified funds.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(system.allowNegativeCash)}
                  onChange={(e) => setSystem({ ...system, allowNegativeCash: e.target.checked })}
                  className="h-5 w-5 rounded text-emerald-600 focus:ring-emerald-500 mt-1"
                />
              </div>

              {/* Auto lock closed periods */}
              <div className="flex items-start justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="pr-4">
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Auto-Lock Closed Fiscal Periods
                  </span>
                  <p className="text-xs text-slate-500 mt-1">
                    Immediately prohibits posting retroactive journal entries into finalized and locked monthly periods.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(system.autoLockClosedPeriods)}
                  onChange={(e) => setSystem({ ...system, autoLockClosedPeriods: e.target.checked })}
                  className="h-5 w-5 rounded text-emerald-600 focus:ring-emerald-500 mt-1"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-500 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Financial Controls'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* --- TAB 3: USERS & RBAC --- */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">User Accounts & Roles</h3>
              <p className="text-xs text-slate-500">Manage business operators, permissions, and status</p>
            </div>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 shadow-sm"
            >
              <UserPlus className="h-4 w-4" /> Add User
            </button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b bg-slate-50 uppercase text-slate-500 dark:bg-slate-800">
                    <tr>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-900 dark:text-white block">
                            {u.name}
                          </span>
                          <span className="text-[11px] text-slate-400">{u.email}</span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-emerald-700 dark:text-emerald-400 capitalize">
                          {u.roleId?.name || u.roleId?.key || 'Staff'}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{u.phone || '-'}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={u.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleToggleUserStatus(u._id, u.status)}
                            className="rounded-lg border px-2.5 py-1 text-[11px] font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            {u.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* --- TAB 4: CATEGORIES --- */}
      {activeTab === 'categories' && (
        <Card>
          <CardHeader>
            <CardTitle>Transaction & Expense Categories</CardTitle>
            <CardDescription>
              Categories mapped to Chart of Accounts with asset capitalization settings
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b bg-slate-50 uppercase text-slate-500 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3">Category Name</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Capitalization</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {categories.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        {c.name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                            c.type === 'income'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          }`}
                        >
                          {c.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {c.isAsset ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                            <Check className="h-3 w-3" /> Capital Asset
                          </span>
                        ) : (
                          'Operating Flow'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.isActive ? 'active' : 'inactive'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create New User Account</h3>
            <p className="text-xs text-slate-500 mt-1">Assign an RBAC role to grant authorized business access.</p>

            <form onSubmit={handleCreateUser} className="mt-4 space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  className="w-full rounded-lg border px-3 py-1.5"
                  placeholder="e.g. Tanvir Hasan"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  className="w-full rounded-lg border px-3 py-1.5"
                  placeholder="user@business.com"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Phone</label>
                <input
                  type="text"
                  value={newUserData.phone}
                  onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                  className="w-full rounded-lg border px-3 py-1.5"
                  placeholder="+880 17..."
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Initial Password</label>
                <input
                  type="password"
                  required
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  className="w-full rounded-lg border px-3 py-1.5"
                  placeholder="Minimum 8 characters"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Assigned Role</label>
                <select
                  value={newUserData.roleKey}
                  onChange={(e) => setNewUserData({ ...newUserData, roleKey: e.target.value })}
                  className="w-full rounded-lg border px-3 py-1.5"
                >
                  <option value="admin">Admin</option>
                  <option value="accountant">Accountant</option>
                  <option value="manager">Manager</option>
                  <option value="investor">Investor</option>
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="rounded-lg border px-4 py-1.5 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                >
                  {saving ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
