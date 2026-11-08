import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusType =
  | 'draft'
  | 'pending'
  | 'pending_approval'
  | 'approved'
  | 'posted'
  | 'rejected'
  | 'cancelled'
  | 'reversed'
  | 'active'
  | 'suspended'
  | 'open'
  | 'closed'
  | 'locked'
  | 'paid'
  | 'partially_paid'
  | 'overdue'
  | 'void';

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const norm = status?.toLowerCase() || 'draft';

  switch (norm) {
    case 'posted':
    case 'active':
    case 'paid':
      return <Badge variant="default" className={cn('bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300', className)}>{formatLabel(norm)}</Badge>;

    case 'pending':
    case 'pending_approval':
      return <Badge variant="warning" className={cn('bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300', className)}>{formatLabel(norm)}</Badge>;

    case 'approved':
      return <Badge variant="info" className={cn('bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300', className)}>{formatLabel(norm)}</Badge>;

    case 'rejected':
    case 'cancelled':
    case 'overdue':
    case 'suspended':
    case 'void':
      return <Badge variant="destructive" className={cn('bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300', className)}>{formatLabel(norm)}</Badge>;

    case 'partially_paid':
      return <Badge variant="warning" className={cn('bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300', className)}>{formatLabel(norm)}</Badge>;

    case 'reversed':
      return <Badge variant="purple" className={cn('bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300', className)}>{formatLabel(norm)}</Badge>;

    case 'closed':
    case 'locked':
      return <Badge variant="secondary" className={cn('bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300', className)}>{formatLabel(norm)}</Badge>;

    case 'open':
      return <Badge variant="default" className={cn('bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300', className)}>{formatLabel(norm)}</Badge>;

    case 'draft':
    default:
      return <Badge variant="secondary" className={cn('bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300', className)}>{formatLabel(norm)}</Badge>;
  }
}

function formatLabel(str: string): string {
  return str
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
