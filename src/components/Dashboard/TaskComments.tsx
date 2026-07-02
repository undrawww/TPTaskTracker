import React, { useState, useEffect, useRef } from 'react';
import { useTaskComments } from '../../hooks/useTaskComments';
import { useAuth } from '../../contexts/AuthContext';
import { renderAvatar } from './AvatarIcons';
import { ConfirmModal } from '../common/ConfirmModal';

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
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
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
    <div className="flex flex-col h-full bg-transparent border-none shadow-none">
      {/* Comments list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
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
            <div key={c.id} className="group/comment flex gap-3.5 mb-2">
              {/* Avatar initial */}
              <div
                className={`
                  w-8 h-8 flex-shrink-0 flex items-center justify-center mt-0.5
                  ${c.avatar_index !== undefined ? '[&_svg]:w-8 [&_svg]:h-8' : 'rounded-full text-xs font-bold'}
                  ${c.avatar_index !== undefined ? '' : (c.author_role === 'admin'
                    ? 'bg-[#ebbc0f]/25 text-[#8a6d00] dark:text-gold'
                    : 'bg-[#003946]/10 text-[#003946]/70 dark:bg-white/10 dark:text-cream/60')}
                `}
              >
                {c.avatar_index !== undefined ? (
                  renderAvatar(c.avatar_index, c.avatar_url)
                ) : (
                  c.author_name.charAt(0).toUpperCase()
                )}
              </div>
              {/* Content */}
              {/* Content */}
              <div className="flex-1 min-w-0 flex flex-col items-start">
                {/* Comment Bubble */}
                <div className="bg-[#003946]/5 dark:bg-white/5 rounded-2xl px-4 py-2.5 w-fit max-w-full">
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span
                      className={`text-[13px] font-bold ${c.author_role === 'admin'
                        ? 'text-[#8a6d00] dark:text-gold'
                        : 'text-[#003946]/80 dark:text-cream/70'
                        }`}
                    >
                      {c.author_name}
                    </span>
                    {c.author_role === 'admin' && (
                      <span className="text-[10px] font-bold text-[#8a6d00] dark:text-gold bg-[#ebbc0f]/15 dark:bg-gold/10 px-1.5 py-[1px] rounded-full uppercase tracking-wider">
                        Admin
                      </span>
                    )}
                  </div>
                  {editingCommentId === c.id ? (
                    <div className="mt-1.5 space-y-2 min-w-[250px]">
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
                    <p className="text-[13px] sm:text-sm text-[#003946]/90 dark:text-cream/80 leading-relaxed break-words whitespace-pre-wrap">
                      {c.content.split(/(@[a-zA-Z0-9_]+)/g).map((part, i) => {
                        if (part.startsWith('@')) {
                          return (
                            <span key={i} className="font-bold text-teal dark:text-gold bg-teal/10 dark:bg-gold/10 px-1 rounded">
                              {part}
                            </span>
                          );
                        }
                        return part;
                      })}
                    </p>
                  )}
                </div>

                {/* Below Bubble: Timestamp & Actions */}
                <div className="flex items-center gap-3 px-3 mt-1">
                  <span className="text-[11px] font-medium text-[#003946]/40 dark:text-cream/40">
                    {formatTime(c.created_at)}
                  </span>
                  
                  {(role === 'admin' || c.author_name === (localStorage.getItem('tp_avatar_name') || user?.email?.split('@')[0] || 'User')) && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => startEdit(c.id, c.content)}
                        className="text-[11px] font-bold text-[#003946]/50 dark:text-cream/50 hover:text-gold transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setCommentToDelete(c.id)}
                        className="text-[11px] font-bold text-[#003946]/50 dark:text-cream/50 hover:text-status-hold transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

      </div>

      {/* New comment input */}
      <form onSubmit={handleSubmit} className="mt-auto flex items-end gap-2 px-4 py-4 border-t border-teal/10 dark:border-white/5 bg-white dark:bg-[#001f26]">
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
          className="flex-1 resize-none text-sm px-4 py-3 rounded-xl border border-teal/20 dark:border-white/10 bg-transparent text-teal dark:text-cream placeholder:text-teal/40 dark:placeholder:text-cream/30 focus:outline-none focus:border-teal dark:focus:border-cream transition-all max-h-[120px] scrollbar-thin"
        />
        <button
          type="submit"
          disabled={!newComment.trim() || submitting}
          className="p-3 rounded-xl bg-[#003946] dark:bg-teal-light text-white hover:bg-[#003946] dark:hover:bg-teal-lighter disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
          title="Send comment"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>

      <ConfirmModal
        isOpen={commentToDelete !== null}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete Comment"
        onConfirm={() => {
          if (commentToDelete) {
            deleteComment(commentToDelete);
          }
        }}
        onClose={() => setCommentToDelete(null)}
      />
    </div>
  );
};
