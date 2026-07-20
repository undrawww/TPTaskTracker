import React from 'react';

import { OverallProgressChart } from './OverallProgressChart';
import { IndividualProgressChart } from './IndividualProgressChart';
import { TaskStatusChart } from './TaskStatusChart';
import type { AnalyticsData } from '../../hooks/useAnalytics';

interface Props {
  analytics: AnalyticsData;
  showCharts?: boolean;
}

export const AnalyticsDashboard: React.FC<Props> = ({ analytics, showCharts }) => {
  if (!showCharts) return null;

  return (
    <section id="analytics-dashboard" className="space-y-5">
      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
        <OverallProgressChart data={analytics.departmentCompletion} />
        <IndividualProgressChart data={analytics.internProgress} />
        <TaskStatusChart data={analytics.internStatusDistribution as any} />
      </div>
    </section>
  );
};
