'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatDate, formatDateTime } from '@/lib/dates';
import {
  ShieldAlert,
  Search,
  Filter,
  Eye,
  X,
  RefreshCw,
  Clock,
  UserCheck,
  Globe,
  FileCode2,
} from 'lucide-react';

export function AuditLogsView() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  // Inspector modal
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '25');
      if (search) params.set('search', search);
      if (entityType) params.set('entityType', entityType);

      const res = await fetch(`/api/v1/audit-logs?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to fetch audit logs');
      }

      setLogs(json.data || []);
      if (json.meta) {
        setTotalPages(json.meta.totalPages || 1);
        setTotalLogs(json.meta.total || 0);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, entityType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              Security Compliance
            </span>
            <span className="text-xs text-slate-400">Total Entries: {totalLogs}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Immutable Audit Trail
          </h1>
          <p className="text-sm text-slate-500">
            Append-only tamper-evident record of all user mutations, approvals, and financial ledger events.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className="h-4 w-4" /> Refresh Logs
        </button>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search action, entity ID, or IP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400 shrink-0" />
              <select
                value={entityType}
                onChange={(e) => {
                  setEntityType(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
              >
                <option value="">All Entities</option>
                <option value="Transaction">Transaction</option>
                <option value="JournalEntry">JournalEntry</option>
                <option value="User">User</option>
                <option value="Investor">Investor</option>
                <option value="Loan">Loan</option>
                <option value="Invoice">Invoice</option>
                <option value="Bill">Bill</option>
                <option value="FinancialAccount">Financial Account</option>
                <option value="BusinessProfile">Business Profile</option>
                <option value="SystemSettings">System Settings</option>
              </select>
            </div>

            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              Filter
            </button>
          </form>
        </CardContent>
      </Card>

      {/* Error display */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-600 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                Querying immutable audit store...
              </div>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">No audit logs matching criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b bg-slate-50 uppercase text-slate-500 dark:bg-slate-800/60">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Actor</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Entity</th>
                    <th className="px-4 py-3">IP Address</th>
                    <th className="px-4 py-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-500">
                        {formatDateTime(log.at)}
                      </td>
                      <td className="px-4 py-3">
                        {log.actor ? (
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {log.actor.name}
                            </span>
                            <span className="block text-[10px] text-slate-400">{log.actor.email}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">System / Anonymous</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {log.entityType}
                        </span>
                        {log.entityId && (
                          <span className="block font-mono text-[10px] text-slate-400 truncate max-w-[120px]">
                            {log.entityId}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500">
                        {log.ip || '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {(log.before || log.after) && (
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            <Eye className="h-3.5 w-3.5 text-emerald-600" /> Diff
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 p-4 text-xs">
              <span className="text-slate-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="rounded-lg border px-3 py-1 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="rounded-lg border px-3 py-1 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Snapshot Diff Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileCode2 className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Audit Snapshot Diff: {selectedLog.action}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
                <div>
                  <strong>Actor:</strong> {selectedLog.actor?.name || 'System'} ({selectedLog.actorRole || 'N/A'})
                </div>
                <div>
                  <strong>Timestamp:</strong> {formatDateTime(selectedLog.at)}
                </div>
                <div>
                  <strong>Entity:</strong> {selectedLog.entityType} ({selectedLog.entityId || 'N/A'})
                </div>
                <div>
                  <strong>IP / UA:</strong> {selectedLog.ip || 'Local'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-bold text-red-600 dark:text-red-400 mb-1">State Before:</h4>
                  <pre className="rounded-xl border border-red-200/60 bg-red-50/50 dark:border-red-950 dark:bg-red-950/20 p-3 font-mono text-[11px] text-slate-800 dark:text-slate-200 overflow-x-auto max-h-60">
                    {selectedLog.before ? JSON.stringify(selectedLog.before, null, 2) : 'null (Created)'}
                  </pre>
                </div>
                <div>
                  <h4 className="font-bold text-emerald-600 dark:text-emerald-400 mb-1">State After:</h4>
                  <pre className="rounded-xl border border-emerald-200/60 bg-emerald-50/50 dark:border-emerald-950 dark:bg-emerald-950/20 p-3 font-mono text-[11px] text-slate-800 dark:text-slate-200 overflow-x-auto max-h-60">
                    {selectedLog.after ? JSON.stringify(selectedLog.after, null, 2) : 'null (Deleted)'}
                  </pre>
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg bg-slate-100 dark:bg-slate-800 px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
