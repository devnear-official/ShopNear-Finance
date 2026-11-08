'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { MoneyText } from '@/components/shared/money-text';
import { CheckCircle2, XCircle, ShieldCheck, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { formatBDT } from '@/lib/money';
import { toast } from 'sonner';

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadApprovals = () => {
    setIsLoading(true);
    fetch('/api/v1/approvals?status=pending')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setApprovals(data.data);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  const handleApprove = async (trxId: string, trxNumber: string) => {
    if (!confirm(`Approve and post transaction ${trxNumber}?`)) return;
    try {
      const res = await fetch(`/api/v1/transactions/${trxId}/approve`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        loadApprovals();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Failed to approve transaction.');
    }
  };

  const handleReject = async (trxId: string, trxNumber: string) => {
    const reason = prompt(`Enter reason for rejecting transaction ${trxNumber}:`);
    if (!reason) return;
    try {
      const res = await fetch(`/api/v1/transactions/${trxId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        loadApprovals();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Failed to reject transaction.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Approvals Inbox
          </h1>
          <p className="text-sm text-slate-500">
            Maker-Checker authorization inbox for submitted operational expenses and outlays.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl bg-amber-50 border border-amber-200/80 p-4 text-xs text-amber-800 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-300">
        <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0" />
        <span>
          <strong>Maker-Checker Enforced:</strong> The creator of a financial request cannot approve their own entry. Only authorized Owners, Super Admins, and Admins can sign off.
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" /> Pending Approvals ({approvals.length})
          </CardTitle>
        </CardHeader>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-slate-400">Loading pending requests...</div>
          ) : approvals.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">No requests pending approval. Inbox is clear!</div>
          ) : (
            approvals.map((app) => {
              const trx = app.entity;
              if (!trx) return null;

              return (
                <div key={app._id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {trx.transactionNumber}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded uppercase bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {trx.type}
                      </span>
                      <StatusBadge status="pending" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {trx.description}
                    </p>
                    <p className="text-xs text-slate-400">
                      Requested by <strong>{app.requestedBy?.name || 'User'}</strong> on {formatDate(app.createdAt)} • A/C: {trx.financialAccountId?.name}
                    </p>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="text-left md:text-right">
                      <span className="text-xs text-slate-400 block">Amount</span>
                      <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
                        {formatBDT(trx.amount)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-xs"
                        onClick={() => handleApprove(trx._id, trx.transactionNumber)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleReject(trx._id, trx.transactionNumber)}
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
