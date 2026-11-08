'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyText } from '@/components/shared/money-text';
import { StatusBadge } from '@/components/shared/status-badge';
import { Plus, Trash2, CheckCircle2, AlertCircle, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { formatBDT, toPaisa } from '@/lib/money';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface Account {
  _id: string;
  code: string;
  name: string;
  allowPosting: boolean;
}

interface JournalLineRow {
  accountId: string;
  debit: string;
  credit: string;
  description: string;
}

export default function JournalEntriesPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<JournalLineRow[]>([
    { accountId: '', debit: '', credit: '', description: '' },
    { accountId: '', debit: '', credit: '', description: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEntries = () => {
    setIsLoading(true);
    fetch('/api/v1/journal-entries')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEntries(data.data);
        }
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchEntries();
    fetch('/api/v1/chart-of-accounts')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAccounts(data.data.filter((a: Account) => a.allowPosting));
        }
      });
  }, []);

  // Compute live debit and credit totals in integer paisa
  let totalDebitPaisa = 0;
  let totalCreditPaisa = 0;

  lines.forEach((l) => {
    try {
      if (l.debit) totalDebitPaisa += toPaisa(l.debit);
    } catch {}
    try {
      if (l.credit) totalCreditPaisa += toPaisa(l.credit);
    } catch {}
  });

  const isBalanced = totalDebitPaisa > 0 && totalDebitPaisa === totalCreditPaisa;
  const differencePaisa = Math.abs(totalDebitPaisa - totalCreditPaisa);

  const handleAddLine = () => {
    setLines([...lines, { accountId: '', debit: '', credit: '', description: '' }]);
  };

  const handleRemoveLine = (idx: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== idx));
  };

  const updateLine = (idx: number, field: keyof JournalLineRow, val: string) => {
    const updated = [...lines];
    updated[idx][field] = val;
    // Mutually exclusive: if debit entered, clear credit and vice versa
    if (field === 'debit' && val !== '') updated[idx].credit = '';
    if (field === 'credit' && val !== '') updated[idx].debit = '';
    setLines(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      toast.error('Cannot post unbalanced journal entry.');
      return;
    }

    try {
      setIsSubmitting(true);
      const postLines = lines.map((l) => ({
        accountId: l.accountId,
        debit: l.debit ? toPaisa(l.debit) : 0,
        credit: l.credit ? toPaisa(l.credit) : 0,
        description: l.description || description,
      }));

      const res = await fetch('/api/v1/journal-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          description,
          lines: postLines,
          sourceType: 'manual',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Failed to post entry.');
        return;
      }

      toast.success(data.message || 'Journal entry posted!');
      setIsModalOpen(false);
      setDescription('');
      setLines([
        { accountId: '', debit: '', credit: '', description: '' },
        { accountId: '', debit: '', credit: '', description: '' },
      ]);
      fetchEntries();
    } catch {
      toast.error('Network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReverse = async (id: string, entryNo: string) => {
    const reason = prompt(`Enter reason for reversing journal entry ${entryNo}:`);
    if (!reason) return;

    try {
      const res = await fetch(`/api/v1/journal-entries/${id}/reverse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchEntries();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Failed to reverse entry');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Journal Entries
          </h1>
          <p className="text-sm text-slate-500">
            Immutable double-entry transaction posting ledger with live validation.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Journal Entry
        </Button>
      </div>

      {/* Modal / Slide-over Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">New Journal Entry</h2>
            <p className="text-xs text-slate-500 mb-6">Create a balanced double-entry transaction record.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Entry Date
                  </label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Description / Narration
                  </label>
                  <Input
                    placeholder="E.g., Office equipment purchase, rent payment..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Lines Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Journal Lines</span>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddLine}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Line
                  </Button>
                </div>

                <div className="space-y-2.5">
                  {lines.map((line, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-center gap-2 rounded-xl border border-slate-200 p-2.5 dark:border-slate-800">
                      <select
                        className="h-10 w-full sm:w-1/3 rounded-xl border border-slate-200 bg-white px-3 text-xs dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200"
                        value={line.accountId}
                        onChange={(e) => updateLine(idx, 'accountId', e.target.value)}
                        required
                      >
                        <option value="">Select Account...</option>
                        {accounts.map((a) => (
                          <option key={a._id} value={a._id}>
                            {a.code} - {a.name}
                          </option>
                        ))}
                      </select>

                      <Input
                        placeholder="Line memo (optional)"
                        className="text-xs h-10 w-full sm:flex-1"
                        value={line.description}
                        onChange={(e) => updateLine(idx, 'description', e.target.value)}
                      />

                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Debit (৳)"
                        className="text-xs h-10 w-full sm:w-28 text-right font-mono"
                        value={line.debit}
                        onChange={(e) => updateLine(idx, 'debit', e.target.value)}
                      />

                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Credit (৳)"
                        className="text-xs h-10 w-full sm:w-28 text-right font-mono"
                        value={line.credit}
                        onChange={(e) => updateLine(idx, 'credit', e.target.value)}
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        disabled={lines.length <= 2}
                        className="p-2 text-slate-400 hover:text-red-500 disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Balance Verification Footer */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">
                      Total Debit: <strong className="font-mono">{formatBDT(totalDebitPaisa)}</strong> | Total Credit: <strong className="font-mono">{formatBDT(totalCreditPaisa)}</strong>
                    </p>
                  </div>
                  <div>
                    {isBalanced ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <CheckCircle2 className="h-4 w-4" /> Balanced Entry
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800 dark:bg-red-950 dark:text-red-300">
                        <AlertCircle className="h-4 w-4" /> Unbalanced by {formatBDT(differencePaisa)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!isBalanced || isSubmitting} isLoading={isSubmitting}>
                  Post to Ledger
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Entries List */}
      <Card>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-slate-400">Loading journal entries...</div>
          ) : entries.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">No journal entries recorded yet.</div>
          ) : (
            entries.map((entry) => {
              const isExpanded = expandedEntryId === entry._id;
              return (
                <div key={entry._id} className="p-4 sm:p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setExpandedEntryId(isExpanded ? null : entry._id)}
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 dark:hover:bg-slate-800"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {entry.entryNumber}
                          </span>
                          <StatusBadge status={entry.status} />
                        </div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                          {entry.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:text-right">
                      <div>
                        <p className="text-xs text-slate-400">{formatDate(entry.date)}</p>
                        <MoneyText paisa={entry.totalDebit} className="font-bold text-sm text-slate-900 dark:text-white" />
                      </div>
                      {entry.status === 'posted' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReverse(entry._id, entry.entryNumber)}
                          title="Reverse this entry"
                        >
                          <RotateCcw className="h-4 w-4 text-slate-400 hover:text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Lines */}
                  {isExpanded && (
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 overflow-x-auto">
                      <table className="w-full min-w-[520px] text-xs">
                        <thead className="text-slate-400 uppercase font-semibold">
                          <tr>
                            <th className="text-left pb-2">Account</th>
                            <th className="text-left pb-2">Line Memo</th>
                            <th className="text-right pb-2">Debit</th>
                            <th className="text-right pb-2">Credit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {entry.lines?.map((line: any) => (
                            <tr key={line._id} className="py-1.5">
                              <td className="py-2 font-mono font-medium text-slate-800 dark:text-slate-200">
                                {line.accountId?.code} - {line.accountId?.name}
                              </td>
                              <td className="py-2 text-slate-500">{line.description}</td>
                              <td className="py-2 text-right font-mono font-semibold">
                                {line.debit > 0 ? formatBDT(line.debit) : '—'}
                              </td>
                              <td className="py-2 text-right font-mono font-semibold">
                                {line.credit > 0 ? formatBDT(line.credit) : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
