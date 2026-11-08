'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { formatDate } from '@/lib/utils';
import { Lock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function PeriodsPage() {
  const [periods, setPeriods] = useState<any[]>([]);
  const [fiscalYears, setFiscalYears] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPeriods = () => {
    setIsLoading(true);
    fetch('/api/v1/financial-periods')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPeriods(data.data.periods);
          setFiscalYears(data.data.fiscalYears);
        }
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchPeriods();
  }, []);

  const handleClosePeriod = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to CLOSE the financial period "${name}"? Posting will be locked for this month.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/financial-periods/${id}/close`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchPeriods();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Failed to close period.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Financial Periods & Fiscal Years
        </h1>
        <p className="text-sm text-slate-500">
          Control monthly accounting locks to prevent unauthorized postings to historical periods.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" /> Accounting Period Status
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100 dark:bg-slate-800/40 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Period Name</th>
                <th className="px-5 py-3.5">Date Range</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Closed Info</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">Loading periods...</td>
                </tr>
              ) : periods.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">No periods created yet.</td>
                </tr>
              ) : (
                periods.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-5 py-3 font-semibold text-slate-900 dark:text-white">
                      {p.name}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {formatDate(p.startDate)} - {formatDate(p.endDate)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {p.status === 'closed'
                        ? `Closed by ${p.closedBy?.name || 'Admin'} on ${formatDate(p.closedAt)}`
                        : '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {p.status === 'open' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleClosePeriod(p._id, p.name)}
                        >
                          <Lock className="h-3.5 w-3.5 mr-1" /> Close Period
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
    </div>
  );
}
