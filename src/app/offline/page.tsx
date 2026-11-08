'use client';

import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  const handleRetry = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 shadow-xl mb-6">
        <WifiOff className="h-10 w-10" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">You are currently offline</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
        ShopNear Finance requires an internet connection to securely query and record financial ledger transactions.
      </p>

      <button
        onClick={handleRetry}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-500 transition-colors"
      >
        <RefreshCw className="h-4 w-4" /> Reconnect Now
      </button>

      <p className="mt-8 text-xs text-slate-400">
        ShopNear Finance PWA • Version 1.0.0
      </p>
    </div>
  );
}
