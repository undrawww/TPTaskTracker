import React from 'react';

/** Pulsing skeleton block */
const Bone: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-teal/8 dark:bg-white/8 ${className}`} />
);

/** Skeleton for the metric cards row */
const MetricCardsSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {[0, 1].map((i) => (
      <div
        key={i}
        className="bg-white dark:bg-[#002b36] rounded-2xl border-l-4 border-cream-dark/20 dark:border-teal-lighter/10 p-5 shadow-sm"
      >
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <Bone className="h-3 w-28" />
            <Bone className="h-8 w-16" />
          </div>
          <Bone className="w-11 h-11 rounded-xl flex-shrink-0" />
        </div>
      </div>
    ))}
  </div>
);

/** Skeleton for the charts row */
const ChartsSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="rounded-2xl p-5 shadow-sm bg-gradient-to-br from-[#003946] to-[#004d5e]"
      >
        <Bone className="h-3 w-32 mb-4 bg-white/8" />
        <div className="space-y-3">
          <Bone className="h-4 w-full bg-white/6" />
          <Bone className="h-4 w-5/6 bg-white/6" />
          <Bone className="h-4 w-4/6 bg-white/6" />
          <Bone className="h-28 w-full bg-white/5 rounded-xl" />
        </div>
      </div>
    ))}
  </div>
);

/** Skeleton for a single department panel */
const DepartmentPanelSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-[#003946] border border-cream-dark/30 dark:border-teal-lighter/15 rounded-2xl shadow-sm">
    {/* Header */}
    <div className="bg-gradient-to-r from-teal to-[#004d5e] rounded-t-2xl px-5 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Bone className="w-9 h-9 rounded-xl bg-white/10" />
        <Bone className="h-5 w-40 bg-white/10" />
      </div>
      <Bone className="w-11 h-11 rounded-full bg-white/8" />
    </div>
    {/* Task rows */}
    <div className="p-5 space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-2.5">
          <div className="flex items-center gap-2.5 px-1">
            <Bone className="w-8 h-8 rounded-full" />
            <Bone className="h-4 w-28" />
          </div>
          <div className="space-y-1.5 pl-1">
            {[0, 1].map((j) => (
              <div
                key={j}
                className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl"
              >
                <Bone className="h-4 flex-1" />
                <Bone className="h-6 w-20 rounded-full" />
                <Bone className="w-[18px] h-[18px] rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

/** Skeleton for the daily tracker section */
const DailyTrackerSkeleton: React.FC = () => (
  <section>
    <div className="flex items-center gap-3 mb-4">
      <Bone className="h-5 w-36" />
      <div className="flex-1 h-px bg-teal/10" />
      <Bone className="h-3 w-24" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {[0, 1, 2, 3].map((i) => (
        <DepartmentPanelSkeleton key={i} />
      ))}
    </div>
  </section>
);

/** Full-page dashboard skeleton */
export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-8">
    <MetricCardsSkeleton />
    <ChartsSkeleton />
    <DailyTrackerSkeleton />
  </div>
);

/** Skeleton for Interns Directory */
export const InternsSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-[#001f26] border border-teal/10 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
    <div className="p-5 border-b border-teal/10 dark:border-white/5 bg-teal/5 dark:bg-white/5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Bone className="h-6 w-48" />
        <Bone className="h-10 w-full sm:w-64 rounded-xl" />
      </div>
    </div>
    <div className="p-0">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4 border-b border-teal/5 dark:border-white/5 last:border-0">
          <Bone className="w-10 h-10 rounded-xl flex-shrink-0" />
          <div className="flex flex-col gap-1.5 flex-1">
            <Bone className="h-4 w-32" />
            <Bone className="h-3 w-48" />
          </div>
          <div className="hidden sm:flex flex-col gap-1.5 flex-1">
            <Bone className="h-3 w-40" />
          </div>
          <div className="hidden md:flex flex-col gap-1.5 flex-1">
            <Bone className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  </div>
);
