'use client';

import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if dismissed before in this session
    const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
    if (dismissed) return;

    const handleBeforeInstall = (e: Event) => {
      // Prevent automatic mini-infobar on mobile
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Also check if running in standalone mode (already installed)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowBanner(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('[PWA] User accepted the install prompt');
    }
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl border border-emerald-500/30 bg-slate-900/95 p-4 text-white shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom duration-300 lg:bottom-6 lg:right-6 lg:left-auto">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-lg shadow-sm">
          ৳
        </div>
        <div className="flex-1 pr-2">
          <h4 className="text-sm font-bold leading-tight">Install ShopNear App</h4>
          <p className="mt-0.5 text-xs text-slate-300">
            Add to home screen for lightning-fast full-screen access on mobile.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Install App
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="rounded-lg p-1 text-slate-400 hover:text-white"
          aria-label="Close install prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
