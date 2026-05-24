'use client';

import { BarChart3, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface MetricsOverviewProps {
  stats: {
    totalSessions: number;
    reviewed: number;
    pending: number;
    blockedEvents: number;
  };
}

export function MetricsOverview({ stats }: MetricsOverviewProps) {
  const metrics = [
    {
      label: 'AI Sessions',
      value: stats.totalSessions,
      icon: BarChart3,
      color: 'bg-blue-50 text-blue-600',
      trend: '+12%',
    },
    {
      label: 'Reviewed',
      value: stats.reviewed,
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-600',
      trend: '+4',
    },
    {
      label: 'Pending Review',
      value: stats.pending,
      icon: Clock,
      color: 'bg-amber-50 text-amber-600',
      trend: 'Review needed',
    },
    {
      label: 'Blocked Events',
      value: stats.blockedEvents,
      icon: AlertTriangle,
      color: 'bg-red-50 text-red-600',
      trend: 'Monitor',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
              <div className="flex items-start justify-between mb-4">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${metric.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-slate-600 text-sm font-medium mb-1">{metric.label}</h3>
              <p className="text-3xl font-bold text-slate-900 mb-2">{metric.value}</p>
              <p className="text-xs text-slate-500">{metric.trend}</p>
            </div>
          );
        })}
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System status */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Row-Level Security</span>
              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Ethical Wall Enforcement</span>
              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Enforced
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Audit Trail</span>
              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Recording
              </span>
            </div>
          </div>
        </div>

        {/* Alert tier indicator */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">Security Alert Level</h3>
          <div className="space-y-3">
            {[
              { level: 'Low', blocked: 0, color: 'text-emerald-600 bg-emerald-50' },
              { level: 'Medium', blocked: 1, color: 'text-amber-600 bg-amber-50' },
              { level: 'High', blocked: 5, color: 'text-red-600 bg-red-50' },
            ].map((alert) => (
              <div key={alert.level} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">
                  {alert.level} ({'>=' + alert.blocked} events)
                </span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${alert.color}`}>
                  {alert.level}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
