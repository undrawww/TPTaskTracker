import React from 'react';

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
      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <OverallProgressChart data={analytics.departmentCompletion} />
        <IndividualProgressChart data={analytics.internProgress} />
        <TaskStatusChart data={analytics.internStatusDistribution as any} />
      </div>
    </section>
  );
};
