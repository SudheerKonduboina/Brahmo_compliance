'use client';

import { DashboardMetrics } from '@/lib/types';

interface MetricsCardsProps {
  metrics: DashboardMetrics;
  isLoading: boolean;
}

export function MetricsCards({ metrics, isLoading }: MetricsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="p-4 bg-slate-100 rounded-lg animate-pulse h-24"
          />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: 'Total Sessions',
      value: metrics.total_sessions,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: '📋',
    },
    {
      label: 'Reviewed',
      value: `${metrics.reviewed_percentage}%`,
      color: 'bg-green-50 text-green-700 border-green-200',
      icon: '✓',
    },
    {
      label: 'Pending Reviews',
      value: metrics.pending_count,
      color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      icon: '⏳',
    },
    {
      label: 'Blocked Events',
      value: metrics.blocked_events,
      color: 'bg-red-50 text-red-700 border-red-200',
      icon: '🚫',
    },
    {
      label: 'Reviewed Count',
      value: metrics.reviewed_count,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: '👁',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4" role="region" aria-label="System metrics">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`p-4 rounded-lg border-2 ${card.color}`}
          role="article"
          aria-label={`${card.label}: ${card.value}`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium opacity-75">{card.label}</p>
              <p className="text-2xl font-bold mt-1">{card.value}</p>
            </div>
            <span className="text-xl" aria-hidden="true">{card.icon}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
