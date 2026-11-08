'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatBDT } from '@/lib/money';
import { formatDate } from '@/lib/dates';
import {
  FileText,
  Layers,
  TrendingUp,
  Clock,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Filter,
} from 'lucide-react';

type ReportTab = 'pl' | 'bs' | 'cf' | 'aging';

export function ReportsView() {
  const [activeTab, setActiveTab] = useState<ReportTab>('pl');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Date filters
  const today = new Date().toISOString().split('T')[0];
  const startOfYear = `${new Date().getFullYear()}-01-01`;
  const [startDate, setStartDate] = useState(startOfYear);
  const [endDate, setEndDate] = useState(today);
  const [asOfDate, setAsOfDate] = useState(today);
  const [agingType, setAgingType] = useState<'receivables' | 'payables'>('receivables');

  // Report Data
  const [plData, setPlData] = useState<any>(null);
  const [bsData, setBsData] = useState<any>(null);
  const [cfData, setCfData] = useState<any>(null);
  const [agingData, setAgingData] = useState<any[]>([]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === 'pl') {
        const res = await fetch(`/api/v1/reports/profit-loss?startDate=${startDate}&endDate=${endDate}`);
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || 'Failed to fetch P&L');
        setPlData(json.data);
      } else if (activeTab === 'bs') {
        const res = await fetch(`/api/v1/reports/balance-sheet?asOfDate=${asOfDate}`);
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || 'Failed to fetch Balance Sheet');
        setBsData(json.data);
      } else if (activeTab === 'cf') {
        const res = await fetch(`/api/v1/reports/cash-flow?startDate=${startDate}&endDate=${endDate}`);
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || 'Failed to fetch Cash Flow');
        setCfData(json.data);
      } else if (activeTab === 'aging') {
        const res = await fetch(`/api/v1/reports/aging?type=${agingType}`);
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || 'Failed to fetch Aging Report');
        setAgingData(json.data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab, agingType]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (activeTab === 'pl' && plData) {
      csvContent += 'Profit & Loss Statement\r\n';
      csvContent += `Period,${startDate} to ${endDate}\r\n\r\n`;
      csvContent += 'Category,Account Code,Account Name,Amount (BDT)\r\n';
      plData.revenue.accounts.forEach((a: any) => {
        csvContent += `Revenue,${a.code},"${a.name}",${(a.amountPaisa / 100).toFixed(2)}\r\n`;
      });
      csvContent += `Total Revenue,,,${(plData.revenue.totalPaisa / 100).toFixed(2)}\r\n\r\n`;
      plData.operatingExpenses.accounts.forEach((a: any) => {
        csvContent += `Expense,${a.code},"${a.name}",${(a.amountPaisa / 100).toFixed(2)}\r\n`;
      });
      csvContent += `Total Operating Expenses,,,${(plData.operatingExpenses.totalPaisa / 100).toFixed(2)}\r\n`;
      csvContent += `Net Profit,,,${(plData.netProfitPaisa / 100).toFixed(2)}\r\n`;
    } else if (activeTab === 'bs' && bsData) {
      csvContent += 'Balance Sheet\r\n';
      csvContent += `As of Date,${asOfDate}\r\n\r\n`;
      csvContent += 'Type,Account Code,Account Name,Amount (BDT)\r\n';
      bsData.assets.currentAssets.forEach((a: any) => {
        csvContent += `Current Asset,${a.code},"${a.name}",${(a.amountPaisa / 100).toFixed(2)}\r\n`;
      });
      csvContent += `Total Assets,,,${(bsData.assets.totalPaisa / 100).toFixed(2)}\r\n\r\n`;
      bsData.liabilities.currentLiabilities.forEach((a: any) => {
        csvContent += `Liability,${a.code},"${a.name}",${(a.amountPaisa / 100).toFixed(2)}\r\n`;
      });
      csvContent += `Total Liabilities,,,${(bsData.liabilities.totalPaisa / 100).toFixed(2)}\r\n\r\n`;
      csvContent += `Total Equity,,,${(bsData.equity.totalPaisa / 100).toFixed(2)}\r\n`;
    } else if (activeTab === 'aging') {
      csvContent += `Aging Report (${agingType})\r\n\r\n`;
      csvContent += 'Party Name,Phone,Current (0-30d),31-60d,61-90d,90d+,Total (BDT)\r\n';
      agingData.forEach((r) => {
        csvContent += `"${r.partyName}","${r.partyPhone || ''}",${(r.currentPaisa / 100).toFixed(2)},${(r.days31To60Paisa / 100).toFixed(2)},${(r.days61To90Paisa / 100).toFixed(2)},${(r.over90DaysPaisa / 100).toFixed(2)},${(r.totalPaisa / 100).toFixed(2)}\r\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `shopnear_${activeTab}_report_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Financial Statements & Reports
          </h1>
          <p className="text-sm text-slate-500">
            Standardized double-entry financial reporting computed in Bangladeshi Taka (৳).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Printer className="h-4 w-4" /> Print
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('pl')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === 'pl'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="h-4 w-4" /> Profit & Loss
        </button>
        <button
          onClick={() => setActiveTab('bs')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === 'bs'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="h-4 w-4" /> Balance Sheet
        </button>
        <button
          onClick={() => setActiveTab('cf')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === 'cf'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="h-4 w-4" /> Cash Flow
        </button>
        <button
          onClick={() => setActiveTab('aging')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === 'aging'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="h-4 w-4" /> Aging Report
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        {activeTab === 'pl' || activeTab === 'cf' ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold uppercase text-slate-500">Date Range:</span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
              />
            </div>
            <button
              onClick={fetchReport}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Apply
            </button>
          </div>
        ) : activeTab === 'bs' ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold uppercase text-slate-500">As of Date:</span>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
            />
            <button
              onClick={fetchReport}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Apply
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold uppercase text-slate-500">Report Focus:</span>
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5">
              <button
                onClick={() => setAgingType('receivables')}
                className={`rounded-md px-3 py-1 text-xs font-semibold ${
                  agingType === 'receivables' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                }`}
              >
                Accounts Receivable
              </button>
              <button
                onClick={() => setAgingType('payables')}
                className={`rounded-md px-3 py-1 text-xs font-semibold ${
                  agingType === 'payables' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                }`}
              >
                Accounts Payable
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex h-64 items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            Generating financial report...
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-600 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* --- TAB 1: PROFIT & LOSS --- */}
      {activeTab === 'pl' && plData && !loading && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium text-slate-500 uppercase">
                  Total Operating Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatBDT(plData.revenue.totalPaisa)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium text-slate-500 uppercase">Gross Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatBDT(plData.grossProfitPaisa)}
                </div>
                <p className="text-xs text-slate-500 mt-1">Margin: {plData.grossMarginPercentage}%</p>
              </CardContent>
            </Card>

            <Card className={plData.netProfitPaisa >= 0 ? 'border-emerald-200' : 'border-red-200'}>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium text-slate-500 uppercase">
                  Net Profit / (Loss)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-extrabold ${
                    plData.netProfitPaisa >= 0 ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {formatBDT(plData.netProfitPaisa)}
                </div>
                <p className="text-xs text-slate-500 mt-1">Net Margin: {plData.netMarginPercentage}%</p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Statement Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statement of Profit & Loss</CardTitle>
              <CardDescription>
                For the period {formatDate(startDate)} to {formatDate(endDate)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {/* 1. Revenue */}
                <div className="py-3">
                  <div className="font-bold text-slate-900 dark:text-white mb-2">1. Operating Revenue</div>
                  {plData.revenue.accounts.map((acc: any) => (
                    <div key={acc.code} className="flex justify-between py-1 px-4 text-slate-600 dark:text-slate-300">
                      <span>
                        {acc.code} - {acc.name}
                      </span>
                      <span className="font-medium">{formatBDT(acc.amountPaisa)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 px-4 font-bold text-slate-900 dark:text-white border-t border-dashed">
                    <span>Total Revenue</span>
                    <span>{formatBDT(plData.revenue.totalPaisa)}</span>
                  </div>
                </div>

                {/* 2. COGS */}
                <div className="py-3">
                  <div className="font-bold text-slate-900 dark:text-white mb-2">2. Cost of Goods Sold (COGS)</div>
                  {plData.cogs.accounts.length === 0 ? (
                    <div className="px-4 py-1 text-slate-400 text-xs">No direct COGS recorded.</div>
                  ) : (
                    plData.cogs.accounts.map((acc: any) => (
                      <div key={acc.code} className="flex justify-between py-1 px-4 text-slate-600 dark:text-slate-300">
                        <span>
                          {acc.code} - {acc.name}
                        </span>
                        <span className="font-medium">{formatBDT(acc.amountPaisa)}</span>
                      </div>
                    ))
                  )}
                  <div className="flex justify-between pt-2 px-4 font-bold text-slate-900 dark:text-white border-t border-dashed">
                    <span>Total COGS</span>
                    <span>{formatBDT(plData.cogs.totalPaisa)}</span>
                  </div>
                </div>

                {/* Gross Profit Row */}
                <div className="flex justify-between py-3 px-4 font-bold bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white">
                  <span>Gross Profit</span>
                  <span>{formatBDT(plData.grossProfitPaisa)}</span>
                </div>

                {/* 3. Operating Expenses */}
                <div className="py-3">
                  <div className="font-bold text-slate-900 dark:text-white mb-2">3. Operating Expenses</div>
                  {plData.operatingExpenses.accounts.map((acc: any) => (
                    <div key={acc.code} className="flex justify-between py-1 px-4 text-slate-600 dark:text-slate-300">
                      <span>
                        {acc.code} - {acc.name}
                      </span>
                      <span className="font-medium">{formatBDT(acc.amountPaisa)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 px-4 font-bold text-slate-900 dark:text-white border-t border-dashed">
                    <span>Total Operating Expenses</span>
                    <span>{formatBDT(plData.operatingExpenses.totalPaisa)}</span>
                  </div>
                </div>

                {/* Operating Profit */}
                <div className="flex justify-between py-3 px-4 font-bold bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white">
                  <span>Operating Profit</span>
                  <span>{formatBDT(plData.operatingProfitPaisa)}</span>
                </div>

                {/* Net Profit Row */}
                <div
                  className={`flex justify-between py-4 px-4 font-extrabold text-base rounded-b-xl ${
                    plData.netProfitPaisa >= 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300'
                      : 'bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300'
                  }`}
                >
                  <span>Net Profit / (Loss)</span>
                  <span>{formatBDT(plData.netProfitPaisa)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* --- TAB 2: BALANCE SHEET --- */}
      {activeTab === 'bs' && bsData && !loading && (
        <div className="space-y-6">
          {/* Balance Verification Banner */}
          <div
            className={`flex items-center justify-between rounded-xl p-4 border ${
              bsData.summary.isBalanced
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-300'
                : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-800 dark:text-red-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {bsData.summary.isBalanced ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-red-600 shrink-0" />
              )}
              <div>
                <span className="font-bold text-sm">
                  {bsData.summary.isBalanced
                    ? 'Balance Sheet is in Strict Equilibrium'
                    : 'Balance Discrepancy Detected'}
                </span>
                <p className="text-xs opacity-90">
                  {bsData.summary.isBalanced
                    ? 'Assets strictly equal Liabilities + Equity (Double-Entry verified).'
                    : `Difference: ${formatBDT(bsData.summary.differencePaisa)}`}
                </p>
              </div>
            </div>
            <div className="font-mono text-sm font-bold">
              Assets: {formatBDT(bsData.summary.totalAssetsPaisa)} | Liab + Eq:{' '}
              {formatBDT(bsData.summary.totalLiabilitiesAndEquityPaisa)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ASSETS COLUMN */}
            <Card>
              <CardHeader className="bg-slate-50 dark:bg-slate-800/50 pb-3 border-b">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                  ASSETS
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-sm">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mb-2">Current Assets</div>
                  {bsData.assets.currentAssets.map((acc: any) => (
                    <div key={acc.code} className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                      <span>
                        {acc.code} - {acc.name}
                      </span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {formatBDT(acc.amountPaisa)}
                      </span>
                    </div>
                  ))}
                </div>

                {bsData.assets.nonCurrentAssets.length > 0 && (
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 mb-2">Non-Current Assets</div>
                    {bsData.assets.nonCurrentAssets.map((acc: any) => (
                      <div key={acc.code} className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                        <span>
                          {acc.code} - {acc.name}
                        </span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {formatBDT(acc.amountPaisa)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between pt-3 font-extrabold text-base border-t text-emerald-700 dark:text-emerald-400">
                  <span>TOTAL ASSETS</span>
                  <span>{formatBDT(bsData.assets.totalPaisa)}</span>
                </div>
              </CardContent>
            </Card>

            {/* LIABILITIES & EQUITY COLUMN */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="bg-slate-50 dark:bg-slate-800/50 pb-3 border-b">
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                    LIABILITIES
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3 text-sm">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 mb-2">Current Liabilities</div>
                    {bsData.liabilities.currentLiabilities.map((acc: any) => (
                      <div key={acc.code} className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                        <span>
                          {acc.code} - {acc.name}
                        </span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {formatBDT(acc.amountPaisa)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {bsData.liabilities.longTermLiabilities.length > 0 && (
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 mb-2">
                        Long-Term Liabilities
                      </div>
                      {bsData.liabilities.longTermLiabilities.map((acc: any) => (
                        <div key={acc.code} className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                          <span>
                            {acc.code} - {acc.name}
                          </span>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {formatBDT(acc.amountPaisa)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between pt-2 font-bold border-t text-slate-900 dark:text-white">
                    <span>Total Liabilities</span>
                    <span>{formatBDT(bsData.liabilities.totalPaisa)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="bg-slate-50 dark:bg-slate-800/50 pb-3 border-b">
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                    EQUITY
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3 text-sm">
                  {bsData.equity.capitalAccounts.map((acc: any) => (
                    <div key={acc.code} className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                      <span>
                        {acc.code} - {acc.name}
                      </span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {formatBDT(acc.amountPaisa)}
                      </span>
                    </div>
                  ))}

                  <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                    <span>Retained Earnings / Current Period Net</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {formatBDT(bsData.equity.retainedEarningsPaisa)}
                    </span>
                  </div>

                  <div className="flex justify-between pt-2 font-bold border-t text-slate-900 dark:text-white">
                    <span>Total Equity</span>
                    <span>{formatBDT(bsData.equity.totalPaisa)}</span>
                  </div>

                  <div className="flex justify-between pt-3 font-extrabold text-base border-t text-slate-900 dark:text-white">
                    <span>TOTAL LIABILITIES & EQUITY</span>
                    <span>{formatBDT(bsData.summary.totalLiabilitiesAndEquityPaisa)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: CASH FLOW STATEMENT --- */}
      {activeTab === 'cf' && cfData && !loading && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Statement of Cash Flows</CardTitle>
            <CardDescription>
              Cash movements from {formatDate(startDate)} to {formatDate(endDate)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-sm">
            {/* Opening Cash */}
            <div className="flex justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800 font-bold">
              <span>Opening Cash & Cash Equivalents</span>
              <span>{formatBDT(cfData.openingCashPaisa)}</span>
            </div>

            {/* Operating */}
            <div>
              <div className="font-bold text-slate-900 dark:text-white mb-2">1. Operating Cash Flows</div>
              {cfData.operatingActivities.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between py-1 px-4 text-slate-600 dark:text-slate-400">
                  <span>{item.description}</span>
                  <span className={item.amountPaisa >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                    {formatBDT(item.amountPaisa)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between pt-2 px-4 font-bold border-t">
                <span>Net Cash from Operating Activities</span>
                <span>{formatBDT(cfData.operatingActivities.netPaisa)}</span>
              </div>
            </div>

            {/* Investing */}
            <div>
              <div className="font-bold text-slate-900 dark:text-white mb-2">2. Investing Cash Flows</div>
              {cfData.investingActivities.items.length === 0 ? (
                <div className="px-4 py-1 text-slate-400 text-xs">No capital expenditures recorded.</div>
              ) : (
                cfData.investingActivities.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between py-1 px-4 text-slate-600 dark:text-slate-400">
                    <span>{item.description}</span>
                    <span className="text-red-500">{formatBDT(item.amountPaisa)}</span>
                  </div>
                ))
              )}
              <div className="flex justify-between pt-2 px-4 font-bold border-t">
                <span>Net Cash from Investing Activities</span>
                <span>{formatBDT(cfData.investingActivities.netPaisa)}</span>
              </div>
            </div>

            {/* Financing */}
            <div>
              <div className="font-bold text-slate-900 dark:text-white mb-2">3. Financing Cash Flows</div>
              {cfData.financingActivities.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between py-1 px-4 text-slate-600 dark:text-slate-400">
                  <span>{item.description}</span>
                  <span className={item.amountPaisa >= 0 ? 'text-emerald-600' : 'text-amber-600'}>
                    {formatBDT(item.amountPaisa)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between pt-2 px-4 font-bold border-t">
                <span>Net Cash from Financing Activities</span>
                <span>{formatBDT(cfData.financingActivities.netPaisa)}</span>
              </div>
            </div>

            {/* Closing Cash */}
            <div className="flex justify-between p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-extrabold text-base">
              <span>Closing Cash & Cash Equivalents</span>
              <span>{formatBDT(cfData.closingCashPaisa)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* --- TAB 4: AGING REPORT --- */}
      {activeTab === 'aging' && !loading && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {agingType === 'receivables' ? 'Customer Accounts Receivable' : 'Supplier Accounts Payable'} Aging
            </CardTitle>
            <CardDescription>
              Outstanding balance distribution categorized into 30-day delinquency buckets
            </CardDescription>
          </CardHeader>
          <CardContent>
            {agingData.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                No outstanding balances for {agingType}.
              </p>
            ) : (
              <>
                {/* Mobile Aging Cards (Visible on phones) */}
                <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {agingData.map((row) => (
                    <div key={row.partyId} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                            {row.partyName}
                          </span>
                          {row.partyPhone && (
                            <span className="block text-[11px] text-slate-400">📞 {row.partyPhone}</span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase text-slate-400 block">Total Due</span>
                          <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                            {formatBDT(row.totalPaisa)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-1.5 rounded-xl bg-slate-50 p-2 dark:bg-slate-800/50 text-center text-[10px]">
                        <div>
                          <span className="text-slate-400 block">0-30d</span>
                          <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                            {row.currentPaisa > 0 ? formatBDT(row.currentPaisa) : '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">31-60d</span>
                          <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                            {row.days31To60Paisa > 0 ? formatBDT(row.days31To60Paisa) : '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">61-90d</span>
                          <span className="font-mono font-medium text-amber-600">
                            {row.days61To90Paisa > 0 ? formatBDT(row.days61To90Paisa) : '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">90d+</span>
                          <span className="font-mono font-bold text-red-600">
                            {row.over90DaysPaisa > 0 ? formatBDT(row.over90DaysPaisa) : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Aging Table (Visible on >= md) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800">
                      <tr>
                        <th className="px-4 py-3">Party Name</th>
                        <th className="px-4 py-3 text-right">0-30 Days</th>
                        <th className="px-4 py-3 text-right">31-60 Days</th>
                        <th className="px-4 py-3 text-right">61-90 Days</th>
                        <th className="px-4 py-3 text-right">90+ Days</th>
                        <th className="px-4 py-3 text-right">Total Outstanding</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {agingData.map((row) => (
                        <tr key={row.partyId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                          <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                            {row.partyName}
                            {row.partyPhone && (
                              <span className="block text-xs font-normal text-slate-400">
                                {row.partyPhone}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                            {formatBDT(row.currentPaisa)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                            {formatBDT(row.days31To60Paisa)}
                          </td>
                          <td className="px-4 py-3 text-right text-amber-600">
                            {formatBDT(row.days61To90Paisa)}
                          </td>
                          <td className="px-4 py-3 text-right text-red-600 font-medium">
                            {formatBDT(row.over90DaysPaisa)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                            {formatBDT(row.totalPaisa)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
