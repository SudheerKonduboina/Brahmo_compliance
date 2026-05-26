'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const TABS = [
  { id: 'overview', label: 'Overview', icon: '📊', path: '/dashboard' },
  { id: 'matters', label: 'Matters', icon: '📋', path: '/dashboard/matters' },
  { id: 'sessions', label: 'AI Sessions', icon: '🤖', path: '/dashboard/sessions' },
];

const PARTNER_TABS = [
  { id: 'blocked', label: 'Blocked Access', icon: '🚫', path: '/dashboard/blocked-access' },
  { id: 'reviews', label: 'Review Queue', icon: '✓', path: '/dashboard/review-queue' },
  { id: 'export', label: 'Export', icon: '📥', path: '/dashboard/export' },
  { id: 'audit', label: 'Audit Trail', icon: '🕐', path: '/dashboard/audit-trail' },
];

export function DashboardTabs({ isPartner }: { isPartner: boolean }) {
  const pathname = usePathname();
  const allTabs = [...TABS, ...(isPartner ? PARTNER_TABS : [])];

  const isActive = (tabPath: string) => {
    if (tabPath === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(tabPath);
  };

  return (
    <div className="flex gap-1 mb-8 border-b border-slate-200 overflow-x-auto">
      {allTabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.path}
          className={`px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition ${
            isActive(tab.path)
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="mr-2">{tab.icon}</span>
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
