import React, { useState, useEffect, useCallback, useRef } from 'react';
import { STATUS_STYLES } from './StatusBadge';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { TASK_STATUSES, type TaskStatus } from '../../types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { getAvatarByIndex } from './AvatarIcons';

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
  activeCommentTaskId?: string | null;
  setActiveCommentTaskId?: (id: string | null) => void;
}

export const TaskRow: React.FC<Props> = ({ id, taskName, status, isVerified, onStatusChange, onVerifyChange, onEditTask, onDeleteTask, internId, activeCommentTaskId, setActiveCommentTaskId }) => {
  const { role, currentInternId } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(taskName);
  const [commentCount, setCommentCount] = useState(0);
  const [latestComment, setLatestComment] = useState<{ author_name: string; content: string; created_at: string; avatar_index?: number } | null>(null);
  const [hovered, setHovered] = useState(false);
  const [isStatusExpanded, setIsStatusExpanded] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, data: { type: 'Task' } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  // Close status dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsStatusExpanded(false);
      }
    };
    if (isStatusExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isStatusExpanded]);

  const loadCommentCount = useCallback(async () => {
    if (!isSupabaseConfigured) {
      try {
        const all = JSON.parse(localStorage.getItem('padua_task_comments') || '[]');
        const taskComments = all.filter((c: any) => c.task_id === id);
        setCommentCount(taskComments.length);
      } catch { /* ignore */ }
      return;
    }

    try {
      const { data, count } = await supabase
        .from('task_comments')
        .select('*', { count: 'exact' })
        .eq('task_id', id)
        .order('created_at', { ascending: false })
        .limit(1);

      setCommentCount(count || 0);

      if (count && count > 0 && data && data.length > 0) {
        const comment = data[0];
        let avatar_index: number | undefined;

        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('avatar_index')
            .eq('full_name', comment.author_name)
            .single();
          if (profileData) {
            avatar_index = profileData.avatar_index;
          }
        } catch { /* ignore */ }

        setLatestComment({
          author_name: comment.author_name,
          content: comment.content,
          created_at: comment.created_at,
          avatar_index
        });
      }
    } catch { /* ignore */ }
  }, [id]);

  useEffect(() => {
    loadCommentCount();
  }, [loadCommentCount]);

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

  const isChecked = isVerified || status === 'Done';
  const isBlank = taskName.trim() === '';
  
  if (isEditing) {
    return (
      <div className="flex items-center gap-3 px-1 py-1 mb-1" ref={setNodeRef} style={style}>
        <input
          autoFocus
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSaveEdit}
          className="flex-1 px-2 py-1 text-sm bg-transparent border-b border-teal/40 dark:border-cream/40 focus:outline-none focus:border-teal dark:focus:border-cream text-teal dark:text-cream"
        />
      </div>
    );
  }

  return (
    <div 
      ref={(node) => {
        setNodeRef(node);
        containerRef.current = node;
      }}
      style={style}
      className={`group flex flex-col mb-1 ${isDragging ? 'shadow-lg bg-white/50 dark:bg-black/20 rounded-md ring-1 ring-teal/20 dark:ring-white/20' : ''}`}
    >
      <div
        className="relative flex items-start min-h-[32px] border-b border-teal/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group/row"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Checkbox (Left side, only on hover or if checked) */}
        {/* Checkbox (Left side, space always reserved) */}
        <div className="w-[32px] flex-shrink-0 flex items-start justify-center pt-2">
          {!isBlank && (
            <div className={`transition-opacity duration-200 ${hovered || isChecked || isStatusExpanded ? 'opacity-100' : 'opacity-0'}`}>
              <input
                type="checkbox"
                checked={isChecked}
                onChange={handleCheckboxChange}
                disabled={role === 'intern' && internId !== currentInternId}
                className="w-[14px] h-[14px] rounded-sm border-teal/30 dark:border-cream/30 text-teal dark:text-cream focus:ring-0 focus:ring-offset-0 cursor-pointer transition-colors disabled:opacity-25"
              />
            </div>
          )}
        </div>

        {/* Task Name (Draggable handle area) */}
        <div
          className="flex-1 min-w-0 py-1.5 cursor-grab active:cursor-grabbing pl-1 pr-6 flex items-start mt-[1px]"
          {...attributes}
          {...listeners}
          onClick={() => {
            // Prevent drag from triggering click by checking if we moved? dnd-kit handles this usually.
            if (role === 'admin') {
              // Admin: single click to edit
              setEditName(taskName);
              setIsEditing(true);
            } else if (!isBlank) {
              // Intern: single click to expand status (if not blank)
              setIsStatusExpanded(!isStatusExpanded);
            }
          }}
        >
          <span 
            className={`text-sm tracking-tight transition-all duration-300 select-none ${isChecked ? 'text-teal/40 dark:text-cream/40 line-through' : 'text-teal dark:text-cream'} ${hovered ? 'block break-all whitespace-pre-wrap' : 'block truncate'}`}
          >
            {taskName}
          </span>
        </div>

        {/* Actions (Right side, space reserved) */}
        <div className="w-[60px] flex-shrink-0 flex items-start justify-end pt-1.5 pr-2">
          <div className={`flex items-center gap-1 transition-opacity duration-200 ${(hovered || activeCommentTaskId === id || commentCount > 0) ? 'opacity-100' : 'opacity-0'}`}>
            {!isBlank && (
              <>
              {/* Comment Button with Tooltip */}
              <div className="relative group/commentbtn flex items-center justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveCommentTaskId && setActiveCommentTaskId(activeCommentTaskId === id ? null : id);
                  }}
                  className={`relative p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${activeCommentTaskId === id || commentCount > 0 ? 'text-teal dark:text-cream' : 'text-teal/40 dark:text-cream/40'}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                  {commentCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-teal text-white dark:bg-cream dark:text-teal text-[9px] font-bold flex items-center justify-center leading-none">
                      {commentCount}
                    </span>
                  )}
                </button>

                {/* Latest Comment Tooltip */}
                {latestComment && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-slate-50 dark:bg-slate-800 shadow-xl border border-teal/10 dark:border-white/10 rounded-xl p-3 z-50 opacity-0 invisible group-hover/commentbtn:opacity-100 group-hover/commentbtn:visible transition-all duration-200 pointer-events-none text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-teal/5 dark:bg-white/5 flex items-center justify-center">
                        {getAvatarByIndex(latestComment.avatar_index ?? 0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-teal dark:text-cream leading-tight">{latestComment.author_name}</span>
                        <span className="text-xs text-teal/60 dark:text-cream/60 leading-tight">
                          {new Date(latestComment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-teal/90 dark:text-cream/90 break-words whitespace-pre-wrap">
                      {latestComment.content}
                    </p>
                  </div>
                )}
              </div>
              {/* Status Button (Available to all) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsStatusExpanded(!isStatusExpanded);
                }}
                className={`p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${status !== 'Acknowledge' ? STATUS_STYLES[status].text : (isStatusExpanded ? 'text-teal dark:text-cream' : 'text-teal/40 dark:text-cream/40')}`}
                title="Change Status"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </button>
            </>
            )}

            {/* Delete Button (Admin only) */}
              {role === 'admin' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTask?.(id);
                  }}
                  className="p-1 rounded text-teal/40 hover:text-red-500 dark:text-cream/40 dark:hover:text-red-400 transition-colors opacity-0 group-hover/row:opacity-100"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          </div>
      </div>

      {/* Expanded Status Selector */}
      <AnimatePresence>
        {isStatusExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="py-2 px-2 ml-6 flex flex-wrap gap-2">
               {TASK_STATUSES.map((s) => {
                 const sStyle = STATUS_STYLES[s];
                 const isActive = s === status;
                 return (
                   <button
                     key={s}
                     disabled={role === 'intern' && internId !== currentInternId}
                     onClick={(e) => {
                       e.stopPropagation();
                       onStatusChange(id, s);
                       setIsStatusExpanded(false);
                     }}
                     className={`
                       inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
                       ${sStyle.bg} ${sStyle.text}
                       ${(role === 'intern' && internId !== currentInternId) ? 'opacity-70 cursor-not-allowed' : `hover:ring-2 ${sStyle.ring} hover:ring-opacity-40 cursor-pointer`}
                       ${isActive ? `ring-2 ${sStyle.ring}` : ''}
                       transition-all duration-200
                     `}
                   >
                     <span className={`w-1.5 h-1.5 rounded-full ${sStyle.dot}`} />
                     {s}
                   </button>
                 );
               })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
