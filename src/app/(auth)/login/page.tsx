'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ShieldCheck, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme/theme-toggle';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || 'Login failed. Please check your credentials.');
        setIsLoading(false);
        return;
      }

      router.push(redirectUrl);
      router.refresh();
    } catch {
      setErrorMessage('Network error occurred. Please check your connection.');
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-8">
      {/* Mobile Header Logo */}
      <div className="flex flex-col items-center text-center lg:hidden">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white font-extrabold text-2xl shadow-lg shadow-emerald-600/30 mb-3">
          ৳
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">ShopNear Finance</h2>
        <p className="text-xs text-slate-500 mt-0.5">Business Financial Management</p>
      </div>

      <div className="text-left">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Welcome back
        </h2>
        <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
          Enter your credentials to access your financial dashboard
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 animate-in fade-in duration-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Email Address
          </label>
          <Input
            type="email"
            placeholder="name@business.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full mt-2"
          isLoading={isLoading}
        >
          Sign In to Account <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </form>

      {/* Demo Credentials Box */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
        <p className="font-semibold text-slate-900 dark:text-slate-200 mb-1">
          Initial Setup Credentials (after running seed):
        </p>
        <div className="space-y-1 text-[11px] font-mono text-slate-500">
          <p>Email: <strong className="text-slate-800 dark:text-slate-300">owner@shopnear.test</strong></p>
          <p>Password: <strong className="text-slate-800 dark:text-slate-300">ShopNear#2026!</strong></p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full bg-slate-50 dark:bg-slate-950">
      {/* Left Brand Panel (Desktop) */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 p-12 text-white lg:flex overflow-hidden">
        {/* Background abstract glowing circles */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-700 font-extrabold text-2xl shadow-xl">
              ৳
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">ShopNear</h1>
              <p className="text-xs uppercase tracking-widest text-emerald-200 font-semibold">
                Financial Management
              </p>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/30 px-3 py-1 text-xs font-semibold backdrop-blur-md text-emerald-100 border border-emerald-400/30">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-200" /> Enterprise-Grade Fintech
            </span>
            <h2 className="text-3xl font-extrabold leading-tight">
              Precision accounting built for Bangladeshi businesses.
            </h2>
            <p className="text-emerald-100 text-sm leading-relaxed">
              Real double-entry ledger, multi-user role permissions, investor capital management, and transactional integrity in BDT (৳).
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 pt-4 border-t border-emerald-500/30">
            <div className="flex items-center gap-3 text-sm text-emerald-50">
              <CheckCircle className="h-4 w-4 text-emerald-300 shrink-0" />
              <span>Strict integer paisa financial engine (zero floating-point drift)</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-emerald-50">
              <CheckCircle className="h-4 w-4 text-emerald-300 shrink-0" />
              <span>ACID multi-document MongoDB transactions for all money events</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-emerald-50">
              <CheckCircle className="h-4 w-4 text-emerald-300 shrink-0" />
              <span>Immutable audit logs & maker-checker approval workflows</span>
            </div>
          </div>
        </div>

        {/* Bottom footer text */}
        <div className="relative z-10 text-xs text-emerald-200/80">
          © {new Date().getFullYear()} ShopNear Finance. All rights reserved.
        </div>
      </div>

      {/* Right Login Form (Mobile & Desktop) */}
      <div className="relative flex w-full flex-col justify-center px-4 py-12 sm:px-6 lg:w-1/2 lg:px-12 xl:px-20">
        <div className="absolute top-6 right-6 z-20">
          <ThemeToggle />
        </div>
        <Suspense fallback={<div className="text-center text-sm text-slate-400">Loading form...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
