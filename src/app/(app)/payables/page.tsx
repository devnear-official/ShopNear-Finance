'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyText } from '@/components/shared/money-text';
import { StatusBadge } from '@/components/shared/status-badge';
import { FileSpreadsheet, Plus } from 'lucide-react';
import { toPaisa, formatBDT } from '@/lib/money';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function PayablesPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [partyId, setPartyId] = useState('');
  const [total, setTotal] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = () => {
    setIsLoading(true);
    Promise.all([
      fetch('/api/v1/payables').then((r) => r.json()),
      fetch('/api/v1/parties?type=supplier').then((r) => r.json()),
    ])
      .then(([billRes, partRes]) => {
        if (billRes.success) setBills(billRes.data);
        if (partRes.success) {
          setParties(partRes.data);
          if (partRes.data.length > 0) setPartyId(partRes.data[0]._id);
        }
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalOutstandingAP = bills
    .filter((b) => b.status !== 'paid' && b.status !== 'void')
    .reduce((acc, b) => acc + (b.total - b.paidAmount), 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/v1/payables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partyId,
          total: toPaisa(total),
          dueDate: dueDate || undefined,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Failed to record bill.');
        return;
      }
      toast.success(data.message);
      setIsCreateOpen(false);
      setTotal('');
      setNotes('');
      loadData();
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
            Bills & Accounts Payable (AP)
          </h1>
          <p className="text-sm text-slate-500">
            Record supplier bills on accrual ledger and manage vendor obligations.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Record Bill
        </Button>
      </div>

      <div className="rounded-2xl bg-gradient-to-r from-orange-600 to-amber-700 p-6 text-white shadow-lg shadow-orange-700/15">
        <span className="text-xs font-semibold uppercase tracking-wider text-orange-200">
          Total Outstanding Accounts Payable (AP)
        </span>
        <div className="text-3xl font-extrabold tracking-tight mt-1 font-mono">
          {formatBDT(totalOutstandingAP)}
        </div>
        <p className="text-xs text-orange-100 mt-1">
          Unpaid vendor obligations on accrual ledger (COA 2001).
        </p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100 dark:bg-slate-800/40 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Bill #</th>
                <th className="px-5 py-3.5">Supplier</th>
                <th className="px-5 py-3.5">Due Date</th>
                <th className="px-5 py-3.5 text-right">Total</th>
                <th className="px-5 py-3.5 text-right">Paid</th>
                <th className="px-5 py-3.5 text-right">Balance Due</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">Loading bills...</td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">No bills recorded yet.</td>
                </tr>
              ) : (
                bills.map((bill) => {
                  const due = bill.total - bill.paidAmount;
                  return (
                    <tr key={bill._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-5 py-3 font-mono font-bold text-slate-900 dark:text-white">
                        {bill.billNumber}
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {bill.partyId?.name || 'Supplier'}
                      </td>
                      <td className="px-5 py-3 text-slate-500">{formatDate(bill.dueDate)}</td>
                      <td className="px-5 py-3 text-right font-mono font-semibold">{formatBDT(bill.total)}</td>
                      <td className="px-5 py-3 text-right font-mono text-emerald-600">{formatBDT(bill.paidAmount)}</td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatBDT(due)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={bill.status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Record Bill Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Record Vendor Bill</h2>
            <p className="text-xs text-slate-500 mb-6">Accrual expense obligation posted to Accounts Payable (COA 2001).</p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Supplier</label>
                <select
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
                  value={partyId}
                  onChange={(e) => setPartyId(e.target.value)}
                  required
                >
                  {parties.map((p) => (
                    <option key={p._id} value={p._id}>{p.name} ({p.phone})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Bill Amount (৳ BDT)</label>
                <Input type="number" step="0.01" placeholder="0.00" value={total} onChange={(e) => setTotal(e.target.value)} required />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button type="submit" isLoading={isSubmitting}>Record Bill</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
