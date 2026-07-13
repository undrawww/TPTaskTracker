import { useMemo } from 'react';
import type { Intern, DailyTask, Department } from '../types';
import { DEPARTMENTS, TASK_STATUSES, isPoolId } from '../types';

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
  'BizDev Leadership Team': 'BDT',
};

export function useAnalytics(interns: Intern[], dailyTasks: DailyTask[]): AnalyticsData {
  return useMemo(() => {
    const validTasks = dailyTasks.filter(t => t.task_name.trim() !== '' && !isPoolId(t.intern_id));
    const isTaskDone = (t: DailyTask) => t.is_verified || t.status === 'Done';
    const todayTotal = validTasks.length;
    const completedTotal = validTasks.filter(isTaskDone).length;

    // Department completion rates (verified or Done tasks count)
    const departmentCompletion = DEPARTMENTS
      .filter((dept: Department) => dept !== 'BizDev Leadership Team' && (dept as string) !== 'BizDev Team')
      .map((dept: Department) => {
      const deptInternIds = interns
        .filter((i) => i.department === dept)
        .map((i) => i.id);
      const deptTasks = validTasks.filter((t) => deptInternIds.includes(t.intern_id));
      const deptDone = deptTasks.filter(isTaskDone).length;
      const total = deptTasks.length;
      return {
        department: DEPT_INITIALS[dept],
        completed: deptDone,
        total,
        rate: total > 0 ? Math.round((deptDone / total) * 100) : 0,
      };
    });

    // Per-intern active task counts
    const internProgress = interns
      .filter((intern) => intern.department !== 'BizDev Leadership Team' && (intern.department as string) !== 'BizDev Team')
      .map((intern) => {
      const internTasks = validTasks.filter((t) => t.intern_id === intern.id);
      const active = internTasks.filter((t) => !isTaskDone(t)).length;
      const done = internTasks.filter(isTaskDone).length;
      return {
        name: intern.username || intern.full_name.split(' ')[0], // custom username or first name for chart brevity
        active,
        done,
      };
    });

    // Status distribution
    const statusDistribution = TASK_STATUSES.map((status) => ({
      status,
      count: validTasks.filter((t) => t.status === status).length,
    }));

    // Group interns by department for ordered display
    const groupedInterns: Intern[] = [];
    DEPARTMENTS.forEach(dept => {
      if (dept === 'BizDev Leadership Team' || (dept as string) === 'BizDev Team') return;
      groupedInterns.push(...interns.filter(i => i.department === dept));
    });

    // Status distribution per intern (for stacked chart)
    const internStatusDistribution = groupedInterns
      .map((intern) => {
      const internTasks = validTasks.filter((t) => t.intern_id === intern.id);
      const counts: { name: string; [key: string]: string | number } = {
        name: intern.username || intern.full_name.split(' ')[0], // custom username or first name for brevity
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
