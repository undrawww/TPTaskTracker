import React, { useState } from 'react';
import { StatusBadge } from './StatusBadge';
import { TaskComments } from './TaskComments';
import { useAuth } from '../../contexts/AuthContext';
import type { TaskStatus } from '../../types';

interface Props {
  id: string;
  taskName: string;
  status: TaskStatus;
  isVerified?: boolean;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onVerifyChange?: (taskId: string, isVerified: boolean) => void;
  onEditTask?: (taskId: string, newName: string) => void;
  onDeleteTask?: (taskId: string) => void;
}

export const TaskRow: React.FC<Props> = ({ id, taskName, status, isVerified, onStatusChange, onVerifyChange, onEditTask, onDeleteTask }) => {
  const { role } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(taskName);
  const [showComments, setShowComments] = useState(false);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    if (onVerifyChange) {
      onVerifyChange(id, isChecked);
    }
    if (isChecked && status !== 'Done') {
      onStatusChange(id, 'Done');
    } else if (!isChecked && status === 'Done') {
      onStatusChange(id, 'Acknowledge');
    }
  };

  const handleSaveEdit = () => {
    if (editName.trim() && editName !== taskName && onEditTask) {
      onEditTask(id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveEdit();
    if (e.key === 'Escape') {
      setEditName(taskName);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-cream/40">
        <input
          autoFocus
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-cream-dark focus:outline-none focus:ring-2 focus:ring-gold text-teal"
        />
        <button onClick={handleSaveEdit} className="text-xs font-semibold text-teal hover:text-gold transition-colors">Save</button>
        <button onClick={() => setIsEditing(false)} className="text-xs font-semibold text-teal/50 hover:text-teal transition-colors">Cancel</button>
      </div>
    );
  }

  return (
    <div>
      <div
        className={`
          flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl
          bg-cream/30 hover:bg-cream/60 dark:bg-white/[0.03] dark:hover:bg-white/[0.07]
          border border-transparent hover:border-cream-dark/30 dark:hover:border-teal-lighter/10
          transition-all duration-200 group
        `}
      >
        <span className={`text-sm font-medium leading-snug flex-1 min-w-0 truncate ${status === 'Done' ? 'text-teal/35 dark:text-cream/35 line-through' : 'text-teal dark:text-cream'}`}>
          {taskName}
        </span>
        <div className="flex items-center gap-3">
          {/* Comment toggle */}
          <button
            onClick={() => setShowComments(!showComments)}
            className={`p-1.5 rounded-lg transition-all ${
              showComments
                ? 'text-gold bg-gold/10'
                : 'text-teal/30 dark:text-cream/30 hover:text-teal/60 dark:hover:text-cream/60 hover:bg-teal/5 dark:hover:bg-white/5'
            }`}
            title="Comments"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </button>

          {role === 'admin' && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => {
                  setEditName(taskName);
                  setIsEditing(true);
                }}
                className="p-1.5 text-teal/30 hover:text-gold hover:bg-gold/10 rounded-lg transition-colors"
                title="Edit Task"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button
                onClick={() => onDeleteTask?.(id)}
                className="p-1.5 text-teal/30 hover:text-status-hold hover:bg-status-hold/10 rounded-lg transition-colors"
                title="Delete Task"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </button>
            </div>
          )}
          <StatusBadge
            status={status}
            onChange={(newStatus) => onStatusChange(id, newStatus)}
          />
          <input
            type="checkbox"
            checked={isVerified || false}
            onChange={handleCheckboxChange}
            disabled={role === 'intern'}
            className="w-[18px] h-[18px] rounded border-cream-dark text-gold focus:ring-gold focus:ring-offset-0 cursor-pointer transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Expandable comments panel */}
      {showComments && <TaskComments taskId={id} />}
    </div>
  );
};
