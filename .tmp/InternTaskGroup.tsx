import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  onViewProfile?: (internId: string) => void;
}

export const InternTaskGroup: React.FC<Props> = ({ internId, internName, avatarIndex, tasks, onStatusChange, onVerifyChange, onEditTask, onDeleteIntern, onDeleteTask, onViewProfile }) => {
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

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: internId,
    data: { type: 'intern' },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const sortedTasks = [...tasks].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

  return (
    <div ref={setNodeRef} style={style} className="mb-4">
      <div className="flex items-center justify-between group/intern pb-2">
        <div className="flex items-center gap-2 flex-1">
          <div {...attributes} {...listeners} className="cursor-grab text-white/30 hover:text-white transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="9" cy="5" r="2" />
              <circle cx="15" cy="5" r="2" />
              <circle cx="9" cy="12" r="2" />
              <circle cx="15" cy="12" r="2" />
              <circle cx="9" cy="19" r="2" />
              <circle cx="15" cy="19" r="2" />
            </svg>
          </div>
          <div 
            className={`flex items-center gap-2 ${onViewProfile ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
            onClick={() => onViewProfile?.(internId)}
          >
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] bg-white/5">
              {chosenAvatarIdx !== null 
                ? getAvatarByIndex(chosenAvatarIdx) 
                : avatarIndex !== undefined 
                  ? getAvatarByIndex(avatarIndex) 
                  : getAvatarIcon(internName)}
            </div>
            <h4 className="text-[14px] font-bold text-white tracking-tight">
              {internName}
            </h4>
          </div>
        </div>
        
        <div className="flex items-center gap-2 opacity-0 group-hover/intern:opacity-100 transition-opacity">
          {onDeleteIntern && (
            <button
              onClick={() => {
                if (confirm(`Are you sure you want to remove ${internName}?`)) {
                  onDeleteIntern(internId);
                }
              }}
              className="p-1 text-white/40 hover:text-red-500 transition-all"
              title="Remove Intern"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <div className="pl-6">
        {sortedTasks.length === 0 ? (
          <p className="text-[12px] text-white/30 italic py-1">No tasks assigned</p>
        ) : (
          <SortableContext items={sortedTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {sortedTasks.map((task) => (
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
              />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  );
};
