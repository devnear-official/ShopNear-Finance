import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/server/auth/guards';
import { AppShell } from '@/components/layout/app-shell';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <AppShell
      user={{
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      }}
    >
      {children}
    </AppShell>
  );
}
