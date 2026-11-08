import React from 'react';
import { getCurrentUser } from '@/server/auth/guards';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { ShieldCheck, Database, Landmark, BookOpen, CheckCircle2 } from 'lucide-react';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <div className="space-y-6">
      {/* Greeting & Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white shadow-lg shadow-emerald-700/20">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
            Business Financial Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">
            Welcome, {user?.name || 'Administrator'}
          </h1>
          <p className="text-sm text-emerald-100 mt-1 max-w-xl">
            ShopNear Finance is operating in Bangladeshi Taka (৳). Double-entry accounting system with integer paisa precision.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="rounded-xl bg-white/10 px-3.5 py-2 backdrop-blur-md border border-white/20">
            <span className="text-xs text-emerald-200 block">Active Role</span>
            <span className="font-semibold text-white capitalize">{user?.role?.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      {/* KPI / System Status Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Security & RBAC</CardTitle>
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-900 dark:text-white">Active & Guarded</div>
            <p className="text-xs text-slate-500 mt-1">Short-lived JWTs + rotating refresh sessions</p>
            <div className="mt-3">
              <StatusBadge status="active" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Currency Engine</CardTitle>
            <Landmark className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-900 dark:text-white">BDT (৳) Integer Paisa</div>
            <p className="text-xs text-slate-500 mt-1">Strict integer math; zero float drift</p>
            <div className="mt-3">
              <StatusBadge status="posted" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Database Layer</CardTitle>
            <Database className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-900 dark:text-white">MongoDB + Transactions</div>
            <p className="text-xs text-slate-500 mt-1">ACID transactional guarantees for posting</p>
            <div className="mt-3">
              <StatusBadge status="approved" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Next Phase</CardTitle>
            <BookOpen className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-900 dark:text-white">Accounting Engine</div>
            <p className="text-xs text-slate-500 mt-1">Chart of accounts, journals & ledgers</p>
            <div className="mt-3">
              <StatusBadge status="pending" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle>System Architecture Status (Phase 1 Foundation)</CardTitle>
          <CardDescription>
            The core infrastructure has been initialized according to fintech accounting standards.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start gap-3 rounded-xl border border-slate-100 p-3.5 dark:border-slate-800">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Secure Authentication</p>
                <p className="text-xs text-slate-500">
                  Argon2/bcrypt 12 cost password hashing, 15m access token, 7d rotating refresh token in httpOnly SameSite=Lax cookies.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-slate-100 p-3.5 dark:border-slate-800">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Role-Based Access Control</p>
                <p className="text-xs text-slate-500">
                  Owner, Super Admin, Admin, Accountant, Manager, and isolated Investor roles with granular permissions.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-slate-100 p-3.5 dark:border-slate-800">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Immutable Audit Logging</p>
                <p className="text-xs text-slate-500">
                  Pre-hooks block update/delete on audit records; full capture of actor, IP, UA, before/after state.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-slate-100 p-3.5 dark:border-slate-800">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Mobile-First App Shell</p>
                <p className="text-xs text-slate-500">
                  Collapsible desktop sidebar + sticky topbar + mobile bottom navigation bar with center quick-add FAB.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
