'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { formatBDT, toPaisa } from '@/lib/money';
import {
  Users,
  Truck,
  Plus,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

interface PartiesViewProps {
  type: 'customer' | 'supplier';
}

export function PartiesView({ type }: PartiesViewProps) {
  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    openingBalanceBdt: '0',
  });

  const title = type === 'customer' ? 'Customers (Accounts Receivable)' : 'Suppliers (Accounts Payable)';
  const singular = type === 'customer' ? 'Customer' : 'Supplier';

  const fetchParties = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/parties?type=${type}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      setParties(json.data || []);
    } catch (err: any) {
      toast.error(err.message || `Failed to fetch ${type}s`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParties();
  }, [type]);

  const handleCreateParty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        name: formData.name,
        type,
        phone: formData.phone,
        email: formData.email || undefined,
        address: formData.address || undefined,
        openingBalance: toPaisa(formData.openingBalanceBdt || '0'),
      };

      const res = await fetch('/api/v1/parties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);

      toast.success(`${singular} created successfully`);
      setShowModal(false);
      setFormData({ name: '', phone: '', email: '', address: '', openingBalanceBdt: '0' });
      fetchParties();
    } catch (err: any) {
      toast.error(err.message || `Failed to create ${type}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = parties.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.includes(search) ||
      p.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              Commercial Directory
            </span>
            <span className="text-xs text-slate-400">Total: {parties.length}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            {title}
          </h1>
          <p className="text-sm text-slate-500">
            {type === 'customer'
              ? 'Manage clients, verified contact information, and accounts receivable records.'
              : 'Manage vendors, trade terms, contact profiles, and accounts payable obligations.'}
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 shadow-md transition-colors"
        >
          <Plus className="h-4 w-4" /> Add {singular}
        </button>
      </div>

      {/* Filter / Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${type}s by name, phone, or email...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
            />
          </div>
        </CardContent>
      </Card>

      {/* Parties Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                Loading {type}s directory...
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              No {type}s found. Click &quot;Add {singular}&quot; to register one.
            </div>
          ) : (
            <>
              {/* Mobile Card List (Visible on phones) */}
              <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((party) => (
                  <div key={party._id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {party.name}
                      </span>
                      <StatusBadge status={party.status || 'active'} />
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      {party.phone && <span>📞 {party.phone}</span>}
                      {party.email && <span>✉️ {party.email}</span>}
                    </div>

                    {party.address && (
                      <p className="text-[11px] text-slate-400">{party.address}</p>
                    )}

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
                      <span className="text-slate-400">Opening Balance:</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {formatBDT(party.openingBalance || 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View (Visible on >= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-xs">
                  <thead className="border-b bg-slate-50 uppercase text-slate-500 dark:bg-slate-800">
                    <tr>
                      <th className="px-4 py-3">{singular} Name</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Address</th>
                      <th className="px-4 py-3 text-right">Opening Balance</th>
                      <th className="px-4 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filtered.map((party) => (
                      <tr key={party._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {party.name}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                          {party.phone || '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{party.email || '-'}</td>
                        <td className="px-4 py-3 text-slate-500 max-w-[180px] truncate">
                          {party.address || '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-800 dark:text-slate-200">
                          {formatBDT(party.openingBalance || 0)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <StatusBadge status={party.status || 'active'} />
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

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Register New {singular}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Add contact profile to record invoices, bills, and track commercial balances.
            </p>

            <form onSubmit={handleCreateParty} className="mt-4 space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {singular} Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Apex Trading Ltd."
                  className="w-full rounded-lg border px-3 py-1.5"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Phone Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+880 1..."
                  className="w-full rounded-lg border px-3 py-1.5"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@company.com"
                  className="w-full rounded-lg border px-3 py-1.5"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Physical Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street, City"
                  className="w-full rounded-lg border px-3 py-1.5"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Opening Balance (BDT ৳)
                </label>
                <input
                  type="number"
                  value={formData.openingBalanceBdt}
                  onChange={(e) => setFormData({ ...formData, openingBalanceBdt: e.target.value })}
                  className="w-full rounded-lg border px-3 py-1.5"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border px-4 py-1.5 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 shadow-sm"
                >
                  {submitting ? 'Registering...' : `Save ${singular}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
