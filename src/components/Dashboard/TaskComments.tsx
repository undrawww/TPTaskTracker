import React, { useState, useEffect, useRef } from 'react';
import { useTaskComments } from '../../hooks/useTaskComments';
import { useAuth } from '../../contexts/AuthContext';
import { getAvatarByIndex } from './AvatarIcons';

interface Props {
  taskId: string;
}

export const TaskComments: React.FC<Props> = ({ taskId }) => {
  const { user, role } = useAuth();
  const { comments, loading, fetchComments, addComment, deleteComment, editComment } = useTaskComments(taskId);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Edit state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [newComment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    const authorName =
      localStorage.getItem('tp_avatar_name') || user?.email?.split('@')[0] || 'User';
    await addComment(newComment, authorName, role || 'intern');
    setNewComment('');
    setSubmitting(false);
  };

  const startEdit = (commentId: string, content: string) => {
    setEditingCommentId(commentId);
    setEditContent(content);
  };

  const cancelEdit = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  const handleEditSubmit = async (commentId: string) => {
    if (!editContent.trim() || savingEdit) return;
    setSavingEdit(true);
    await editComment(commentId, editContent);
    setSavingEdit(false);
    setEditingCommentId(null);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="mt-1.5 ml-4 mr-2 rounded-xl bg-[#d7cbaf] dark:bg-[#002530] border border-[#003946]/15 dark:border-teal-lighter/10 shadow-sm overflow-hidden animate-slide-up">
      {/* Comments list */}
      <div className="max-h-48 overflow-y-auto px-4 pt-3.5 pb-1.5 space-y-3 scrollbar-thin">
        {loading ? (
          <div className="flex items-center gap-2 py-3">
            <div className="w-3 h-3 rounded-full bg-teal/15 animate-pulse" />
            <span className="text-[11px] text-[#003946]/50 dark:text-cream/40">Loading comments…</span>
          </div>
        ) : comments.length === 0 ? (
          <p className="text-[11px] text-[#003946]/40 dark:text-cream/35 italic py-2 text-center">
            No comments yet
          </p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="group/comment flex gap-2.5">
              {/* Avatar initial */}
              <div
                className={`
                  w-6 h-6 flex-shrink-0 flex items-center justify-center mt-0.5
                  ${c.avatar_index !== undefined ? '' : 'rounded-full text-[10px] font-bold'}
                  ${c.avatar_index !== undefined ? '' : (c.author_role === 'admin'
                    ? 'bg-[#ebbc0f]/25 text-[#8a6d00] dark:text-gold'
                    : 'bg-[#003946]/10 text-[#003946]/70 dark:bg-white/10 dark:text-cream/60')}
                `}
              >
                {c.avatar_index !== undefined ? (
                  getAvatarByIndex(c.avatar_index)
                ) : (
                  c.author_name.charAt(0).toUpperCase()
                )}
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`text-[11px] font-bold ${c.author_role === 'admin'
                      ? 'text-[#8a6d00] dark:text-gold'
                      : 'text-[#003946]/80 dark:text-cream/70'
                      }`}
                  >
                    {c.author_name}
                  </span>
                  {c.author_role === 'admin' && (
                    <span className="text-[9px] font-bold text-[#8a6d00] dark:text-gold bg-[#ebbc0f]/15 dark:bg-gold/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      Admin
                    </span>
                  )}
                  <span className="text-[10px] text-[#003946]/35 dark:text-cream/30 ml-auto flex-shrink-0">
                    {formatTime(c.created_at)}
                  </span>
                </div>
                {editingCommentId === c.id ? (
                  <div className="mt-1.5 space-y-2">
                    <textarea
                      autoFocus
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') cancelEdit();
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleEditSubmit(c.id);
                        }
                      }}
                      className="w-full text-xs px-2 py-1.5 rounded bg-white/50 dark:bg-black/20 border border-[#003946]/20 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-gold text-[#003946] dark:text-cream resize-none"
                      rows={2}
                    />
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEditSubmit(c.id)}
                        disabled={savingEdit || !editContent.trim()}
                        className="text-[10px] font-bold text-teal bg-gold/90 hover:bg-gold px-2 py-0.5 rounded transition-colors disabled:opacity-50"
                      >
                        {savingEdit ? 'Saving...' : 'Save'}
                      </button>
                      <button 
                        onClick={cancelEdit}
                        disabled={savingEdit}
                        className="text-[10px] font-bold text-[#003946]/60 dark:text-cream/60 hover:text-[#003946] dark:hover:text-cream transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#003946]/90 dark:text-cream/80 leading-relaxed mt-0.5 break-words whitespace-pre-wrap">
                    {c.content}
                  </p>
                )}
              </div>
              {/* Actions (admin only) */}
              {role === 'admin' && (
                <div className="opacity-0 group-hover/comment:opacity-100 flex items-center gap-1 self-start mt-0.5 transition-all">
                  <button
                    onClick={() => startEdit(c.id, c.content)}
                    className="p-1 text-[#003946]/20 hover:text-gold transition-colors"
                    title="Edit comment"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => deleteComment(c.id)}
                    className="p-1 text-[#003946]/20 hover:text-status-hold transition-colors"
                    title="Delete comment"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))
        )}

      </div>

      {/* New comment input */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2 px-3.5 py-2.5 border-t border-[#003946]/10 dark:border-teal-lighter/10 bg-[#c1b290] dark:bg-[#001a22]">
        <textarea
          ref={textareaRef}
          rows={1}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Write a comment…"
          className="flex-1 resize-none text-xs px-3 py-2 rounded-lg border border-[#003946]/15 dark:border-teal-lighter/15 bg-[#c8bda3] dark:bg-[#002b36] text-[#003946] dark:text-cream placeholder:text-[#003946]/50 dark:placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-[#ebbc0f]/50 focus:border-[#ebbc0f]/50 transition-all max-h-[120px] scrollbar-thin"
        />
        <button
          type="submit"
          disabled={!newComment.trim() || submitting}
          className="p-2 rounded-lg bg-[#003946] dark:bg-teal-light text-white hover:bg-[#003946] dark:hover:bg-teal-lighter disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
          title="Send comment"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  );
};
