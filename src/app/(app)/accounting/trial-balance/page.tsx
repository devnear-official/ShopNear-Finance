'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatBDT } from '@/lib/money';
import { formatDate } from '@/lib/utils';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function TrialBalancePage() {
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReport = () => {
    setIsLoading(true);
    fetch(`/api/v1/trial-balance?asOfDate=${asOfDate}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setReport(data.data);
        }
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchReport();
  }, [asOfDate]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Trial Balance
          </h1>
          <p className="text-sm text-slate-500">
            Arithmetic verification of double-entry ledger balance as of a specified date.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="w-auto h-10"
          />
          <Button variant="outline" size="sm" onClick={fetchReport} className="h-10">
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {report && (
        <>
          {/* Balanced Status Banner */}
          <div
            className={`flex items-center justify-between rounded-2xl p-4 border ${
              report.isBalanced
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300'
                : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/60 dark:border-red-800 dark:text-red-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {report.isBalanced ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              )}
              <div>
                <p className="font-bold text-sm">
                  {report.isBalanced ? 'Trial Balance is in Exact Balance' : 'Trial Balance is Out of Balance!'}
                </p>
                <p className="text-xs opacity-90">
                  Total Debits: {formatBDT(report.totalDebitBalance)} | Total Credits: {formatBDT(report.totalCreditBalance)}
                </p>
              </div>
            </div>
            {!report.isBalanced && (
              <span className="font-mono font-bold text-xs bg-red-200/80 px-3 py-1 rounded-full text-red-900">
                Discrepancy: {formatBDT(report.difference)}
              </span>
            )}
          </div>

          {/* Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:bg-slate-800/50 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Code</th>
                    <th className="px-5 py-3.5">Account Name</th>
                    <th className="px-5 py-3.5">Type</th>
                    <th className="px-5 py-3.5 text-right">Debit Balance</th>
                    <th className="px-5 py-3.5 text-right">Credit Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {report.rows.map((row: any) => (
                    <tr key={row.accountId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-5 py-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {row.code}
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                        {row.name}
                      </td>
                      <td className="px-5 py-3 uppercase text-slate-400 font-semibold">
                        {row.type}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-semibold">
                        {row.debitBalance > 0 ? formatBDT(row.debitBalance) : '—'}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-semibold">
                        {row.creditBalance > 0 ? formatBDT(row.creditBalance) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100/80 font-bold border-t-2 border-slate-300 dark:bg-slate-800 dark:border-slate-700 text-sm">
                  <tr>
                    <td colSpan={3} className="px-5 py-4 text-slate-900 dark:text-white uppercase tracking-wider">
                      Total Ledger Balance
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-emerald-700 dark:text-emerald-300">
                      {formatBDT(report.totalDebitBalance)}
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-emerald-700 dark:text-emerald-300">
                      {formatBDT(report.totalCreditBalance)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
