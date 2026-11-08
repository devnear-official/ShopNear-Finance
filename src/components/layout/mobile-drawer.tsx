'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  X,
  LayoutDashboard,
  Users,
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  ArrowLeftRight,
  HandCoins,
  Receipt,
  FileSpreadsheet,
  BookOpen,
  BarChart3,
  ShieldCheck,
  Settings,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
}

export function MobileDrawer({ isOpen, onClose, userRole = 'owner' }: MobileDrawerProps) {
  const pathname = usePathname();

  if (!isOpen) return null;

  const links = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { title: 'Investors', href: '/investors', icon: Users },
    { title: 'Income', href: '/income', icon: ArrowDownLeft },
    { title: 'Expenses', href: '/expenses', icon: ArrowUpRight },
    { title: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
    { title: 'Accounts & Wallets', href: '/accounts', icon: Landmark },
    { title: 'Transfers', href: '/transfers', icon: ArrowLeftRight },
    { title: 'Loans', href: '/loans', icon: HandCoins },
    { title: 'Invoices & Sales', href: '/invoices', icon: Receipt },
    { title: 'Bills & Payables', href: '/payables', icon: FileSpreadsheet },
    { title: 'Chart of Accounts', href: '/accounting/chart-of-accounts', icon: BookOpen },
    { title: 'Journal Entries', href: '/accounting/journal-entries', icon: FileSpreadsheet },
    { title: 'General Ledger', href: '/accounting/general-ledger', icon: BookOpen },
    { title: 'Periods', href: '/accounting/periods', icon: ShieldCheck },
    { title: 'Financial Reports', href: '/reports', icon: BarChart3 },
    { title: 'Approvals Inbox', href: '/approvals', icon: UserCheck },
    { title: 'Audit Trail', href: '/audit-logs', icon: ShieldCheck },
    { title: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="fixed inset-0 z-50 flex lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white pt-5 pb-4 shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between px-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-lg shadow-sm">
              ৳
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm leading-tight dark:text-white">ShopNear</p>
              <p className="text-[11px] font-semibold text-emerald-600 uppercase dark:text-emerald-400">Finance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 font-semibold dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500')} />
                <span>{link.title}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
