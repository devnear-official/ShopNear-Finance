'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyText } from '@/components/shared/money-text';
import { StatusBadge } from '@/components/shared/status-badge';
import { Users, Plus, ArrowUpRight, ArrowDownLeft, Search, Wallet, FileText, ChevronRight } from 'lucide-react';
import { toPaisa, formatBDT } from '@/lib/money';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface Investor {
  _id: string;
  investorCode: string;
  fullName: string;
  phone: string;
  email?: string;
  investmentType: string;
  profitSharePercentage: number;
  currentCapital: number;
  status: string;
}

export default function InvestorsPage() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isInvestOpen, setIsInvestOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [selectedInvestorId, setSelectedInvestorId] = useState('');

  // Registration Form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [investmentType, setInvestmentType] = useState('equity');
  const [profitShare, setProfitShare] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Transaction Form (Invest / Withdraw)
  const [trxAmount, setTrxAmount] = useState('');
  const [financialAccountId, setFinancialAccountId] = useState('');
  const [trxNotes, setTrxNotes] = useState('');

  const loadData = () => {
    setIsLoading(true);
    Promise.all([
      fetch('/api/v1/investors').then((r) => r.json()),
      fetch('/api/v1/accounts').then((r) => r.json()),
    ])
      .then(([invRes, accRes]) => {
        if (invRes.success) setInvestors(invRes.data);
        if (accRes.success) {
          setAccounts(accRes.data);
          if (accRes.data.length > 0) setFinancialAccountId(accRes.data[0]._id);
        }
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalCapital = investors.reduce((acc, curr) => acc + (curr.currentCapital || 0), 0);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/investors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phone,
          email,
          investmentType,
          profitSharePercentage: parseFloat(profitShare) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Failed to register investor.');
        return;
      }
      toast.success(data.message);
      setIsRegisterOpen(false);
      setFullName('');
      setPhone('');
      setEmail('');
      loadData();
    } catch {
      toast.error('Network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInvest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestorId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/investors/${selectedInvestorId}/investments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: toPaisa(trxAmount),
          financialAccountId,
          notes: trxNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Investment failed.');
        return;
      }
      toast.success(data.message);
      setIsInvestOpen(false);
      setTrxAmount('');
      setTrxNotes('');
      loadData();
    } catch {
      toast.error('Network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestorId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/investors/${selectedInvestorId}/withdrawals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: toPaisa(trxAmount),
          financialAccountId,
          notes: trxNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Withdrawal failed.');
        return;
      }
      toast.success(data.message);
      setIsWithdrawOpen(false);
      setTrxAmount('');
      setTrxNotes('');
      loadData();
    } catch {
      toast.error('Network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredInvestors = investors.filter(
    (inv) =>
      inv.fullName.toLowerCase().includes(search.toLowerCase()) ||
      inv.investorCode.toLowerCase().includes(search.toLowerCase()) ||
      inv.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Investor Management
          </h1>
          <p className="text-sm text-slate-500">
            Track capital contributions, profit sharing, withdrawals, and individual sub-ledgers.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsRegisterOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Investor
          </Button>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-800 p-6 text-white shadow-lg shadow-purple-900/15">
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-200">
            Total Investor Capital Balance
          </span>
          <div className="text-3xl font-extrabold tracking-tight mt-1 font-mono">
            {formatBDT(totalCapital)}
          </div>
          <p className="text-xs text-purple-200 mt-1">
            Current equity balance of all active investors across the enterprise.
          </p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Active Investors</CardTitle>
            <Users className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{investors.length}</div>
            <p className="text-xs text-slate-500 mt-1">Registered partner portfolios</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Equity Protection</CardTitle>
            <Wallet className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold text-slate-900 dark:text-white">ACID Protected</div>
            <p className="text-xs text-slate-500 mt-1">Overdraws & unverified withdrawals blocked</p>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search investors by code (INV-0001), name, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Investor Cards / Table */}
      <Card>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-slate-400">Loading investors...</div>
          ) : filteredInvestors.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">No investors found.</div>
          ) : (
            filteredInvestors.map((inv) => (
              <div key={inv._id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-800 font-bold text-sm dark:bg-purple-950 dark:text-purple-300">
                    {inv.fullName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-base">
                        {inv.fullName}
                      </span>
                      <span className="font-mono text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-semibold dark:bg-purple-950/60 dark:text-purple-300">
                        {inv.investorCode}
                      </span>
                      <StatusBadge status={inv.status} />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Phone: {inv.phone} {inv.email ? `• ${inv.email}` : ''} • Share: {inv.profitSharePercentage}%
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="text-left md:text-right">
                    <span className="text-xs text-slate-400 block">Current Capital</span>
                    <MoneyText paisa={inv.currentCapital} className="font-mono font-bold text-base text-slate-900 dark:text-white" />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        setSelectedInvestorId(inv._id);
                        setIsInvestOpen(true);
                      }}
                    >
                      <ArrowDownLeft className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Invest
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        setSelectedInvestorId(inv._id);
                        setIsWithdrawOpen(true);
                      }}
                    >
                      <ArrowUpRight className="h-3.5 w-3.5 mr-1 text-orange-600" /> Withdraw
                    </Button>
                    <Link href={`/investors/${inv._id}`}>
                      <Button variant="ghost" size="sm" className="text-xs">
                        Ledger <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Register Investor Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Register Investor</h2>
            <p className="text-xs text-slate-500 mb-6">Create a new partner portfolio profile.</p>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <Input placeholder="E.g., Tariqul Islam" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <Input placeholder="E.g., +8801700000000" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address (optional)
                </label>
                <Input type="email" placeholder="investor@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Investment Type
                  </label>
                  <select
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
                    value={investmentType}
                    onChange={(e) => setInvestmentType(e.target.value)}
                  >
                    <option value="equity">Equity Share</option>
                    <option value="profit_share">Profit Sharing</option>
                    <option value="fixed_return">Fixed Return</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Profit Share %
                  </label>
                  <Input type="number" step="0.1" placeholder="15" value={profitShare} onChange={(e) => setProfitShare(e.target.value)} />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsRegisterOpen(false)}>Cancel</Button>
                <Button type="submit" isLoading={isSubmitting}>Register Investor</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Investment Modal */}
      {isInvestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Record Capital Investment</h2>
            <p className="text-xs text-slate-500 mb-6">Deposit funds into business accounts as investor equity.</p>

            <form onSubmit={handleInvest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Destination Account (Bank/Cash/Wallet)
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Investment Amount (৳ BDT)
                </label>
                <Input type="number" step="0.01" placeholder="0.00" value={trxAmount} onChange={(e) => setTrxAmount(e.target.value)} required />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Reference
                </label>
                <Input placeholder="E.g., Cheque deposit #88219" value={trxNotes} onChange={(e) => setTrxNotes(e.target.value)} />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsInvestOpen(false)}>Cancel</Button>
                <Button type="submit" isLoading={isSubmitting}>Confirm Investment</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Withdrawal Modal */}
      {isWithdrawOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Record Capital Withdrawal</h2>
            <p className="text-xs text-slate-500 mb-6">Payout capital to investor. Must not exceed available capital.</p>

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payout From Account
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Withdrawal Amount (৳ BDT)
                </label>
                <Input type="number" step="0.01" placeholder="0.00" value={trxAmount} onChange={(e) => setTrxAmount(e.target.value)} required />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Reason
                </label>
                <Input placeholder="E.g., Quarterly capital reduction" value={trxNotes} onChange={(e) => setTrxNotes(e.target.value)} />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsWithdrawOpen(false)}>Cancel</Button>
                <Button type="submit" variant="destructive" isLoading={isSubmitting}>Confirm Withdrawal</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
