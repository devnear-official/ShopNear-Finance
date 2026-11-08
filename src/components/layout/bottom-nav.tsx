'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ArrowLeftRight, Plus, Landmark, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  onOpenQuickAdd: () => void;
  onOpenMore: () => void;
}

export function BottomNav({ onOpenQuickAdd, onOpenMore }: BottomNavProps) {
  const pathname = usePathname();

  const isHome = pathname === '/dashboard';
  const isTrx = pathname.startsWith('/transactions') || pathname.startsWith('/income') || pathname.startsWith('/expenses');
  const isAccounts = pathname.startsWith('/accounts') || pathname.startsWith('/transfers');

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 flex h-16 items-center justify-around border-t border-slate-200/90 bg-white/95 px-2 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 lg:hidden pb-safe">
      {/* Home */}
      <Link
        href="/dashboard"
        className={cn(
          'flex flex-col items-center justify-center gap-1 w-16 py-1 text-[11px] font-medium transition-colors',
          isHome ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-500 dark:text-slate-400'
        )}
      >
        <LayoutDashboard className="h-5 w-5" />
        <span>Home</span>
      </Link>

      {/* Transactions */}
      <Link
        href="/transactions"
        className={cn(
          'flex flex-col items-center justify-center gap-1 w-16 py-1 text-[11px] font-medium transition-colors',
          isTrx ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-500 dark:text-slate-400'
        )}
      >
        <ArrowLeftRight className="h-5 w-5" />
        <span>Entries</span>
      </Link>

      {/* Center FAB Button */}
      <div className="relative -top-4 flex items-center justify-center">
        <button
          onClick={onOpenQuickAdd}
          className="flex h-13 w-13 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/40 ring-4 ring-white transition-transform active:scale-95 dark:ring-slate-900"
          aria-label="Quick Add Transaction"
        >
          <Plus className="h-6 w-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Accounts */}
      <Link
        href="/accounts"
        className={cn(
          'flex flex-col items-center justify-center gap-1 w-16 py-1 text-[11px] font-medium transition-colors',
          isAccounts ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-500 dark:text-slate-400'
        )}
      >
        <Landmark className="h-5 w-5" />
        <span>Accounts</span>
      </Link>

      {/* More / Menu */}
      <button
        onClick={onOpenMore}
        className="flex flex-col items-center justify-center gap-1 w-16 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <MoreHorizontal className="h-5 w-5" />
        <span>More</span>
      </button>
    </nav>
  );
}
