import React from 'react';
import { MetricCard } from './MetricCard';
import { OverallProgressChart } from './OverallProgressChart';
import { IndividualProgressChart } from './IndividualProgressChart';
import { TaskStatusChart } from './TaskStatusChart';
import type { AnalyticsData } from '../../hooks/useAnalytics';

interface Props {
  analytics: AnalyticsData;
}

export const AnalyticsDashboard: React.FC<Props> = ({ analytics }) => {
  return (
    <section id="analytics-dashboard" className="space-y-5">
      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricCard
          title="Today's Total Tasks"
          value={analytics.todayTotal}
          accentColor="teal"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          }
        />
        <MetricCard
          title="Total Completed Tasks"
          value={analytics.completedTotal}
          accentColor="gold"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <OverallProgressChart data={analytics.departmentCompletion} />
        <IndividualProgressChart data={analytics.internProgress} />
        <TaskStatusChart data={analytics.internStatusDistribution as any} />
      </div>
    </section>
  );
};
