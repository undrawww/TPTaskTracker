/* ──────────────────────────────────────────────
   Domain Types for TeamPadua Internship Tracker
   ────────────────────────────────────────────── */

export const DEPARTMENTS = [
  'Advisor Support Associate',
  'Business Support Associate',
  'Client Relations Associate',
  'Design Content Associate',
] as const;

export type Department = (typeof DEPARTMENTS)[number];

export const TASK_STATUSES = [
  'Pending',
  'In Progress',
  'Acknowledge',
  'On Hold',
  'Done',
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface Intern {
  id: string;
  full_name: string;
  department: Department;
  email: string;
  avatar_index?: number;
}

export interface DailyTask {
  id: string;
  intern_id: string;
  task_name: string;
  status: TaskStatus;
  task_date: string; // ISO date string YYYY-MM-DD
  is_verified?: boolean;
}

export interface WeeklyTask {
  id: string;
  intern_id: string;
  task_name: string;
  status: TaskStatus;
  week_number: number;
  is_verified?: boolean;
}

/** Enriched task with intern info for display purposes */
export interface TaskWithIntern extends DailyTask {
  intern?: Intern;
}

export interface WeeklyTaskWithIntern extends WeeklyTask {
  intern?: Intern;
}

/** Status color mapping utility */
export const STATUS_COLORS: Record<TaskStatus, { bg: string; text: string; dot: string }> = {
  Done:          { bg: 'bg-status-done-bg',     text: 'text-status-done',     dot: 'bg-status-done' },
  Pending:       { bg: 'bg-status-pending-bg',  text: 'text-status-pending',  dot: 'bg-status-pending' },
  'In Progress': { bg: 'bg-status-progress-bg', text: 'text-status-progress', dot: 'bg-status-progress' },
  'On Hold':     { bg: 'bg-status-hold-bg',     text: 'text-status-hold',     dot: 'bg-status-hold' },
  Acknowledge:   { bg: 'bg-status-ack-bg',      text: 'text-status-ack',      dot: 'bg-status-ack' },
};

/** Chart color constants matching the palette */
export const CHART_COLORS = {
  teal: '#003946',
  tealLight: '#0a5060',
  tealLighter: '#1a6a7a',
  gold: '#ebbc0f',
  goldLight: '#f5d44a',
  done: '#22c55e',
  progress: '#3b82f6',
  pending: '#ebbc0f',
  hold: '#ef4444',
  ack: '#0a5060',
};
