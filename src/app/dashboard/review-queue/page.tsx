'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ReviewQueuePanel } from '@/components/dashboard/ReviewQueuePanel';

export default function ReviewQueuePage() {
  const { user, profile } = useAuth();
  const isPartner = profile?.role === 'partner' || user?.app_metadata?.role === 'partner';

  if (!isPartner) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
        <h2 className="text-lg font-semibold text-red-900 mb-2">🚫 Access Denied</h2>
        <p className="text-sm text-red-800">This section is restricted to partners only.</p>
      </div>
    );
  }

  return <ReviewQueuePanel />;
}
