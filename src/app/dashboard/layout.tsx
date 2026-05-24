'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // AuthGate handles all routing - no router calls here
  if (!user) {
    return null;
  }

  return <>{children}</>;
}
