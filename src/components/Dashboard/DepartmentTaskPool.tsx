import React, { useState } from 'react';
import { TaskRow } from './TaskRow';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { DailyTask, TaskStatus } from '../../types';

interface Props {
  poolId: string; // e.g. "__pool__Advisor Support Associate"
  departmentLabel: string; // e.g. "ASA"
  tasks: DailyTask[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onVerifyChange?: (taskId: string, isVerified: boolean) => void;
  onEditTask?: (taskId: string, newName: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onAddTask?: (internId: string, taskName: string) => void;
  activeCommentTaskId?: string | null;
  setActiveCommentTaskId?: (id: string | null) => void;
}

export const DepartmentTaskPool: React.FC<Props> = ({
  poolId,
  departmentLabel,
  tasks,
  onStatusChange,
  onVerifyChange,
  onEditTask,
  onDeleteTask,
  onAddTask,
  activeCommentTaskId,
  setActiveCommentTaskId,
}) => {
  const { setNodeRef } = useDroppable({ id: `task-container-${poolId}` });
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');

  const handleAddSubmit = async () => {
    if (newTaskName.trim() && onAddTask) {
      await onAddTask(poolId, newTaskName.trim());
    }
    setNewTaskName('');
    setIsAdding(false);
  };

  const validTasks = tasks.filter(t => t.task_name.trim() !== '');

  return (
    <div className="w-full mb-2 relative z-20">
      <div
        ref={setNodeRef}
        className="relative bg-teal/[0.03] dark:bg-white/[0.02] border border-dashed border-teal/15 dark:border-white/10 rounded-xl px-4 py-3 min-h-[48px] transition-colors"
      >
        {/* Header row */}
        <div className="flex items-center gap-2 mb-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal/30 dark:text-cream/30 flex-shrink-0">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
          </svg>
          <span className="text-[10px] font-bold text-teal/40 dark:text-cream/30 uppercase tracking-[0.15em]">
            {departmentLabel} Task Pool
          </span>
          <span className="text-[10px] text-teal/30 dark:text-cream/20 tabular-nums">
            {validTasks.length > 0 ? `${validTasks.length} unassigned` : ''}
          </span>
        </div>

        {/* Pool tasks */}
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-0.5">
            {validTasks.map(task => (
              <TaskRow
                key={task.id}
                id={task.id}
                internId={poolId}
                taskName={task.task_name}
                status={task.status}
                isVerified={task.is_verified}
                onStatusChange={onStatusChange}
                onVerifyChange={onVerifyChange}
                onEditTask={onEditTask}
                onDeleteTask={onDeleteTask}
                activeCommentTaskId={activeCommentTaskId}
                setActiveCommentTaskId={setActiveCommentTaskId}
              />
            ))}
          </div>
        </SortableContext>

        {/* Add task input / button */}
        {isAdding ? (
          <div className="flex items-center gap-2 mt-1 px-1 py-1">
            <input
              autoFocus
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setNewTaskName('');
                  setIsAdding(false);
                } else if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              onBlur={handleAddSubmit}
              className="flex-1 px-2 py-1 text-sm bg-transparent border-b border-teal/30 dark:border-cream/30 focus:outline-none focus:border-teal dark:focus:border-cream text-teal dark:text-cream placeholder:text-teal/30 dark:placeholder:text-cream/30"
              placeholder="Enter task for department pool..."
            />
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 mt-1 px-1 py-1 text-teal/30 dark:text-cream/25 hover:text-teal/60 dark:hover:text-cream/50 transition-colors group/addpool"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="text-[11px] font-medium">Add department task</span>
          </button>
        )}
      </div>
    </div>
  );
};
