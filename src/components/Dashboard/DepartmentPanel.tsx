import React from 'react';
import { InternTaskGroup } from './InternTaskGroup';
import type { Intern, DailyTask, WeeklyTask, TaskStatus, Department } from '../../types';

interface Props {
  department: Department;
  interns: Intern[];
  tasks: (DailyTask | WeeklyTask)[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onVerifyChange?: (taskId: string, isVerified: boolean) => void;
  onEditTask?: (taskId: string, newName: string) => void;
  onDeleteIntern?: (internId: string) => void;
  onDeleteTask?: (taskId: string) => void;
}



const DEPT_ICONS: Record<Department, React.ReactNode> = {
  'Advisor Support Associate': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  'Business Support Associate': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
    </svg>
  ),
  'Client Relations Associate': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  'Design Content Associate': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19l7-7 3 3-7 7-3-3z" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      <path d="M2 2l7.586 7.586" />
      <circle cx="11" cy="11" r="2" />
    </svg>
  ),
};

export const DepartmentPanel: React.FC<Props> = ({
  department,
  interns,
  tasks,
  onStatusChange,
  onVerifyChange,
  onEditTask,
  onDeleteIntern,
  onDeleteTask,
}) => {
  const deptInterns = interns.filter((i) => i.department === department);
  const totalTasks = tasks.filter((t) =>
    deptInterns.some((i) => i.id === t.intern_id)
  );
  const doneTasks = totalTasks.filter((t) => t.is_verified).length;

  return (
    <div className="bg-white dark:bg-[#003946] border border-cream-dark/30 dark:border-teal-lighter/15 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
      <div className="bg-gradient-to-r from-teal to-[#004d5e] rounded-t-2xl px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 text-white">
          <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
            {DEPT_ICONS[department]}
          </div>
          <h3 className="font-poppins text-lg font-bold text-[#fbbc04] uppercase leading-tight tracking-wide">
            {department}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/60 font-semibold tabular-nums">
            {doneTasks}/{totalTasks.length}
          </span>
          <div className="relative w-11 h-11 flex items-center justify-center">
            <svg width="44" height="44" viewBox="0 0 44 44" className="transform -rotate-90 absolute inset-0">
              <circle cx="22" cy="22" r="19" stroke="rgba(255,255,255,0.08)" strokeWidth="4" fill="none" />
              <circle
                cx="22" cy="22" r="19"
                stroke="#ebbc0f" strokeWidth="4" fill="none"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 19}
                strokeDashoffset={(2 * Math.PI * 19) - ((totalTasks.length > 0 ? (doneTasks / totalTasks.length) : 0) * (2 * Math.PI * 19))}
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <span className="text-[10px] font-extrabold text-white z-10 relative tabular-nums">
              {totalTasks.length > 0 ? Math.round((doneTasks / totalTasks.length) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Intern task groups */}
      <div className="p-5 space-y-5">
        {deptInterns.length === 0 ? (
          <p className="text-sm text-[#003946] dark:text-[#f5e7c6] italic text-center py-4">
            No interns in this department
          </p>
        ) : (
          deptInterns.map((intern) => {
            const internTasks = tasks.filter((t) => t.intern_id === intern.id);
            return (
              <InternTaskGroup
                key={intern.id}
                internId={intern.id}
                internName={intern.full_name}
                avatarIndex={intern.avatar_index}
                tasks={internTasks}
                onStatusChange={onStatusChange}
                onVerifyChange={onVerifyChange}
                onEditTask={onEditTask}
                onDeleteIntern={onDeleteIntern}
                onDeleteTask={onDeleteTask}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
