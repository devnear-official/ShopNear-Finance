'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoneyText } from '@/components/shared/money-text';
import { StatusBadge } from '@/components/shared/status-badge';
import { ArrowLeft, Wallet, ArrowDownLeft, ArrowUpRight, TrendingUp, Printer } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { formatBDT } from '@/lib/money';

export default function InvestorDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [ledgerData, setLedgerData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    fetch(`/api/v1/investors/${id}/ledger`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLedgerData(data.data);
        }
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-slate-400">Loading investor statement...</div>;
  }

  if (!ledgerData) {
    return <div className="py-12 text-center text-sm text-red-500">Investor profile not found.</div>;
  }

  const { investor, summary, entries } = ledgerData;

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/investors">
            <Button variant="outline" size="sm" className="h-9 w-9 p-0 rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {investor.fullName}
              </h1>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                {investor.investorCode}
              </span>
              <StatusBadge status={investor.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Phone: {investor.phone} {investor.email ? `• ${investor.email}` : ''} • Member since {formatDate(investor.joiningDate)}
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={() => window.print()} className="h-9">
          <Printer className="h-3.5 w-3.5 mr-1.5" /> Print Statement
        </Button>
      </div>

      {/* 4 KPI Summary Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200/60 dark:from-purple-950/30 dark:to-indigo-950/30 dark:border-purple-800/40">
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-xs font-semibold text-purple-900 dark:text-purple-300">
              Current Capital Balance
            </CardTitle>
            <Wallet className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-purple-950 dark:text-purple-100">
              {formatBDT(summary.currentCapital)}
            </div>
            <p className="text-[11px] text-purple-700/70 dark:text-purple-300/70 mt-0.5">
              Net equity in business
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-xs font-semibold text-slate-500">Total Contributions</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-600">
              {formatBDT(summary.totalContributions)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Lifetime capital deposited</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-xs font-semibold text-slate-500">Total Withdrawals</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-orange-600">
              {formatBDT(summary.totalWithdrawals)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Lifetime capital returned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-xs font-semibold text-slate-500">Profit Allocated</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-blue-600">
              {formatBDT(summary.totalProfitAllocated - summary.totalLossAllocated)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Net earnings allocated</p>
          </CardContent>
        </Card>
      </div>

      {/* Ledger Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">Capital Sub-Ledger Statement</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:bg-slate-800/40 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Entry #</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3 text-right">Contribution</th>
                <th className="px-5 py-3 text-right">Withdrawal</th>
                <th className="px-5 py-3 text-right">Profit / Loss</th>
                <th className="px-5 py-3 text-right">Capital Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    No transactions recorded for this investor yet.
                  </td>
                </tr>
              ) : (
                entries.map((entry: any) => (
                  <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-5 py-3 text-slate-500">{formatDate(entry.date)}</td>
                    <td className="px-5 py-3 font-mono font-medium text-slate-900 dark:text-white">
                      {entry.entryNumber}
                    </td>
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-300 font-medium">
                      {entry.description}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-semibold text-emerald-600">
                      {entry.contribution > 0 ? `+${formatBDT(entry.contribution)}` : '—'}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-semibold text-orange-600">
                      {entry.withdrawal > 0 ? `-${formatBDT(entry.withdrawal)}` : '—'}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-semibold text-blue-600">
                      {entry.profitLoss !== 0 ? formatBDT(entry.profitLoss) : '—'}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-purple-900 dark:text-purple-300">
                      {formatBDT(entry.runningCapital)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
