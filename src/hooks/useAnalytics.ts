import { useMemo } from 'react';
import type { Intern, DailyTask, Department } from '../types';
import { DEPARTMENTS, TASK_STATUSES } from '../types';

export interface AnalyticsData {
  todayTotal: number;
  completedTotal: number;
  departmentCompletion: { department: string; completed: number; total: number; rate: number }[];
  internProgress: { name: string; active: number; done: number }[];
  statusDistribution: { status: string; count: number }[];
  internStatusDistribution: { name: string; [key: string]: string | number }[];
}

const DEPT_INITIALS: Record<Department, string> = {
  'Advisor Support Associate': 'ASA',
  'Business Support Associate': 'BSA',
  'Client Relations Associate': 'CRA',
  'Design Content Associate': 'DCA',
};

export function useAnalytics(interns: Intern[], dailyTasks: DailyTask[]): AnalyticsData {
  return useMemo(() => {
    const todayTotal = dailyTasks.length;
    const completedTotal = dailyTasks.filter((t) => t.status === 'Done').length;

    // Department completion rates
    const departmentCompletion = DEPARTMENTS.map((dept: Department) => {
      const deptInternIds = interns
        .filter((i) => i.department === dept)
        .map((i) => i.id);
      const deptTasks = dailyTasks.filter((t) => deptInternIds.includes(t.intern_id));
      const deptDone = deptTasks.filter((t) => t.status === 'Done').length;
      const total = deptTasks.length;
      return {
        department: DEPT_INITIALS[dept],
        completed: deptDone,
        total,
        rate: total > 0 ? Math.round((deptDone / total) * 100) : 0,
      };
    });

    // Per-intern active task counts
    const internProgress = interns.map((intern) => {
      const internTasks = dailyTasks.filter((t) => t.intern_id === intern.id);
      const active = internTasks.filter((t) => !t.is_verified).length;
      const done = internTasks.filter((t) => t.is_verified).length;
      return {
        name: intern.full_name.split(' ')[0], // first name for chart brevity
        active,
        done,
      };
    });

    // Status distribution
    const statusDistribution = TASK_STATUSES.map((status) => ({
      status,
      count: dailyTasks.filter((t) => t.status === status).length,
    }));

    // Status distribution per intern (for stacked chart)
    const internStatusDistribution = interns.map((intern) => {
      const internTasks = dailyTasks.filter((t) => t.intern_id === intern.id);
      const counts: { name: string; [key: string]: string | number } = {
        name: intern.full_name.split(' ')[0], // first name for brevity
      };
      TASK_STATUSES.forEach(status => {
        counts[status] = internTasks.filter(t => t.status === status).length;
      });
      return counts;
    });

    return {
      todayTotal,
      completedTotal,
      departmentCompletion,
      internProgress,
      statusDistribution,
      internStatusDistribution,
    };
  }, [interns, dailyTasks]);
}
