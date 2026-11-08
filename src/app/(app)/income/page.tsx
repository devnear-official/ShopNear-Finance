'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoneyText } from '@/components/shared/money-text';
import { StatusBadge } from '@/components/shared/status-badge';
import { ArrowDownLeft, Plus } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { formatBDT } from '@/lib/money';
import Link from 'next/link';

export default function IncomePage() {
  const [incomes, setIncomes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/transactions?type=income')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setIncomes(data.data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const totalIncome = incomes.reduce((acc, curr) => acc + (curr.status === 'posted' ? curr.amount : 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Income & Revenue
          </h1>
          <p className="text-sm text-slate-500">
            Cash sales, service fees, commissions, and other earned income.
          </p>
        </div>
        <Link href="/transactions">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Record Income
          </Button>
        </Link>
      </div>

      <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white shadow-lg shadow-emerald-700/15">
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
          Total Recorded Operating Income
        </span>
        <div className="text-3xl font-extrabold tracking-tight mt-1 font-mono">
          {formatBDT(totalIncome)}
        </div>
        <p className="text-xs text-emerald-100 mt-1">
          Sum of all posted revenue transactions across active business categories.
        </p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100 dark:bg-slate-800/40 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Date & ID</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Description</th>
                <th className="px-5 py-3.5">Account</th>
                <th className="px-5 py-3.5 text-right">Amount</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">Loading income records...</td>
                </tr>
              ) : incomes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">No income transactions recorded yet.</td>
                </tr>
              ) : (
                incomes.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-5 py-3 font-mono font-bold text-slate-900 dark:text-white">
                      {item.transactionNumber}
                      <span className="text-slate-400 text-[11px] block font-normal">{formatDate(item.date)}</span>
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-200">
                      {item.categoryId?.name || 'Revenue'}
                    </td>
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-300 font-medium">
                      {item.description}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {item.financialAccountId?.name}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-emerald-600">
                      +{formatBDT(item.amount)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={item.status} />
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
