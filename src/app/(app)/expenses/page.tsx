'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/shared/status-badge';
import { InvoiceAttachmentUpload } from '@/components/shared/invoice-attachment-upload';
import {
  ArrowUpRight,
  Plus,
  Search,
  Image as ImageIcon,
  TrendingDown,
  Receipt,
  X,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toPaisa, formatBDT } from '@/lib/money';
import { toast } from 'sonner';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [financialAccountId, setFinancialAccountId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [partyName, setPartyName] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = () => {
    setIsLoading(true);
    Promise.all([
      fetch('/api/v1/transactions?type=expense').then((r) => r.json()),
      fetch('/api/v1/transaction-categories').then((r) => r.json()),
      fetch('/api/v1/accounts').then((r) => r.json()),
    ])
      .then(([trxRes, catRes, accRes]) => {
        if (trxRes.success) setExpenses(trxRes.data);
        if (catRes.success) {
          const expCats = catRes.data.filter((c: any) => c.type === 'expense');
          setCategories(expCats);
          if (expCats.length > 0 && !categoryId) setCategoryId(expCats[0]._id);
        }
        if (accRes.success) {
          setAccounts(accRes.data);
          if (accRes.data.length > 0 && !financialAccountId) setFinancialAccountId(accRes.data[0]._id);
        }
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid expense amount');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/v1/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'expense',
          amount: toPaisa(amount),
          categoryId,
          financialAccountId,
          paymentMethod,
          partyName,
          referenceNo,
          attachments,
          description: description || 'Operating Expense Entry',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Failed to record expense.');
        return;
      }

      toast.success(data.message || 'Expense recorded successfully!');
      setIsModalOpen(false);
      setAmount('');
      setDescription('');
      setPartyName('');
      setReferenceNo('');
      setAttachments([]);
      loadData();
    } catch {
      toast.error('Network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalExpense = expenses.reduce(
    (acc, curr) => acc + (curr.status === 'posted' ? curr.amount : 0),
    0
  );

  const filteredExpenses = expenses.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.transactionNumber?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.partyName?.toLowerCase().includes(q) ||
      item.categoryId?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-md bg-orange-500/10 px-2 py-0.5 text-xs font-semibold text-orange-700 dark:text-orange-400 border border-orange-500/20">
              Operating Expenditures
            </span>
            <span className="text-xs text-slate-400">Total Entries: {expenses.length}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Expenses & Outflows
          </h1>
          <p className="text-sm text-slate-500">
            Vendor bills, supplier payments, utility fees, rent, payroll, and routine expenditures.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-sm bg-orange-600 hover:bg-orange-500 text-white">
          <Plus className="h-4 w-4" /> Record Expense
        </Button>
      </div>

      {/* Hero Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-orange-600 via-red-600 to-rose-700 p-6 text-white shadow-lg shadow-orange-700/15">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-orange-200">
              Total Recorded Expenses
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
              <TrendingDown className="h-5 w-5 text-orange-200" />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight mt-2 font-mono">
            {formatBDT(totalExpense)}
          </div>
          <p className="text-xs text-orange-100/90 mt-1">
            Sum of all posted operational costs. Excludes capital asset acquisitions.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Expense Records
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight mt-2 font-mono text-slate-900 dark:text-white">
            {expenses.length}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Verified double-entry expense vouchers recorded in the ledger.
          </p>
        </div>
      </div>

      {/* Search / Filter Bar */}
      {expenses.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search expense by transaction #, vendor name, memo, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 bg-white dark:bg-slate-900 rounded-xl"
          />
        </div>
      )}

      {/* Expense Records Display */}
      {isLoading ? (
        <Card className="p-8 text-center text-slate-400">
          <p className="text-sm">Loading expense records...</p>
        </Card>
      ) : expenses.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-8 sm:p-12 text-center border-dashed">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400 mb-4 shadow-sm">
            <ArrowUpRight className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No expense transactions recorded yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            Record supplier payments, rent, utilities, payroll, and other operating expenses.
          </p>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-sm bg-orange-600 hover:bg-orange-500 text-white">
            <Plus className="h-4 w-4" /> Record First Expense
          </Button>
        </Card>
      ) : filteredExpenses.length === 0 ? (
        <Card className="p-8 text-center text-slate-400">
          <p className="text-sm">No expense records match &quot;{search}&quot;</p>
        </Card>
      ) : (
        <>
          {/* Mobile Card List (Visible on phones & narrow viewports) */}
          <div className="block md:hidden space-y-3">
            {filteredExpenses.map((item) => (
              <div
                key={item._id}
                className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400">
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-mono text-sm font-bold text-slate-900 dark:text-white block">
                        {item.transactionNumber}
                      </span>
                      <span className="text-[11px] text-slate-400">{formatDate(item.date)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm font-bold text-orange-600 dark:text-orange-400 block">
                      -{formatBDT(item.amount)}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-2.5 text-xs space-y-1">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{item.description}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-medium">
                      {item.categoryId?.name || 'Expense'}
                    </span>
                    <span>{item.financialAccountId?.name || 'Account'}</span>
                  </div>
                  {item.partyName && (
                    <p className="text-[11px] text-slate-400">
                      Vendor / Payee: <span className="text-slate-600 dark:text-slate-300">{item.partyName}</span>
                    </p>
                  )}
                </div>

                {item.attachments && item.attachments.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {item.attachments.map((url: string, i: number) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 px-2 py-0.5 text-[10px] font-medium text-orange-700 dark:text-orange-300 hover:underline"
                      >
                        <ImageIcon className="h-3 w-3" />
                        <span>Receipt #{i + 1}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Table View (Visible on >= md) */}
          <Card className="hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100 dark:bg-slate-800/40 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Date & ID</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Description & Vendor</th>
                    <th className="px-5 py-3.5">Paying Account</th>
                    <th className="px-5 py-3.5 text-right">Amount</th>
                    <th className="px-5 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredExpenses.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-5 py-3 font-mono font-bold text-slate-900 dark:text-white">
                        {item.transactionNumber}
                        <span className="text-slate-400 text-[11px] block font-normal">
                          {formatDate(item.date)}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-200">
                        {item.categoryId?.name || 'Expense'}
                      </td>
                      <td className="px-5 py-3 text-slate-700 dark:text-slate-300 font-medium">
                        <div>
                          <span>{item.description}</span>
                          {item.partyName && (
                            <span className="text-slate-400 text-[11px] block">
                              Payee: {item.partyName}
                            </span>
                          )}
                          {item.attachments && item.attachments.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-1">
                              {item.attachments.map((url: string, i: number) => (
                                <a
                                  key={i}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 rounded-md bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 px-1.5 py-0.5 text-[10px] font-medium text-orange-700 dark:text-orange-300 hover:underline"
                                >
                                  <ImageIcon className="h-3 w-3" />
                                  <span>Bill #{i + 1}</span>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        <div>
                          <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                            {item.financialAccountId?.name}
                          </span>
                          <span className="text-[11px] text-slate-400 capitalize">
                            {item.paymentMethod?.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-orange-600">
                        -{formatBDT(item.amount)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={item.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Record Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900 my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400">
                <ArrowUpRight className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Record Expense</h2>
                <p className="text-xs text-slate-500">
                  Debit expense account and credit cash/bank with double-entry accuracy.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4 mt-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Expense Amount (৳ BDT) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="font-mono text-base font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Expense Category *
                  </label>
                  <select
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Paid From Account *
                  </label>
                  <select
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
                    value={financialAccountId}
                    onChange={(e) => setFinancialAccountId(e.target.value)}
                    required
                  >
                    {accounts.map((acc) => (
                      <option key={acc._id} value={acc._id}>
                        {acc.name} ({acc.type.replace('_', ' ')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="cash">Cash in Hand</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="mobile_money">bKash / Nagad / Rocket</option>
                    <option value="cheque">Bank Cheque</option>
                    <option value="card">Debit / Credit Card</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vendor / Payee
                  </label>
                  <Input
                    placeholder="e.g. Supplier name, Landlord, Utility"
                    value={partyName}
                    onChange={(e) => setPartyName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Memo
                </label>
                <Input
                  placeholder="e.g. Office rent, Stationery, Server hosting"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Cloudinary Bill / Receipt Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Receipt / Vendor Bill Picture (Cloudinary)
                </label>
                <InvoiceAttachmentUpload
                  attachments={attachments}
                  onChange={setAttachments}
                  folder="shopnear_finance/expenses"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting} className="gap-2 bg-orange-600 hover:bg-orange-500 text-white">
                  <Plus className="h-4 w-4" /> Save Expense
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
