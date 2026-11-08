'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyText } from '@/components/shared/money-text';
import { ArrowLeft, Download, RefreshCw } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { formatBDT } from '@/lib/money';

export default function AccountStatementPage() {
  const params = useParams();
  const id = params?.id as string;

  const [statement, setStatement] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchStatement = () => {
    if (!id) return;
    setIsLoading(true);
    let url = `/api/v1/accounts/${id}/ledger`;
    const q: string[] = [];
    if (startDate) q.push(`startDate=${startDate}`);
    if (endDate) q.push(`endDate=${endDate}`);
    if (q.length > 0) url += `?${q.join('&')}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatement(data.data);
        }
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchStatement();
  }, [id]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/accounts">
            <Button variant="outline" size="sm" className="h-9 w-9 p-0 rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {statement?.account?.name || 'Account Statement'}
            </h1>
            <p className="text-xs text-slate-500">
              Transaction history & running balance statement
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-auto h-9 text-xs" />
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-auto h-9 text-xs" />
          <Button variant="outline" size="sm" onClick={fetchStatement} className="h-9">
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Filter
          </Button>
        </div>
      </div>

      {statement && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-xs text-slate-400">Account Type</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 capitalize">
                {statement.account.type.replace('_', ' ')}
                {statement.account.accountNumber ? ` — ${statement.account.accountNumber}` : ''}
              </p>
            </div>
            <div className="flex gap-4 text-xs font-semibold">
              <div>
                <span className="text-slate-400 block">Opening Balance</span>
                <span className="font-mono text-sm">{formatBDT(statement.openingBalance)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Closing Balance</span>
                <span className="font-mono text-sm text-emerald-600 dark:text-emerald-400">
                  {formatBDT(statement.closingBalance)}
                </span>
              </div>
            </div>
          </CardHeader>

          {statement.entries.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No transactions recorded for this account.
            </div>
          ) : (
            <>
              {/* Mobile Card List (Visible on phones) */}
              <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {statement.entries.map((entry: any) => (
                  <div key={entry.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {entry.entryNumber}
                      </span>
                      <span className="text-[11px] text-slate-400">{formatDate(entry.date)}</span>
                    </div>

                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{entry.description}</p>

                    <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2 dark:bg-slate-800/50 text-center text-[11px]">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">Inflow</span>
                        <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          {entry.debit > 0 ? `+${formatBDT(entry.debit)}` : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">Outflow</span>
                        <span className="font-mono font-semibold text-orange-600 dark:text-orange-400">
                          {entry.credit > 0 ? `-${formatBDT(entry.credit)}` : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">Balance</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {formatBDT(entry.runningBalance)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View (Visible on >= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:bg-slate-800/40 dark:border-slate-800">
                    <tr>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Entry #</th>
                      <th className="px-5 py-3">Description</th>
                      <th className="px-5 py-3 text-right">Inflow (Debit)</th>
                      <th className="px-5 py-3 text-right">Outflow (Credit)</th>
                      <th className="px-5 py-3 text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {statement.entries.map((entry: any) => (
                      <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-5 py-3 text-slate-500">{formatDate(entry.date)}</td>
                        <td className="px-5 py-3 font-mono font-medium text-slate-900 dark:text-white">
                          {entry.entryNumber}
                        </td>
                        <td className="px-5 py-3 text-slate-700 dark:text-slate-300 font-medium">
                          {entry.description}
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-semibold text-emerald-600">
                          {entry.debit > 0 ? `+${formatBDT(entry.debit)}` : '—'}
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-semibold text-orange-600">
                          {entry.credit > 0 ? `-${formatBDT(entry.credit)}` : '—'}
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatBDT(entry.runningBalance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
