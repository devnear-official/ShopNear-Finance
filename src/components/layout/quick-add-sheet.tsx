'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Coins, X } from 'lucide-react';

interface QuickAddSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickAddSheet({ isOpen, onClose }: QuickAddSheetProps) {
  if (!isOpen) return null;

  const actions = [
    {
      title: 'Record Income',
      desc: 'Cash sales, services, commissions',
      href: '/income?action=new',
      icon: ArrowDownLeft,
      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    },
    {
      title: 'Record Expense',
      desc: 'Bills, rent, salaries, utilities',
      href: '/expenses?action=new',
      icon: ArrowUpRight,
      color: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
    },
    {
      title: 'Account Transfer',
      desc: 'Move funds between Bank / Cash / bKash',
      href: '/transfers?action=new',
      icon: ArrowLeftRight,
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    },
    {
      title: 'Record Investment',
      desc: 'Capital contribution from investor',
      href: '/investors?action=invest',
      icon: Coins,
      color: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in slide-in-from-bottom duration-250">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Quick Entry</h3>
            <p className="text-xs text-slate-500">Record a new financial transaction</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2.5 py-4">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <Link
                key={act.title}
                href={act.href}
                onClick={onClose}
                className="flex items-center gap-4 rounded-2xl border border-slate-100 p-3.5 hover:border-emerald-200 hover:bg-emerald-50/40 transition-colors dark:border-slate-800 dark:hover:border-emerald-800/60 dark:hover:bg-slate-800/50"
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${act.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{act.title}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{act.desc}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
