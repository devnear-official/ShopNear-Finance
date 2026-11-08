'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { BookOpen, FolderTree, Search, CheckCircle2, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Account {
  _id: string;
  code: string;
  name: string;
  type: string;
  subType: string;
  normalBalance: string;
  isSystem: boolean;
  isActive: boolean;
  allowPosting: boolean;
}

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetch('/api/v1/chart-of-accounts')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAccounts(data.data);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = accounts.filter((acc) => {
    const matchesSearch =
      acc.name.toLowerCase().includes(search.toLowerCase()) ||
      acc.code.includes(search) ||
      acc.subType.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || acc.type === filterType;
    return matchesSearch && matchesType;
  });

  const typeColor: Record<string, string> = {
    asset: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300',
    liability: 'text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300',
    equity: 'text-purple-700 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-300',
    revenue: 'text-blue-700 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300',
    expense: 'text-orange-700 bg-orange-50 dark:bg-orange-950/60 dark:text-orange-300',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Chart of Accounts
          </h1>
          <p className="text-sm text-slate-500">
            Official ledger structure for double-entry financial classifications.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by code, account name, or subtype..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {['all', 'asset', 'liability', 'equity', 'revenue', 'expense'].map((t) => (
              <Button
                key={t}
                variant={filterType === t ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType(t)}
                className="capitalize text-xs h-10 px-3"
              >
                {t}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Display Accounts */}
      {isLoading ? (
        <Card className="p-8 text-center text-slate-400">
          <p className="text-sm">Loading chart of accounts...</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-slate-400 border-dashed">
          <p className="text-sm">No accounts match the selected filter.</p>
        </Card>
      ) : (
        <>
          {/* Mobile Card List (Visible on phones) */}
          <div className="block md:hidden space-y-2.5">
            {filtered.map((acc) => (
              <div
                key={acc._id}
                className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-900 dark:text-white">
                      {acc.code}
                    </span>
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                      {acc.name}
                    </span>
                  </div>
                  <span className={`inline-flex rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${typeColor[acc.type] || ''}`}>
                    {acc.type}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800/80 pt-2">
                  <span className="capitalize">{acc.subType.replace(/_/g, ' ')}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] uppercase font-semibold text-slate-600 dark:text-slate-300">
                      Normal: {acc.normalBalance}
                    </span>
                    {acc.allowPosting ? (
                      <span className="inline-flex items-center text-[11px] text-emerald-600 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-0.5 text-emerald-500" /> Postable
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[11px] text-slate-400 font-medium">
                        <XCircle className="h-3.5 w-3.5 mr-0.5 text-slate-400" /> Parent
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (Visible on >= md) */}
          <Card className="hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:bg-slate-800/50 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Code</th>
                    <th className="px-5 py-3.5">Account Name</th>
                    <th className="px-5 py-3.5">Type</th>
                    <th className="px-5 py-3.5">Sub-Type</th>
                    <th className="px-5 py-3.5">Normal Balance</th>
                    <th className="px-5 py-3.5 text-center">Posting Allowed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map((acc) => (
                    <tr key={acc._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {acc.code}
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {acc.name}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${typeColor[acc.type] || ''}`}>
                          {acc.type}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-500 capitalize">
                        {acc.subType.replace(/_/g, ' ')}
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-mono text-xs uppercase font-semibold text-slate-700 dark:text-slate-300">
                          {acc.normalBalance}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        {acc.allowPosting ? (
                          <span className="inline-flex items-center text-xs text-emerald-600 font-medium">
                            <CheckCircle2 className="h-4 w-4 mr-1 text-emerald-500" /> Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs text-slate-400 font-medium">
                            <XCircle className="h-4 w-4 mr-1 text-slate-400" /> Parent
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
