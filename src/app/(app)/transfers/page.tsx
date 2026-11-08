'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyText } from '@/components/shared/money-text';
import { ArrowLeftRight, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { toPaisa, formatBDT } from '@/lib/money';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function TransfersPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [fee, setFee] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const loadData = () => {
    setIsLoading(true);
    Promise.all([
      fetch('/api/v1/accounts').then((r) => r.json()),
      fetch('/api/v1/transfers').then((r) => r.json()),
    ])
      .then(([accRes, trRes]) => {
        if (accRes.success) setAccounts(accRes.data);
        if (trRes.success) setTransfers(trRes.data);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fromAccountId === toAccountId) {
      toast.error('Source and destination accounts must be different.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/v1/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAccountId,
          toAccountId,
          amount: toPaisa(amount),
          fee: fee ? toPaisa(fee) : 0,
          reference,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Transfer failed.');
        return;
      }

      toast.success(data.message || 'Transfer successful!');
      setAmount('');
      setFee('');
      setReference('');
      setNotes('');
      loadData();
    } catch {
      toast.error('Network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedFromAcc = accounts.find((a) => a._id === fromAccountId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Account Transfers
        </h1>
        <p className="text-sm text-slate-500">
          Move funds between Bank, Cash, and Mobile Banking wallets with automatic double-entry posting.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transfer Form */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4 text-emerald-600" /> New Transfer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  From Account (Source)
                </label>
                <select
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  required
                >
                  <option value="">Select source account...</option>
                  {accounts.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name} (৳{(a.cachedBalance / 100).toFixed(2)})
                    </option>
                  ))}
                </select>
                {selectedFromAcc && (
                  <span className="text-[11px] text-slate-400 block mt-1">
                    Available: <strong className="text-slate-700 dark:text-slate-300">{formatBDT(selectedFromAcc.cachedBalance)}</strong>
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  To Account (Destination)
                </label>
                <select
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  required
                >
                  <option value="">Select destination account...</option>
                  {accounts
                    .filter((a) => a._id !== fromAccountId)
                    .map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Transfer Amount (৳ BDT)
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Fee / Charges (৳ BDT) — optional
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                />
                <span className="text-[11px] text-slate-400">
                  Fee is deducted from source account and posted to Bank Charges (COA 5190).
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reference No. / TrxID
                </label>
                <Input
                  placeholder="E.g., Bank TrxID, bKash TrxID..."
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" isLoading={isSubmitting}>
                Execute Transfer
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Transfer History */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base font-bold">Transfer History</CardTitle>
          </CardHeader>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading transfers...</div>
          ) : transfers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No internal transfers recorded yet.</div>
          ) : (
            <>
              {/* Mobile Card List (Visible on phones) */}
              <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {transfers.map((t) => (
                  <div key={t._id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">{formatDate(t.date)}</span>
                      <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {formatBDT(t.amount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-800 dark:text-slate-200">
                      <span>{t.fromAccountId?.name || 'Account'}</span>
                      <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>{t.toAccountId?.name || 'Account'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Fee: {t.fee > 0 ? formatBDT(t.fee) : '৳0.00'}</span>
                      <span>Ref: {t.reference || '—'}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View (Visible on >= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:bg-slate-800/40 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">From</th>
                      <th className="px-4 py-3">To</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-right">Fee</th>
                      <th className="px-4 py-3">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {transfers.map((t) => (
                      <tr key={t._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-3 text-slate-500">{formatDate(t.date)}</td>
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                          {t.fromAccountId?.name || 'Account'}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                          {t.toAccountId?.name || 'Account'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                          {formatBDT(t.amount)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-500">
                          {t.fee > 0 ? formatBDT(t.fee) : '—'}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-400">
                          {t.reference || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
