import React from 'react';
import { DepartmentPanel } from './DepartmentPanel';
import { DEPARTMENTS, type Intern, type DailyTask, type TaskStatus } from '../../types';

interface Props {
  interns: Intern[];
  tasks: DailyTask[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onVerifyChange?: (taskId: string, isVerified: boolean) => void;
  onEditTask?: (taskId: string, newName: string) => void;
  onDeleteIntern?: (internId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  isAdmin?: boolean;
}

export const DailyTracker: React.FC<Props> = ({ 
  interns, 
  tasks, 
  onStatusChange,
  onVerifyChange,
  onEditTask,
  onDeleteIntern,
  onDeleteTask,
  isAdmin = false
}) => {
  return (
    <section id="daily-tracker">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-bold text-teal dark:text-gold">Daily Task Tracker</h2>
        <div className="flex-1 h-px bg-teal/20 dark:bg-gold/20" />
        <span className="text-xs text-teal/60 dark:text-gold font-medium">
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>
      {interns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-teal/5 dark:bg-[#002833]/50 rounded-2xl border border-teal/10 dark:border-white/5">
          <div className="w-16 h-16 rounded-2xl bg-teal/10 dark:bg-white/5 flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal/40 dark:text-cream/30">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="17" y1="8" x2="23" y2="14" />
              <line x1="23" y1="8" x2="17" y2="14" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-teal dark:text-cream mb-1">
            {isAdmin ? 'No interns found' : 'Not added to system'}
          </h3>
          <p className="text-sm text-teal/50 dark:text-cream/40">
            {isAdmin 
              ? 'Add interns to start tracking their tasks.' 
              : 'You have not been added as an intern by an administrator yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {DEPARTMENTS.map((dept) => (
            <DepartmentPanel
              key={dept}
              department={dept}
              interns={interns}
              tasks={tasks}
              onStatusChange={onStatusChange}
              onVerifyChange={onVerifyChange}
              onEditTask={onEditTask}
              onDeleteIntern={onDeleteIntern}
              onDeleteTask={onDeleteTask}
            />
          ))}
        </div>
      )}
    </section>
  );
};
