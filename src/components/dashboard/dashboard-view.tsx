'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { formatBDT } from '@/lib/money';
import { formatDate } from '@/lib/dates';
import Link from 'next/link';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Building2,
  Smartphone,
  Landmark,
  FileCheck2,
  Receipt,
  FileText,
  BadgeAlert,
  Clock,
  Layers,
  ArrowRight,
  PlusCircle,
  BarChart3,
  RefreshCw,
} from 'lucide-react';

export function DashboardView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/v1/dashboard/overview');
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to load dashboard overview');
      }
      setData(json.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-sm text-slate-500 font-medium">Loading live financial overview...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <BadgeAlert className="h-10 w-10 text-red-500 mb-2" />
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">Unable to load dashboard</h3>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
          <button
            onClick={fetchOverview}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  // --- INVESTOR DASHBOARD VIEW ---
  if (data.isInvestor) {
    const inv = data.data;
    if (!inv) {
      return (
        <Card>
          <CardContent className="p-8 text-center text-slate-500">
            No investor profile linked to this user account.
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {/* Investor Profile Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 p-6 text-white shadow-xl shadow-emerald-950/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-400/20">
                  Investor Portal
                </span>
                <span className="text-xs text-slate-300">Code: {inv.investor.code}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-2">{inv.investor.name}</h1>
              <p className="text-sm text-emerald-100/80 mt-1">
                Your capital holdings and profit share in ShopNear Finance.
              </p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-md border border-white/15 text-center">
              <span className="text-xs text-emerald-200 block uppercase tracking-wider font-semibold">
                Equity Share
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-white">
                {inv.investor.sharePercentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Investor Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-emerald-200 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/10 dark:to-slate-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Current Capital Balance
              </CardTitle>
              <Wallet className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                {formatBDT(inv.metrics.currentCapitalPaisa)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Live ledger-derived equity</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Total Contributed
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatBDT(inv.metrics.totalContributedPaisa)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Lifetime capital injections</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Total Withdrawn
              </CardTitle>
              <TrendingDown className="h-5 w-5 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatBDT(inv.metrics.totalWithdrawnPaisa)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Approved capital drawings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Profit Allocated
              </CardTitle>
              <Receipt className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                {formatBDT(inv.metrics.totalProfitAllocatedPaisa)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Distributed business returns</p>
            </CardContent>
          </Card>
        </div>

        {/* Investor History Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Capital Activity</CardTitle>
            <CardDescription>Your verified financial contributions and withdrawals</CardDescription>
          </CardHeader>
          <CardContent>
            {inv.recentHistory.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">No activity recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 text-right">Amount (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {inv.recentHistory.map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {formatDate(item.date)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                              item.type === 'investment'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : item.type === 'withdrawal'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            }`}
                          >
                            {item.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                          {item.description}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-semibold ${
                            item.type === 'investment' || item.type === 'profit_allocation'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {item.type === 'withdrawal' ? '-' : '+'}
                          {formatBDT(item.amountPaisa)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- GENERAL MANAGEMENT DASHBOARD VIEW ---
  const ov = data.data;
  const liq = ov.liquidity;
  const met = ov.metrics;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 text-white shadow-xl shadow-slate-950/20 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-400/20">
              Double-Entry Ledger Active
            </span>
            <span className="text-xs text-slate-400">Currency: BDT (৳)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-2">Executive Financial Overview</h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Real-time business liquidity, profitability, receivables, and payables computed strictly with integer paisa.
          </p>
        </div>

        {/* Quick Actions Shortcuts */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Link
            href="/income"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md hover:bg-emerald-500 transition-colors"
          >
            <ArrowUpRight className="h-4 w-4" /> New Income
          </Link>
          <Link
            href="/expenses"
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 border border-slate-700 hover:bg-slate-700 transition-colors"
          >
            <ArrowDownLeft className="h-4 w-4" /> New Expense
          </Link>
          <Link
            href="/reports"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur border border-white/15 hover:bg-white/20 transition-colors"
          >
            <BarChart3 className="h-4 w-4" /> Reports
          </Link>
        </div>
      </div>

      {/* Pending Approvals Notice if any */}
      {met.pendingApprovalsCount > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <span className="font-semibold text-sm">
                {met.pendingApprovalsCount} transaction{met.pendingApprovalsCount > 1 ? 's' : ''} awaiting approval
              </span>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Maker-checker policy requires authorized approval before ledger posting.
              </p>
            </div>
          </div>
          <Link
            href="/approvals"
            className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 transition-colors"
          >
            Review Now <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Row 1: Core Liquidity & Profitability Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Available Liquidity */}
        <Card className="border-emerald-200 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/60 to-white dark:from-emerald-950/20 dark:to-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total Liquidity
            </CardTitle>
            <Wallet className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {formatBDT(liq.totalPaisa)}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-md bg-white/80 dark:bg-slate-800 px-2 py-1 border text-slate-700 dark:text-slate-300">
                <Building2 className="h-3 w-3 text-blue-600" /> Bank: {formatBDT(liq.bankPaisa)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-white/80 dark:bg-slate-800 px-2 py-1 border text-slate-700 dark:text-slate-300">
                <Landmark className="h-3 w-3 text-emerald-600" /> Cash: {formatBDT(liq.cashPaisa)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-white/80 dark:bg-slate-800 px-2 py-1 border text-slate-700 dark:text-slate-300">
                <Smartphone className="h-3 w-3 text-pink-600" /> MFS: {formatBDT(liq.mobileBankingPaisa)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Current Month Income */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Income (This Month)
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {formatBDT(met.incomeCurrentMonthPaisa)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Recognized operating & other revenue</p>
          </CardContent>
        </Card>

        {/* Current Month Expenses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Expenses (This Month)
            </CardTitle>
            <TrendingDown className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700 dark:text-red-400">
              {formatBDT(met.expenseCurrentMonthPaisa)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Operating & administrative costs</p>
          </CardContent>
        </Card>

        {/* Net Profit / Loss */}
        <Card className={met.netProfitCurrentMonthPaisa >= 0 ? 'border-emerald-200' : 'border-red-200'}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Net Profit / (Loss)
            </CardTitle>
            <FileCheck2
              className={`h-5 w-5 ${
                met.netProfitCurrentMonthPaisa >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-extrabold ${
                met.netProfitCurrentMonthPaisa >= 0
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-red-700 dark:text-red-400'
              }`}
            >
              {formatBDT(met.netProfitCurrentMonthPaisa)}
            </div>
            <div className="mt-2">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                  met.netProfitCurrentMonthPaisa >= 0
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                }`}
              >
                {met.netProfitCurrentMonthPaisa >= 0 ? 'Profitable' : 'Net Deficit'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Secondary Balance Sheet Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receivables (AR) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Accounts Receivable
            </CardTitle>
            <FileText className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {formatBDT(met.outstandingReceivablesPaisa)}
            </div>
            <Link
              href="/invoices"
              className="text-xs text-blue-600 hover:underline mt-1 inline-flex items-center gap-1"
            >
              View pending invoices <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Payables (AP) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Accounts Payable
            </CardTitle>
            <Receipt className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {formatBDT(met.outstandingPayablesPaisa)}
            </div>
            <Link
              href="/payables"
              className="text-xs text-amber-600 hover:underline mt-1 inline-flex items-center gap-1"
            >
              View pending bills <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Total Investor Equity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Investor Equity
            </CardTitle>
            <Layers className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {formatBDT(met.totalInvestorEquityPaisa)}
            </div>
            <Link
              href="/investors"
              className="text-xs text-purple-600 hover:underline mt-1 inline-flex items-center gap-1"
            >
              Manage investors <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Outstanding Loans */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Loans Borrowed
            </CardTitle>
            <Landmark className="h-5 w-5 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {formatBDT(met.outstandingLoansTakenPaisa)}
            </div>
            <Link
              href="/loans"
              className="text-xs text-slate-600 hover:underline mt-1 inline-flex items-center gap-1"
            >
              Loan commitments <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Monthly Trends & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Performance Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Monthly Performance (Last 6 Months)</CardTitle>
                <CardDescription>Income vs. Expense comparison in Bangladeshi Taka (৳)</CardDescription>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-medium text-emerald-600">
                  <span className="h-3 w-3 rounded-sm bg-emerald-500 inline-block" /> Income
                </span>
                <span className="flex items-center gap-1.5 font-medium text-red-500">
                  <span className="h-3 w-3 rounded-sm bg-red-400 inline-block" /> Expense
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {ov.monthlyTrends.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-400">No trend history available.</p>
            ) : (
              <div className="space-y-4 pt-2">
                {ov.monthlyTrends.map((t: any, idx: number) => {
                  const maxVal = Math.max(
                    ...ov.monthlyTrends.map((m: any) => Math.max(m.income, m.expense)),
                    100000
                  );
                  const incWidth = Math.min(100, Math.round((t.income / maxVal) * 100));
                  const expWidth = Math.min(100, Math.round((t.expense / maxVal) * 100));

                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span>{t.month}</span>
                        <div className="flex gap-4">
                          <span className="text-emerald-600">{formatBDT(t.income)}</span>
                          <span className="text-red-500">{formatBDT(t.expense)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${incWidth}%` }}
                          />
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-red-400 transition-all duration-500"
                            style={{ width: `${expWidth}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <CardDescription>Latest posted operations</CardDescription>
            </div>
            <Link href="/transactions" className="text-xs text-emerald-600 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {ov.recentTransactions.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No transactions posted yet.</p>
            ) : (
              ov.recentTransactions.map((tx: any) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 p-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        tx.type === 'income'
                          ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                          : tx.type === 'expense'
                          ? 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400'
                          : 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                      }`}
                    >
                      {tx.type === 'income' ? (
                        <ArrowUpRight className="h-5 w-5" />
                      ) : (
                        <ArrowDownLeft className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {tx.categoryName}
                      </div>
                      <div className="text-[11px] text-slate-400">{formatDate(tx.date)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-xs font-bold ${
                        tx.type === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatBDT(tx.amountPaisa)}
                    </div>
                    <div className="text-[10px] text-slate-400 capitalize">{tx.accountName}</div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
