import React from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
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
  onViewProfile?: (internId: string) => void;
}

export const DepartmentPanel: React.FC<Props> = ({
  department,
  interns,
  tasks,
  onStatusChange,
  onVerifyChange,
  onEditTask,
  onDeleteIntern,
  onDeleteTask,
  onViewProfile,
}) => {
  const deptInterns = interns.filter((i) => i.department === department);
  const sortedInterns = [...deptInterns].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

  return (
    <div className="flex flex-col h-full min-h-[500px]">
      <div className="sticky top-0 z-10 bg-[#001f26] dark:bg-[#000000] px-2 py-3 flex items-center justify-between mb-4 border-b border-teal/20 dark:border-white/10">
        <h3 className="font-sans text-sm font-bold text-teal dark:text-white/90 uppercase tracking-[0.15em]">
          {department}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
        {sortedInterns.length === 0 ? (
          <p className="text-sm text-teal/40 dark:text-white/20 italic mt-4">
            No interns
          </p>
        ) : (
          <SortableContext items={sortedInterns.map(i => i.id)} strategy={verticalListSortingStrategy}>
            {sortedInterns.map((intern) => {
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
                  onViewProfile={onViewProfile}
                />
              );
            })}
          </SortableContext>
        )}
      </div>
    </div>
  );
};
