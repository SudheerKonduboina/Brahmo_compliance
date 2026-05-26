'use client';

import { useAuth } from '@/contexts/AuthContext';
import { DashboardNav } from '@/components/dashboard/DashboardNav';
import { DashboardTabs } from '@/components/dashboard/DashboardTabs';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();

  // Show loading fallback instead of blank screen during hydration
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 mb-2 animate-pulse">
            <div className="w-4 h-4 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
          </div>
          <p className="text-sm text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNav profile={profile} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardTabs isPartner={
          profile?.role === 'partner' || user?.app_metadata?.role === 'partner'
        } />
        {children}
      </main>
    </div>
  );
}
