'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyText } from '@/components/shared/money-text';
import { StatusBadge } from '@/components/shared/status-badge';
import { HandCoins, Plus, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
import { toPaisa, formatBDT } from '@/lib/money';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function LoansPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRepayOpen, setIsRepayOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);

  // Create Form
  const [direction, setDirection] = useState<'taken' | 'given'>('taken');
  const [partyName, setPartyName] = useState('');
  const [partyContact, setPartyContact] = useState('');
  const [principal, setPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('0');
  const [termMonths, setTermMonths] = useState('12');
  const [financialAccountId, setFinancialAccountId] = useState('');

  // Repay Form
  const [repayPrincipal, setRepayPrincipal] = useState('');
  const [repayInterest, setRepayInterest] = useState('');
  const [repayAccountId, setRepayAccountId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = () => {
    setIsLoading(true);
    Promise.all([
      fetch('/api/v1/loans').then((r) => r.json()),
      fetch('/api/v1/accounts').then((r) => r.json()),
    ])
      .then(([loanRes, accRes]) => {
        if (loanRes.success) setLoans(loanRes.data);
        if (accRes.success) {
          setAccounts(accRes.data);
          if (accRes.data.length > 0) {
            setFinancialAccountId(accRes.data[0]._id);
            setRepayAccountId(accRes.data[0]._id);
          }
        }
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalOutstandingTaken = loans
    .filter((l) => l.direction === 'taken' && l.status === 'active')
    .reduce((acc, l) => acc + l.outstandingPrincipal, 0);

  const totalOutstandingGiven = loans
    .filter((l) => l.direction === 'given' && l.status === 'active')
    .reduce((acc, l) => acc + l.outstandingPrincipal, 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/v1/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          direction,
          partyName,
          partyContact,
          principal: toPaisa(principal),
          interestRate: parseFloat(interestRate) || 0,
          termMonths: parseInt(termMonths) || 12,
          financialAccountId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Failed to create loan.');
        return;
      }
      toast.success(data.message);
      setIsCreateOpen(false);
      setPartyName('');
      setPrincipal('');
      loadData();
    } catch {
      toast.error('Network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRepay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/v1/loans/${selectedLoan._id}/repayments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          principal: toPaisa(repayPrincipal),
          interest: repayInterest ? toPaisa(repayInterest) : 0,
          financialAccountId: repayAccountId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Repayment failed.');
        return;
      }
      toast.success(data.message);
      setIsRepayOpen(false);
      setRepayPrincipal('');
      setRepayInterest('');
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
            Loans & Debt Management
          </h1>
          <p className="text-sm text-slate-500">
            Commercial debt taken (liabilities) and loans extended to parties (assets).
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add / Disburse Loan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-gradient-to-r from-amber-600 to-orange-700 p-6 text-white shadow-lg shadow-amber-700/15">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-200">
            Total Outstanding Loans Taken (Payable Debt)
          </span>
          <div className="text-3xl font-extrabold tracking-tight mt-1 font-mono">
            {formatBDT(totalOutstandingTaken)}
          </div>
          <p className="text-xs text-amber-100 mt-1">
            Liability balance (COA 2100). Principal repayments decrease debt, not operating profit.
          </p>
        </div>

        <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white shadow-lg shadow-blue-700/15">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
            Total Loans Given (Receivables Asset)
          </span>
          <div className="text-3xl font-extrabold tracking-tight mt-1 font-mono">
            {formatBDT(totalOutstandingGiven)}
          </div>
          <p className="text-xs text-blue-100 mt-1">
            Asset balance (COA 1310). Capital lent out expecting repayment + interest income.
          </p>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100 dark:bg-slate-800/40 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Loan ID</th>
                <th className="px-5 py-3.5">Direction & Party</th>
                <th className="px-5 py-3.5">Due Date & Term</th>
                <th className="px-5 py-3.5 text-right">Original Principal</th>
                <th className="px-5 py-3.5 text-right">Outstanding</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">Loading loan records...</td>
                </tr>
              ) : loans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">No loans recorded yet.</td>
                </tr>
              ) : (
                loans.map((loan) => (
                  <tr key={loan._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-5 py-3 font-mono font-bold text-slate-900 dark:text-white">
                      {loan.loanNumber}
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        {loan.partyName}
                      </span>
                      <span className="capitalize text-[11px] text-slate-400">
                        {loan.direction === 'taken' ? 'Borrowed (Liability)' : 'Lent Out (Asset)'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      Due: {formatDate(loan.dueDate)} ({loan.termMonths} mo, {loan.interestRate}% interest)
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-semibold">
                      {formatBDT(loan.principal)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatBDT(loan.outstandingPrincipal)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={loan.status} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      {loan.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => {
                            setSelectedLoan(loan);
                            setRepayPrincipal((loan.outstandingPrincipal / 100).toFixed(2));
                            setIsRepayOpen(true);
                          }}
                        >
                          Repay / Collect
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Loan Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add / Disburse Loan</h2>
            <p className="text-xs text-slate-500 mb-6">Create a borrowed debt or lent asset with double-entry posting.</p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Loan Direction
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={direction === 'taken' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDirection('taken')}
                    className="h-10 text-xs"
                  >
                    Loan Taken (Borrowed)
                  </Button>
                  <Button
                    type="button"
                    variant={direction === 'given' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDirection('given')}
                    className="h-10 text-xs"
                  >
                    Loan Given (Lent)
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Party / Lender / Borrower Name
                </label>
                <Input placeholder="E.g., Prime Finance or John Doe" value={partyName} onChange={(e) => setPartyName(e.target.value)} required />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Principal Amount (৳ BDT)
                </label>
                <Input type="number" step="0.01" placeholder="0.00" value={principal} onChange={(e) => setPrincipal(e.target.value)} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Interest Rate %
                  </label>
                  <Input type="number" step="0.1" placeholder="9.5" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Term (Months)
                  </label>
                  <Input type="number" value={termMonths} onChange={(e) => setTermMonths(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Disburse Through / Deposit Into
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

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button type="submit" isLoading={isSubmitting}>Confirm & Post</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Repay Modal */}
      {isRepayOpen && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {selectedLoan.direction === 'taken' ? 'Repay Loan' : 'Collect Loan'} — {selectedLoan.loanNumber}
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Outstanding Principal: <strong className="font-mono text-slate-800 dark:text-slate-200">{formatBDT(selectedLoan.outstandingPrincipal)}</strong>
            </p>

            <form onSubmit={handleRepay} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Principal Amount (৳ BDT)
                </label>
                <Input type="number" step="0.01" value={repayPrincipal} onChange={(e) => setRepayPrincipal(e.target.value)} required />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Interest Amount (৳ BDT) — optional
                </label>
                <Input type="number" step="0.01" placeholder="0.00" value={repayInterest} onChange={(e) => setRepayInterest(e.target.value)} />
                <span className="text-[11px] text-slate-400">
                  Interest is posted to Interest Expense (COA 5200) or Interest Income (COA 4004).
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Account
                </label>
                <select
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
                  value={repayAccountId}
                  onChange={(e) => setRepayAccountId(e.target.value)}
                  required
                >
                  {accounts.map((a) => (
                    <option key={a._id} value={a._id}>{a.name} (৳{(a.cachedBalance / 100).toFixed(2)})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsRepayOpen(false)}>Cancel</Button>
                <Button type="submit" isLoading={isSubmitting}>Submit Payment</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
