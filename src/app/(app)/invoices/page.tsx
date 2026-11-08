'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyText } from '@/components/shared/money-text';
import { StatusBadge } from '@/components/shared/status-badge';
import { Receipt, Plus, CheckCircle2 } from 'lucide-react';
import { toPaisa, formatBDT } from '@/lib/money';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Form State
  const [partyId, setPartyId] = useState('');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [notes, setNotes] = useState('');

  // Payment Form
  const [payAmount, setPayAmount] = useState('');
  const [payAccountId, setPayAccountId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = () => {
    setIsLoading(true);
    Promise.all([
      fetch('/api/v1/invoices').then((r) => r.json()),
      fetch('/api/v1/parties?type=customer').then((r) => r.json()),
      fetch('/api/v1/accounts').then((r) => r.json()),
    ])
      .then(([invRes, partRes, accRes]) => {
        if (invRes.success) setInvoices(invRes.data);
        if (partRes.success) {
          setParties(partRes.data);
          if (partRes.data.length > 0) setPartyId(partRes.data[0]._id);
        }
        if (accRes.success) {
          setAccounts(accRes.data);
          if (accRes.data.length > 0) setPayAccountId(accRes.data[0]._id);
        }
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalOutstandingAR = invoices
    .filter((i) => i.status !== 'paid' && i.status !== 'void')
    .reduce((acc, i) => acc + (i.total - i.paidAmount), 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/v1/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partyId,
          items: [
            {
              name: itemName,
              quantity: parseInt(quantity) || 1,
              unitPrice: toPaisa(unitPrice),
            },
          ],
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Failed to issue invoice.');
        return;
      }
      toast.success(data.message);
      setIsCreateOpen(false);
      setItemName('');
      setUnitPrice('');
      loadData();
    } catch {
      toast.error('Network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceivePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/v1/invoices/${selectedInvoice._id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: toPaisa(payAmount),
          financialAccountId: payAccountId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Payment recording failed.');
        return;
      }
      toast.success(data.message);
      setIsPayOpen(false);
      setPayAmount('');
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
            Invoices & Accounts Receivable (AR)
          </h1>
          <p className="text-sm text-slate-500">
            Issue accrual sales invoices, track customer receivables, and record cash collections.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Issue Invoice
        </Button>
      </div>

      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white shadow-lg shadow-blue-700/15">
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
          Total Outstanding Accounts Receivable (AR)
        </span>
        <div className="text-3xl font-extrabold tracking-tight mt-1 font-mono">
          {formatBDT(totalOutstandingAR)}
        </div>
        <p className="text-xs text-blue-100 mt-1">
          Uncollected customer sales on accrual ledger (COA 1300).
        </p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100 dark:bg-slate-800/40 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Invoice #</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Due Date</th>
                <th className="px-5 py-3.5 text-right">Total</th>
                <th className="px-5 py-3.5 text-right">Paid</th>
                <th className="px-5 py-3.5 text-right">Balance Due</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400">Loading invoices...</td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400">No invoices issued yet.</td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const due = inv.total - inv.paidAmount;
                  return (
                    <tr key={inv._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-5 py-3 font-mono font-bold text-slate-900 dark:text-white">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {inv.partyId?.name || 'Customer'}
                      </td>
                      <td className="px-5 py-3 text-slate-500">{formatDate(inv.dueDate)}</td>
                      <td className="px-5 py-3 text-right font-mono font-semibold">{formatBDT(inv.total)}</td>
                      <td className="px-5 py-3 text-right font-mono text-emerald-600">{formatBDT(inv.paidAmount)}</td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatBDT(due)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        {inv.status !== 'paid' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setPayAmount((due / 100).toFixed(2));
                              setIsPayOpen(true);
                            }}
                          >
                            Receive Payment
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Issue Invoice Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Issue Sales Invoice</h2>
            <p className="text-xs text-slate-500 mb-6">Accrual invoice posting into Accounts Receivable (COA 1300).</p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Customer</label>
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
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Item / Product Name</label>
                <Input placeholder="E.g., Software Consulting Service" value={itemName} onChange={(e) => setItemName(e.target.value)} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Quantity</label>
                  <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Unit Price (৳ BDT)</label>
                  <Input type="number" step="0.01" placeholder="0.00" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} required />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button type="submit" isLoading={isSubmitting}>Issue Invoice</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Payment Modal */}
      {isPayOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Record Customer Payment</h2>
            <p className="text-xs text-slate-500 mb-6">
              Invoice: <strong className="font-mono text-slate-800 dark:text-slate-200">{selectedInvoice.invoiceNumber}</strong>
            </p>

            <form onSubmit={handleReceivePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Received (৳ BDT)</label>
                <Input type="number" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} required />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Deposit Into Account</label>
                <select
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
                  value={payAccountId}
                  onChange={(e) => setPayAccountId(e.target.value)}
                  required
                >
                  {accounts.map((a) => (
                    <option key={a._id} value={a._id}>{a.name} (৳{(a.cachedBalance / 100).toFixed(2)})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsPayOpen(false)}>Cancel</Button>
                <Button type="submit" isLoading={isSubmitting}>Confirm Payment</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
