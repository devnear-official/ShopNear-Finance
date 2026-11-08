'use client';

import React, { useState } from 'react';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { BottomNav } from './bottom-nav';
import { QuickAddSheet } from './quick-add-sheet';
import { MobileDrawer } from './mobile-drawer';
import { cn } from '@/lib/utils';

interface AppShellProps {
  user: {
    name: string;
    email: string;
    role: string;
    permissions?: string[];
  };
  children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Desktop Sidebar */}
      <Sidebar
        userRole={user.role}
        userPermissions={user.permissions}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Main Layout Area */}
      <div
        className={cn(
          'flex min-h-screen flex-col transition-all duration-300',
          isCollapsed ? 'lg:pl-[76px]' : 'lg:pl-[260px]'
        )}
      >
        {/* Topbar */}
        <Topbar
          userName={user.name}
          userEmail={user.email}
          userRole={user.role}
          isSidebarCollapsed={isCollapsed}
          onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
        />

        {/* Page Content */}
        <main className="flex-1 px-4 py-6 md:px-6 md:py-8 lg:px-8 max-w-[1440px] w-full mx-auto pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        onOpenMore={() => setIsMobileDrawerOpen(true)}
      />

      {/* Quick Add Bottom Sheet / Modal */}
      <QuickAddSheet
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
      />

      {/* Mobile Slide-Over Drawer */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        userRole={user.role}
      />
    </div>
  );
}
