'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyText } from '@/components/shared/money-text';
import { StatusBadge } from '@/components/shared/status-badge';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  RotateCcw,
  Search,
  Filter,
  CheckCircle2,
  Package,
  Image as ImageIcon,
} from 'lucide-react';
import { toPaisa, formatBDT } from '@/lib/money';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { InvoiceAttachmentUpload } from '@/components/shared/invoice-attachment-upload';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState<'income' | 'expense' | 'asset_purchase'>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [financialAccountId, setFinancialAccountId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [partyName, setPartyName] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = () => {
    setIsLoading(true);
    let url = `/api/v1/transactions`;
    if (activeTab !== 'all') url += `?type=${activeTab}`;

    Promise.all([
      fetch(url).then((r) => r.json()),
      fetch('/api/v1/transaction-categories').then((r) => r.json()),
      fetch('/api/v1/accounts').then((r) => r.json()),
    ])
      .then(([trxRes, catRes, accRes]) => {
        if (trxRes.success) setTransactions(trxRes.data);
        if (catRes.success) {
          setCategories(catRes.data);
          if (catRes.data.length > 0 && !categoryId) setCategoryId(catRes.data[0]._id);
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
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/v1/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          amount: toPaisa(amount),
          categoryId,
          financialAccountId,
          paymentMethod,
          partyName,
          referenceNo,
          attachments,
          description,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Transaction failed.');
        return;
      }

      toast.success(data.message);
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

  const handleReverse = async (id: string, trxNumber: string) => {
    const reason = prompt(`Enter reason for reversing transaction ${trxNumber}:`);
    if (!reason) return;

    try {
      const res = await fetch(`/api/v1/transactions/${id}/reverse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        loadData();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Failed to reverse transaction');
    }
  };

  const filteredCategories = categories.filter((c) =>
    type === 'asset_purchase' ? c.type === 'expense' : c.type === type
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Transactions
          </h1>
          <p className="text-sm text-slate-500">
            Income receipts, operational expenses, and asset acquisitions.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Record Transaction
        </Button>
      </div>

      {/* Tabs and Search */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
            {[
              { id: 'all', label: 'All Transactions' },
              { id: 'income', label: 'Income Only' },
              { id: 'expense', label: 'Expenses Only' },
              { id: 'asset_purchase', label: 'Asset Purchases' },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className="text-xs h-9"
              >
                {tab.label}
              </Button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search memo, party, ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Transactions Display */}
      {isLoading ? (
        <Card className="p-8 text-center text-slate-400">
          <p className="text-sm">Loading transactions...</p>
        </Card>
      ) : transactions.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-8 sm:p-12 text-center border-dashed">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 mb-4 shadow-sm">
            <Package className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No transactions found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            Record revenue receipts, operational expenses, or asset acquisitions to begin tracking business activity.
          </p>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" /> Record First Transaction
          </Button>
        </Card>
      ) : (
        <>
          {/* Mobile Card List (Visible on phones & narrow screens) */}
          <div className="block md:hidden space-y-3">
            {transactions.map((trx) => {
              const isIncome = trx.type === 'income';
              const isAsset = trx.type === 'asset_purchase';

              return (
                <div
                  key={trx._id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          isIncome
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : isAsset
                            ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400'
                            : 'bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400'
                        }`}
                      >
                        {isIncome ? (
                          <ArrowDownLeft className="h-4 w-4" />
                        ) : isAsset ? (
                          <Package className="h-4 w-4" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <span className="font-mono text-sm font-bold text-slate-900 dark:text-white block">
                          {trx.transactionNumber}
                        </span>
                        <span className="text-[11px] text-slate-400">{formatDate(trx.date)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-mono text-sm font-bold block ${
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isAsset
                            ? 'text-purple-600 dark:text-purple-400'
                            : 'text-orange-600 dark:text-orange-400'
                        }`}
                      >
                        {isIncome ? `+${formatBDT(trx.amount)}` : `-${formatBDT(trx.amount)}`}
                      </span>
                      <StatusBadge status={trx.status} />
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800/80 pt-2.5 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                      <span className="font-semibold">{trx.description}</span>
                      <span className="text-[11px] text-slate-400 capitalize">{trx.paymentMethod}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span>{trx.categoryId?.name || 'Category'}</span>
                      <span>{trx.financialAccountId?.name || 'Account'}</span>
                    </div>
                    {trx.partyName && (
                      <div className="text-[11px] text-slate-400">
                        Party: <span className="text-slate-600 dark:text-slate-300">{trx.partyName}</span>
                      </div>
                    )}
                  </div>

                  {trx.attachments && trx.attachments.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {trx.attachments.map((url: string, i: number) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 hover:underline"
                        >
                          <ImageIcon className="h-3 w-3" />
                          <span>Receipt #{i + 1}</span>
                        </a>
                      ))}
                    </div>
                  )}

                  {trx.status === 'posted' && (
                    <div className="pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                        onClick={() => handleReverse(trx._id, trx.transactionNumber)}
                      >
                        <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reverse Transaction
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (Visible on >= md) */}
          <Card className="hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100 dark:bg-slate-800/40 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Date & ID</th>
                    <th className="px-5 py-3.5">Type & Category</th>
                    <th className="px-5 py-3.5">Description & Party</th>
                    <th className="px-5 py-3.5">Account / Method</th>
                    <th className="px-5 py-3.5 text-right">Amount</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {transactions.map((trx) => {
                    const isIncome = trx.type === 'income';
                    const isAsset = trx.type === 'asset_purchase';

                    return (
                      <tr key={trx._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-5 py-3">
                          <span className="font-mono font-bold text-slate-900 dark:text-white block">
                            {trx.transactionNumber}
                          </span>
                          <span className="text-slate-400 text-[11px]">{formatDate(trx.date)}</span>
                        </td>

                        <td className="px-5 py-3">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                            {trx.categoryId?.name || 'Category'}
                          </span>
                          <span className="capitalize text-[11px] text-slate-400">{trx.type.replace('_', ' ')}</span>
                        </td>

                        <td className="px-5 py-3">
                          <span className="text-slate-800 dark:text-slate-200 font-medium block">
                            {trx.description}
                          </span>
                          {trx.partyName && (
                            <span className="text-[11px] text-slate-400 block">Party: {trx.partyName}</span>
                          )}
                          {trx.attachments && trx.attachments.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-1">
                              {trx.attachments.map((url: string, i: number) => (
                                <a
                                  key={i}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 hover:underline"
                                  title="View Cloudinary Invoice Picture"
                                >
                                  <ImageIcon className="h-3 w-3" />
                                  <span>Receipt #{i + 1}</span>
                                </a>
                              ))}
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-3">
                          <span className="text-slate-700 dark:text-slate-300 font-medium block">
                            {trx.financialAccountId?.name || 'Account'}
                          </span>
                          <span className="capitalize text-[11px] text-slate-400">{trx.paymentMethod}</span>
                        </td>

                        <td className="px-5 py-3 text-right">
                          <span
                            className={`font-mono font-bold text-sm ${
                              isIncome
                                ? 'text-emerald-600'
                                : isAsset
                                ? 'text-purple-600'
                                : 'text-orange-600'
                            }`}
                          >
                            {isIncome ? `+${formatBDT(trx.amount)}` : `-${formatBDT(trx.amount)}`}
                          </span>
                        </td>

                        <td className="px-5 py-3">
                          <StatusBadge status={trx.status} />
                        </td>

                        <td className="px-5 py-3 text-right">
                          {trx.status === 'posted' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReverse(trx._id, trx.transactionNumber)}
                              title="Reverse transaction"
                            >
                              <RotateCcw className="h-4 w-4 text-slate-400 hover:text-red-500" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Record Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Record Transaction</h2>
            <p className="text-xs text-slate-500 mb-6">Financial entry posted with double-entry precision.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Transaction Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={type === 'income' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setType('income')}
                    className="h-10 text-xs"
                  >
                    <ArrowDownLeft className="h-3.5 w-3.5 mr-1" /> Income
                  </Button>
                  <Button
                    type="button"
                    variant={type === 'expense' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setType('expense')}
                    className="h-10 text-xs"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5 mr-1" /> Expense
                  </Button>
                  <Button
                    type="button"
                    variant={type === 'asset_purchase' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setType('asset_purchase')}
                    className="h-10 text-xs"
                  >
                    <Package className="h-3.5 w-3.5 mr-1" /> Asset Purchase
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Amount (৳ BDT)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                  >
                    {filteredCategories.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Financial Account
                  </label>
                  <select
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
                    value={financialAccountId}
                    onChange={(e) => setFinancialAccountId(e.target.value)}
                    required
                  >
                    {accounts.map((a) => (
                      <option key={a._id} value={a._id}>{a.name} (৳{(a.cachedBalance / 100).toFixed(2)})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="mobile_banking">Mobile Banking (bKash/Nagad)</option>
                    <option value="card">Card</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Party / Vendor / Customer (optional)
                  </label>
                  <Input placeholder="E.g., ABC Ltd." value={partyName} onChange={(e) => setPartyName(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Narration
                </label>
                <Input placeholder="E.g., Monthly office internet subscription" value={description} onChange={(e) => setDescription(e.target.value)} required />
              </div>

              {/* Cloudinary Invoice/Bill Picture Upload */}
              <div className="pt-1">
                <InvoiceAttachmentUpload
                  attachments={attachments}
                  onChange={setAttachments}
                  folder="shopnear_finance/transactions"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" isLoading={isSubmitting}>Save & Post</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
