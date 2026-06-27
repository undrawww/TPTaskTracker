/* ──────────────────────────────────────────────
   Domain Types for TeamPadua Internship Tracker
   ────────────────────────────────────────────── */

export const DEPARTMENTS = [
  'Advisor Support Associate',
  'Business Support Associate',
  'Client Relations Associate',
  'Design Content Associate',
  'BizDev Leadership Team',
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
  avatar_url?: string;
  location?: string;
  pin_location?: string;
  pin_location_name?: string;
  program?: string;
  current_year?: string;
  school?: string;
  contact_number?: string;
  personal_email?: string;
  team_email?: string;
  birthday?: string;
  expected_graduation_date?: string;
  required_hours?: number;
  // Profile fields
  status?: string;
  gcash_qr_url?: string;
  start_date?: string;
  bio?: string;
  skills?: string[];
  interests?: string[];
  strengths?: string[];
  career_goals?: string[];
  created_at?: string;
  order_index?: number;
}

export interface Certification {
  id: string;
  intern_id: string;
  name: string;
  issuer: string;
  date_earned: string;
  link?: string;
  created_at?: string;
}

export interface DailyTask {
  id: string;
  intern_id: string;
  task_name: string;
  status: TaskStatus;
  task_date: string; // ISO date string YYYY-MM-DD
  is_verified?: boolean;
  order_index?: number;
}

export interface WeeklyTask {
  id: string;
  intern_id: string;
  task_name: string;
  status: TaskStatus;
  week_number: number;
  is_verified?: boolean;
  order_index?: number;
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

/* ──────────────────────────────────────────────
   Attendance Types
   ────────────────────────────────────────────── */

export interface AttendanceRecord {
  id: string;
  intern_name: string;
  attendance_date: string;       // YYYY-MM-DD
  time_in: string | null;         // ISO timestamp
  break_out: string | null;
  break_in: string | null;
  time_out: string | null;
  total_hours: number | null;     // Auto-computed by DB
  accomplishments: string;
  admin_feedback: string;
  created_at: string;
  updated_at: string;
}

export type AttendanceAction = 'time_in' | 'break_out' | 'break_in' | 'time_out';

/** Enriched attendance with intern info for display */
export interface AttendanceWithIntern extends AttendanceRecord {
  intern?: Intern;
}
