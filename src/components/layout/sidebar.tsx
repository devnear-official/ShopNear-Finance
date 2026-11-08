'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
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
  ChevronLeft,
  ChevronRight,
  Wallet,
} from 'lucide-react';
import { can, PERMISSIONS } from '@/server/auth/permissions';

interface SidebarProps {
  userRole?: string;
  userPermissions?: string[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  permission?: string;
  roles?: string[];
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

export function Sidebar({ userRole = 'owner', userPermissions = [], isCollapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();

  const userContext = {
    id: '',
    role: userRole,
    permissions: userPermissions,
  };

  const navGroups: NavGroup[] = [
    {
      group: 'Overview',
      items: [
        { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        {
          title: 'Investors',
          href: '/investors',
          icon: Users,
          permission: PERMISSIONS.INVESTORS_VIEW_ALL,
          roles: ['owner', 'super_admin', 'admin', 'accountant'],
        },
      ],
    },
    {
      group: 'Financial Operations',
      items: [
        { title: 'Income', href: '/income', icon: ArrowDownLeft, permission: PERMISSIONS.TRANSACTIONS_VIEW },
        { title: 'Expenses', href: '/expenses', icon: ArrowUpRight, permission: PERMISSIONS.TRANSACTIONS_VIEW },
        { title: 'Transactions', href: '/transactions', icon: ArrowLeftRight, permission: PERMISSIONS.TRANSACTIONS_VIEW },
        { title: 'Accounts & Wallets', href: '/accounts', icon: Landmark, permission: PERMISSIONS.ACCOUNTS_VIEW },
        { title: 'Transfers', href: '/transfers', icon: ArrowLeftRight, permission: PERMISSIONS.ACCOUNTS_TRANSFER },
      ],
    },
    {
      group: 'Business Finance',
      items: [
        { title: 'Loans', href: '/loans', icon: HandCoins, permission: PERMISSIONS.LOANS_VIEW },
        { title: 'Invoices & Sales', href: '/invoices', icon: Receipt, permission: PERMISSIONS.INVOICES_VIEW },
        { title: 'Bills & Payables', href: '/payables', icon: FileSpreadsheet, permission: PERMISSIONS.BILLS_VIEW },
      ],
    },
    {
      group: 'Accounting & Books',
      items: [
        { title: 'Chart of Accounts', href: '/accounting/chart-of-accounts', icon: BookOpen, permission: PERMISSIONS.COA_VIEW },
        { title: 'Journal Entries', href: '/accounting/journal-entries', icon: FileSpreadsheet, permission: PERMISSIONS.JOURNAL_VIEW },
        { title: 'General Ledger', href: '/accounting/general-ledger', icon: BookOpen, permission: PERMISSIONS.JOURNAL_VIEW },
        { title: 'Financial Periods', href: '/accounting/periods', icon: ShieldCheck, permission: PERMISSIONS.PERIODS_VIEW },
      ],
    },
    {
      group: 'Reports & Audits',
      items: [
        { title: 'Financial Reports', href: '/reports', icon: BarChart3, permission: PERMISSIONS.REPORTS_VIEW },
        { title: 'Approvals Inbox', href: '/approvals', icon: UserCheck, permission: PERMISSIONS.TRANSACTIONS_APPROVE },
        { title: 'Audit Trail', href: '/audit-logs', icon: ShieldCheck, permission: PERMISSIONS.AUDIT_VIEW },
      ],
    },
    {
      group: 'Settings',
      items: [
        { title: 'System Settings', href: '/settings', icon: Settings, permission: PERMISSIONS.SETTINGS_VIEW },
      ],
    },
  ];

  // Investor role specific view
  if (userRole === 'investor') {
    return (
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden lg:flex flex-col border-r border-slate-200/90 bg-white transition-all duration-300 dark:border-slate-800 dark:bg-slate-900',
          isCollapsed ? 'w-[76px]' : 'w-[260px]'
        )}
      >
        <SidebarHeader isCollapsed={isCollapsed} onToggleCollapse={onToggleCollapse} />
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              pathname === '/dashboard'
                ? 'bg-emerald-50 text-emerald-700 font-semibold dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
            )}
          >
            <LayoutDashboard className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>My Portfolio</span>}
          </Link>
          <Link
            href="/investors/me"
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              pathname.startsWith('/investors')
                ? 'bg-emerald-50 text-emerald-700 font-semibold dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
            )}
          >
            <Wallet className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>Capital & Ledger</span>}
          </Link>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 hidden lg:flex flex-col border-r border-slate-200/90 bg-white transition-all duration-300 dark:border-slate-800 dark:bg-slate-900',
        isCollapsed ? 'w-[76px]' : 'w-[260px]'
      )}
    >
      <SidebarHeader isCollapsed={isCollapsed} onToggleCollapse={onToggleCollapse} />

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5 scrollbar-thin">
        {navGroups.map((group, groupIdx) => {
          const visibleItems = group.items.filter((item) => {
            if (item.roles && !item.roles.includes(userRole)) return false;
            if (item.permission && !can(userContext, item.permission)) return false;
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={groupIdx} className="space-y-1">
              {!isCollapsed && (
                <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {group.group}
                </p>
              )}
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? item.title : undefined}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 font-semibold dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-200'
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md bg-emerald-600 dark:bg-emerald-400" />
                    )}
                    <Icon
                      className={cn(
                        'h-5 w-5 shrink-0 transition-colors',
                        isActive
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-500 group-hover:text-slate-800 dark:text-slate-400 dark:group-hover:text-slate-200'
                      )}
                    />
                    {!isCollapsed && <span className="truncate">{item.title}</span>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function SidebarHeader({
  isCollapsed,
  onToggleCollapse,
}: {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}) {
  return (
    <div className="flex h-16 items-center justify-between border-b border-slate-200/80 px-4 dark:border-slate-800">
      <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-lg shadow-sm shadow-emerald-600/30">
          ৳
        </div>
        {!isCollapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 tracking-tight text-base leading-tight dark:text-white">
              ShopNear
            </span>
            <span className="text-[11px] font-semibold tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
              Finance
            </span>
          </div>
        )}
      </Link>
      <button
        onClick={onToggleCollapse}
        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        aria-label="Toggle sidebar collapse"
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </div>
  );
}
