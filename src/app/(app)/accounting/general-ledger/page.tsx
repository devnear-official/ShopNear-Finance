'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyText } from '@/components/shared/money-text';
import { BookOpen, Search, ArrowRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { formatBDT } from '@/lib/money';

export default function GeneralLedgerPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch('/api/v1/chart-of-accounts')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const postable = data.data.filter((a: any) => a.allowPosting);
          setAccounts(postable);
          if (postable.length > 0) {
            setSelectedAccountId(postable[0]._id);
          }
        }
      });
  }, []);

  const loadLedger = (accId?: string) => {
    const idToFetch = accId || selectedAccountId;
    if (!idToFetch) return;

    setIsLoading(true);
    let url = `/api/v1/general-ledger?accountId=${idToFetch}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLedgerData(data.data);
        }
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (selectedAccountId) {
      loadLedger(selectedAccountId);
    }
  }, [selectedAccountId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          General Ledger
        </h1>
        <p className="text-sm text-slate-500">
          Account-by-account transaction audit with live running balance tracking.
        </p>
      </div>

      {/* Account & Filter Selector */}
      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Select Ledger Account
            </label>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
            >
              {accounts.map((acc) => (
                <option key={acc._id} value={acc._id}>
                  {acc.code} - {acc.name} ({acc.type.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Start Date
            </label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              End Date
            </label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Ledger Table */}
      {ledgerData && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <span>{ledgerData.account.code} - {ledgerData.account.name}</span>
                <span className="text-xs font-normal text-slate-400 uppercase">
                  (Normal: {ledgerData.account.normalBalance})
                </span>
              </CardTitle>
            </div>
            <div className="flex gap-4 text-xs font-medium">
              <span>Opening: <strong className="font-mono">{formatBDT(ledgerData.openingBalance)}</strong></span>
              <span>Closing: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{formatBDT(ledgerData.closingBalance)}</strong></span>
            </div>
          </CardHeader>

          {ledgerData.entries.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No ledger entries recorded for this account in the selected period.
            </div>
          ) : (
            <>
              {/* Mobile Card List (Visible on phones) */}
              <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {ledgerData.entries.map((item: any) => (
                  <div key={item.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {item.entryNumber}
                      </span>
                      <span className="text-[11px] text-slate-400">{formatDate(item.date)}</span>
                    </div>

                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{item.description}</p>

                    <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2 dark:bg-slate-800/50 text-center text-[11px]">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">Debit</span>
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {item.debit > 0 ? formatBDT(item.debit) : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">Credit</span>
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {item.credit > 0 ? formatBDT(item.credit) : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">Balance</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {formatBDT(item.runningBalance)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View (Visible on >= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:bg-slate-800/40 dark:border-slate-800">
                    <tr>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Entry #</th>
                      <th className="px-5 py-3">Description</th>
                      <th className="px-5 py-3 text-right">Debit</th>
                      <th className="px-5 py-3 text-right">Credit</th>
                      <th className="px-5 py-3 text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {ledgerData.entries.map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-5 py-3 text-slate-500">{formatDate(item.date)}</td>
                        <td className="px-5 py-3 font-mono font-medium text-slate-900 dark:text-white">
                          {item.entryNumber}
                        </td>
                        <td className="px-5 py-3 text-slate-700 dark:text-slate-300 font-medium">
                          {item.description}
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-semibold">
                          {item.debit > 0 ? formatBDT(item.debit) : '—'}
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-semibold">
                          {item.credit > 0 ? formatBDT(item.credit) : '—'}
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatBDT(item.runningBalance)}
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
