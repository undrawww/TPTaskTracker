import React, { useState, useEffect } from 'react';
import { TaskRow } from './TaskRow';
import { getAvatarIcon, getAvatarByIndex } from './AvatarIcons';
import type { DailyTask, WeeklyTask, TaskStatus } from '../../types';

interface Props {
  internId: string;
  internName: string;
  avatarIndex?: number;
  tasks: (DailyTask | WeeklyTask)[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onVerifyChange?: (taskId: string, isVerified: boolean) => void;
  onEditTask?: (taskId: string, newName: string) => void;
  onDeleteIntern?: (internId: string) => void;
  onDeleteTask?: (taskId: string) => void;
}

export const InternTaskGroup: React.FC<Props> = ({ internId, internName, avatarIndex, tasks, onStatusChange, onVerifyChange, onEditTask, onDeleteIntern, onDeleteTask }) => {
  const [chosenAvatarIdx, setChosenAvatarIdx] = useState<number | null>(() => {
    const savedName = localStorage.getItem('tp_avatar_name');
    if (savedName === internName) {
      const idx = localStorage.getItem('tp_avatar');
      return idx ? parseInt(idx, 10) : null;
    }
    return null;
  });

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

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2.5 px-1 group/intern">
        <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm">
          {chosenAvatarIdx !== null 
            ? getAvatarByIndex(chosenAvatarIdx) 
            : avatarIndex !== undefined 
              ? getAvatarByIndex(avatarIndex) 
              : getAvatarIcon(internName)}
        </div>
        <h4 className="text-sm font-semibold text-teal dark:text-cream flex-1 tracking-tight">
          {internName}
        </h4>
        <span className="text-[11px] text-teal/35 dark:text-cream/35 font-semibold tabular-nums">
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
      <div className="space-y-1.5 pl-1">
        {tasks.length === 0 ? (
          <p className="text-xs text-teal/30 dark:text-cream/30 italic px-4 py-2">No tasks assigned</p>
        ) : (
          tasks.map((task) => (
            <TaskRow
              key={task.id}
              id={task.id}
              taskName={task.task_name}
              status={task.status}
              isVerified={task.is_verified}
              onStatusChange={onStatusChange}
              onVerifyChange={onVerifyChange}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
            />
          ))
        )}
      </div>
      {/* Intern Progress Bar */}
      {tasks.length > 0 && (() => {
        const pct = Math.round((tasks.filter(t => t.is_verified).length / tasks.length) * 100);
        return (
          <div className="pt-2.5 px-1 pb-1">
            <div className="w-full h-2.5 bg-teal/8 dark:bg-white/8 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-[#fbbc04] to-[#f5d44a] rounded-full transition-all duration-700 ease-out relative"
                style={{ width: `${pct}%` }}
              >
                {pct > 0 && <div className="absolute inset-0 rounded-full progress-shimmer" />}
              </div>
            </div>
            <div className="text-center text-[11px] font-bold text-teal/60 dark:text-cream/60 mt-1.5 tabular-nums">
              {pct}%
            </div>
          </div>
        );
      })()}
    </div>
  );
};
