import React, { useState, useEffect, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { StatusBadge } from './StatusBadge';
import { TaskComments } from './TaskComments';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
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
  internId?: string;
}

export const TaskRow: React.FC<Props> = ({ id, taskName, status, isVerified, onStatusChange, onVerifyChange, onEditTask, onDeleteTask, internId }) => {
  const { role, currentInternId } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(taskName);
  const [showComments, setShowComments] = useState(false);
  const [firstComment, setFirstComment] = useState<string | null>(null);
  const [commentCount, setCommentCount] = useState(0);
  const [hovered, setHovered] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const loadPreview = useCallback(async () => {
    if (!isSupabaseConfigured) {
      try {
        const all = JSON.parse(localStorage.getItem('padua_task_comments') || '[]');
        const taskComments = all.filter((c: any) => c.task_id === id);
        setCommentCount(taskComments.length);
        if (taskComments.length > 0) {
          const latest = taskComments[taskComments.length - 1];
          setFirstComment(`${latest.author_name}: ${latest.content}`);
        }
      } catch { /* ignore */ }
      return;
    }

    try {
      const { data, error } = await supabase
        .from('task_comments')
        .select('author_name, content')
        .eq('task_id', id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        setFirstComment(`${data[0].author_name}: ${data[0].content}`);
      }
      const { count } = await supabase
        .from('task_comments')
        .select('*', { count: 'exact', head: true })
        .eq('task_id', id);

      setCommentCount(count || 0);
    } catch { /* ignore */ }
  }, [id]);

  useEffect(() => { loadPreview(); }, [loadPreview]);
  useEffect(() => { if (!showComments) loadPreview(); }, [showComments, loadPreview]);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    if (onVerifyChange) onVerifyChange(id, isChecked);
    if (isChecked && status !== 'Done') onStatusChange(id, 'Done');
    else if (!isChecked && status === 'Done') onStatusChange(id, 'Acknowledge');
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
      <div className="flex items-center gap-3 px-3 py-1.5 bg-[#1a1a1a] border border-[#333] rounded">
        <input
          autoFocus
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 px-3 py-1.5 text-sm bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-white text-white"
        />
        <button onClick={handleSaveEdit} className="text-xs text-white hover:text-gray-300">Save</button>
        <button onClick={() => setIsEditing(false)} className="text-xs text-gray-500 hover:text-gray-300">Cancel</button>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group/task border-b border-white/[0.08] last:border-0 hover:bg-white/[0.02] transition-colors py-2 pl-1 pr-2">
      <div
        className="flex items-start justify-between gap-3"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <div {...attributes} {...listeners} className="mt-1 cursor-grab opacity-0 group-hover/task:opacity-40 hover:!opacity-100 transition-opacity text-white shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="9" cy="5" r="2" />
              <circle cx="15" cy="5" r="2" />
              <circle cx="9" cy="12" r="2" />
              <circle cx="15" cy="12" r="2" />
              <circle cx="9" cy="19" r="2" />
              <circle cx="15" cy="19" r="2" />
            </svg>
          </div>
          <span className={`text-[13px] font-normal leading-snug break-words ${status === 'Done' ? 'text-white/30 line-through' : 'text-white/90'}`}>
            {taskName}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 opacity-0 group-hover/task:opacity-100 transition-opacity">
            <StatusBadge
              status={status}
              onChange={(newStatus) => onStatusChange(id, newStatus)}
              disabled={role === 'intern' && internId !== currentInternId}
            />
            <button onClick={() => setShowComments(!showComments)} className="text-white/40 hover:text-white transition-colors relative">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              {commentCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold text-white bg-red-600 rounded-full w-3.5 h-3.5 flex items-center justify-center">
                  {commentCount > 9 ? '9+' : commentCount}
                </span>
              )}
            </button>
            {role === 'admin' && (
              <>
                <button onClick={() => { setEditName(taskName); setIsEditing(true); }} className="text-white/40 hover:text-white transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button onClick={() => onDeleteTask?.(id)} className="text-white/40 hover:text-red-500 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </>
            )}
          </div>
          
          <input
            type="checkbox"
            checked={isVerified || false}
            onChange={handleCheckboxChange}
            disabled={role === 'intern'}
            className="w-[14px] h-[14px] rounded-sm bg-transparent border-white/20 checked:bg-white checked:border-white focus:ring-0 cursor-pointer disabled:opacity-25"
          />
        </div>

        {hovered && !showComments && firstComment && (
          <div className="absolute right-0 top-full mt-1 z-30 max-w-[200px] px-2 py-1.5 rounded bg-black/90 text-white text-[11px] leading-snug shadow-xl border border-white/10 pointer-events-none">
            <p className="truncate">{firstComment}</p>
          </div>
        )}
      </div>
      {showComments && <TaskComments taskId={id} />}
    </div>
  );
};
