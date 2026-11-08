'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyText } from '@/components/shared/money-text';
import { StatusBadge } from '@/components/shared/status-badge';
import { Landmark, Smartphone, Banknote, Plus, ArrowLeftRight, FileText, CheckCircle2 } from 'lucide-react';
import { toPaisa, formatBDT } from '@/lib/money';
import { toast } from 'sonner';

interface Account {
  _id: string;
  name: string;
  type: string;
  accountNumber?: string;
  bankName?: string;
  provider?: string;
  cachedBalance: number;
  status: string;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [type, setType] = useState('bank');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [provider, setProvider] = useState('bKash');
  const [openingBalance, setOpeningBalance] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAccounts = () => {
    setIsLoading(true);
    fetch('/api/v1/accounts')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAccounts(data.data);
        }
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const totalLiquidity = accounts.reduce((acc, curr) => acc + (curr.cachedBalance || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          bankName: type === 'bank' ? bankName : undefined,
          accountNumber,
          provider: type === 'mobile_banking' ? provider : undefined,
          openingBalance: openingBalance ? toPaisa(openingBalance) : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Failed to create account.');
        return;
      }
      toast.success(data.message);
      setIsModalOpen(false);
      setName('');
      setAccountNumber('');
      setBankName('');
      setOpeningBalance('');
      fetchAccounts();
    } catch {
      toast.error('Network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Financial Accounts & Wallets
          </h1>
          <p className="text-sm text-slate-500">
            Cash in hand, commercial bank accounts, and mobile banking wallets.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/transfers">
            <Button variant="outline">
              <ArrowLeftRight className="mr-2 h-4 w-4" /> Transfer Funds
            </Button>
          </Link>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Account
          </Button>
        </div>
      </div>

      {/* Liquidity Hero Card */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white shadow-lg shadow-emerald-700/15">
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
          Total Available Business Liquidity
        </span>
        <div className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1 font-mono">
          {formatBDT(totalLiquidity)}
        </div>
        <p className="text-xs text-emerald-100 mt-1">
          Sum of all active cash, bank, and mobile banking account balances derived directly from the general ledger.
        </p>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-sm text-slate-400">Loading accounts...</div>
        ) : accounts.length === 0 ? (
          <div className="col-span-full py-12 text-center text-sm text-slate-400">No financial accounts set up yet.</div>
        ) : (
          accounts.map((acc) => {
            let Icon = Landmark;
            if (acc.type === 'cash' || acc.type === 'petty_cash') Icon = Banknote;
            if (acc.type === 'mobile_banking') Icon = Smartphone;

            return (
              <Card key={acc._id} className="relative overflow-hidden group hover:border-emerald-300 transition-colors">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                        {acc.name}
                      </CardTitle>
                      <p className="text-xs text-slate-400 capitalize">
                        {acc.type.replace('_', ' ')} {acc.provider ? `(${acc.provider})` : ''}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={acc.status} />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-xs text-slate-400">Available Balance</span>
                    <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white mt-0.5">
                      <MoneyText paisa={acc.cachedBalance} />
                    </div>
                  </div>

                  {acc.accountNumber && (
                    <div className="text-xs text-slate-500 font-mono bg-slate-50 p-2 rounded-lg dark:bg-slate-800">
                      A/C: {acc.accountNumber} {acc.bankName ? `(${acc.bankName})` : ''}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <Link href={`/accounts/${acc._id}/ledger`}>
                      <Button variant="ghost" size="sm" className="text-xs text-emerald-600 hover:text-emerald-700">
                        <FileText className="h-3.5 w-3.5 mr-1" /> View Statement
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Create Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add Financial Account</h2>
            <p className="text-xs text-slate-500 mb-6">Create a new cash, bank, or mobile banking wallet account.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Account Type
                </label>
                <select
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="bank">Bank Account</option>
                  <option value="mobile_banking">Mobile Banking (bKash, Nagad, etc.)</option>
                  <option value="cash">Cash in Hand</option>
                  <option value="petty_cash">Petty Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Account Name / Label
                </label>
                <Input
                  placeholder="E.g., City Bank Main, bKash Merchant Wallet..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {type === 'bank' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bank Name
                  </label>
                  <Input
                    placeholder="E.g., City Bank Ltd., BRAC Bank..."
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    required
                  />
                </div>
              )}

              {type === 'mobile_banking' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Wallet Provider
                  </label>
                  <select
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                  >
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Rocket">Rocket</option>
                    <option value="Upay">Upay</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Account Number / Wallet Phone Number
                </label>
                <Input
                  placeholder="E.g., 1502448201001 or 01700000000"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Opening Balance (৳ BDT)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                />
                <span className="text-[11px] text-slate-400">
                  Opening balance will automatically generate an opening double-entry transaction.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  Save Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
