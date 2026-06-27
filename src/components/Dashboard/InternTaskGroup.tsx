import React, { useState, useEffect } from 'react';
import { TaskRow } from './TaskRow';
import { getAvatarIcon, renderAvatar } from './AvatarIcons';
import type { DailyTask, WeeklyTask, TaskStatus } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  internId: string;
  internName: string;
  avatarIndex?: number;
  avatarUrl?: string;
  tasks: (DailyTask | WeeklyTask)[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onVerifyChange?: (taskId: string, isVerified: boolean) => void;
  onEditTask?: (taskId: string, newName: string) => void;
  onDeleteIntern?: (internId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onViewProfile?: (internId: string) => void;
  onAddTask?: (internId: string, taskName: string, emptyGapsCount?: number) => void;
  activeCommentTaskId?: string | null;
  setActiveCommentTaskId?: (id: string | null) => void;
}

export const InternTaskGroup: React.FC<Props> = ({ internId, internName, avatarIndex, avatarUrl, tasks, onStatusChange, onVerifyChange, onEditTask, onDeleteIntern, onDeleteTask, onViewProfile, onAddTask, activeCommentTaskId, setActiveCommentTaskId }) => {
  const { role, currentInternId } = useAuth();
  const canAddTask = role === 'admin' || currentInternId === internId;
  const { setNodeRef: setDroppableRef } = useDroppable({ id: `task-container-${internId}` });
  const { attributes, listeners, setNodeRef: setSortableRef, transform, transition, isDragging } = useSortable({ id: internId, data: { type: 'Intern' } });

  const [isAddingTask, setIsAddingTask] = useState(false);
  const [addingIndex, setAddingIndex] = useState(0);
  const [newTaskName, setNewTaskName] = useState('');

  const [chosenAvatarIdx, setChosenAvatarIdx] = useState<number | null>(() => {
    const savedName = localStorage.getItem('tp_avatar_name');
    if (savedName === internName) {
      const idx = localStorage.getItem('tp_avatar');
      return idx ? parseInt(idx, 10) : null;
    }
    return null;
  });

  const firstName = internName.split(' ')[0];

  useEffect(() => {
    const handler = () => {
      const savedName = localStorage.getItem('tp_avatar_name');
      if (savedName === internName) {
        const idx = localStorage.getItem('tp_avatar');
        setChosenAvatarIdx(idx ? parseInt(idx, 10) : null);
      } else {
        setChosenAvatarIdx(null);
      }
    };
    window.addEventListener('avatar-change', handler);
    return () => window.removeEventListener('avatar-change', handler);
  }, [internName]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setSortableRef} 
      style={style} 
      className={`w-72 flex-shrink-0 space-y-2.5 ${isDragging ? 'opacity-50 relative z-50 bg-white dark:bg-[#002530] rounded-xl shadow-xl' : ''}`}
    >
      <div className="flex items-center gap-2.5 px-1 group/intern">
        {/* Drag Handle */}
        <div 
          className="cursor-grab active:cursor-grabbing p-1 -ml-2 text-teal/20 hover:text-teal/50 dark:text-cream/20 dark:hover:text-cream/50 transition-colors opacity-0 group-hover/intern:opacity-100"
          {...attributes}
          {...listeners}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
        </div>
        <div 
          className={`flex items-center gap-2.5 flex-1 ${onViewProfile ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
          onClick={() => onViewProfile?.(internId)}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm">
            {chosenAvatarIdx !== null 
              ? renderAvatar(chosenAvatarIdx, avatarUrl) 
              : avatarIndex !== undefined 
                ? renderAvatar(avatarIndex, avatarUrl) 
                : getAvatarIcon(internName)}
          </div>
          <h4 className="text-sm font-semibold text-teal dark:text-cream tracking-tight uppercase">
            {firstName}
          </h4>
        </div>
        <span className="text-[13px] text-teal/40 dark:text-cream/40 font-bold tabular-nums">
          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
        </span>
        {onDeleteIntern && (
          <button
            onClick={() => {
              if (confirm(`Are you sure you want to remove ${internName}?`)) {
                onDeleteIntern(internId);
              }
            }}
            className="opacity-0 group-hover/intern:opacity-100 p-1.5 text-status-hold/70 hover:text-status-hold hover:bg-status-hold/10 rounded-lg transition-all"
            title="Remove Intern"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        )}
      </div>
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div ref={setDroppableRef} className="space-y-0.5 pl-6 min-h-[40px] pb-4 group/list">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              id={task.id}
              internId={internId}
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
          
          {/* Empty placeholder lines and Add Task Input */}
          {Array.from({ length: Math.max(isAddingTask ? addingIndex + 1 : 0, 5 - tasks.length) }).map((_, idx) => {
            const isThisLineAdding = isAddingTask && addingIndex === idx;

            if (isThisLineAdding) {
              return (
                <div key={`adding-${idx}`} className="flex items-center gap-2 px-1 py-1 h-[42px]">
                  <input
                    autoFocus
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setNewTaskName(''); // Clear it so onBlur doesn't save
                        e.currentTarget.blur();
                      } else if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      }
                    }}
                    onBlur={async () => {
                      if (newTaskName.trim() && onAddTask) {
                        await onAddTask(internId, newTaskName.trim(), addingIndex);
                      }
                      setNewTaskName('');
                      setIsAddingTask(false);
                      setAddingIndex(0);
                    }}
                    className="flex-1 px-2 py-1 text-sm bg-transparent border-b border-teal/40 dark:border-cream/40 focus:outline-none focus:border-teal dark:focus:border-cream text-teal dark:text-cream placeholder:text-teal/30 dark:placeholder:text-cream/30"
                    placeholder="Enter task name..."
                  />
                </div>
              );
            }

            return (
              <div 
                key={`empty-line-${idx}`} 
                onClick={() => {
                  if (canAddTask && onAddTask) {
                    setAddingIndex(idx);
                    setIsAddingTask(true);
                  }
                }}
                className={`h-[42px] border-b border-teal/10 dark:border-cream/5 ${canAddTask ? 'cursor-text hover:bg-teal/5 dark:hover:bg-cream/5 transition-colors group/emptyline' : ''}`}
              >
                {canAddTask && (
                  <span className="opacity-0 group-hover/emptyline:opacity-100 text-[10px] text-teal/30 dark:text-cream/30 italic pl-2 h-full flex items-center">Click to add task</span>
                )}
              </div>
            );
          })}
          
          {/* Explicit Add Task button, only shows if 5 or more tasks exist */}
          {!isAddingTask && tasks.length >= 5 && canAddTask && onAddTask && (
            <div 
              onClick={() => {
                setAddingIndex(0);
                setIsAddingTask(true);
              }}
              className="opacity-0 group-hover/list:opacity-100 transition-opacity mt-2 flex items-center gap-2 px-2 py-1.5 cursor-pointer text-teal/50 hover:text-teal dark:text-cream/50 dark:hover:text-cream"
            >
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
               </svg>
               <span className="text-xs font-semibold">Add Task</span>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
};
