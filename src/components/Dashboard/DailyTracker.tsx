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
}

export const DailyTracker: React.FC<Props> = ({ 
  interns, 
  tasks, 
  onStatusChange,
  onVerifyChange,
  onEditTask,
  onDeleteIntern,
  onDeleteTask
}) => {
  return (
    <section id="daily-tracker">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-bold text-teal">Daily Task Tracker</h2>
        <div className="flex-1 h-px bg-teal/10" />
        <span className="text-xs text-teal/40 font-medium">
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
    </section>
  );
};
