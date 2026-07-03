import React, { useState, useEffect, useRef } from 'react';
import { useTaskComments } from '../../hooks/useTaskComments';
import { useAuth } from '../../contexts/AuthContext';
import { renderAvatar } from './AvatarIcons';
import { ConfirmModal } from '../common/ConfirmModal';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';

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

  // Mention state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionUsers, setMentionUsers] = useState<{name: string, email: string}[]>([]);

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [attachment, setAttachment] = useState<{ url: string; name: string } | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const uploadFile = async (file: File) => {
    if (!isSupabaseConfigured) {
      alert("Storage is not available in local demo mode.");
      return;
    }

    try {
      setUploading(true);
      
      const fileExt = file.name ? file.name.split('.').pop() : 'png';
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('attachments').getPublicUrl(fileName);
      
      setAttachment({ url: data.publicUrl, name: file.name || 'Pasted Image.png' });
    } catch (err: any) {
      console.error('Error uploading file:', err);
      alert(`Failed to upload file: ${err.message || err.toString()}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          await uploadFile(file);
          break;
        }
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDraggingFile(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsDraggingFile(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        await uploadFile(file);
      }
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setMentionUsers([{ name: 'Admin', email: 'local' }, { name: 'Intern', email: 'local' }]);
      return;
    }
    const fetchUsers = async () => {
      try {
        const { data: p } = await supabase.from('profiles').select('username, full_name, email');
        const { data: i } = await supabase.from('interns').select('username, full_name, email');
        const all: {name: string, email: string}[] = [];
        const add = (u: any) => {
          if (!u.email) return;
          if (u.username) all.push({ name: u.username, email: u.email });
          else if (u.full_name) all.push({ name: u.full_name.split(' ')[0], email: u.email });
        };
        (p || []).forEach(add);
        (i || []).forEach(add);
        
        // Deduplicate by email
        const uniqueUsers = Array.from(new Map(all.map(item => [item.email, item])).values());
        setMentionUsers(uniqueUsers);
      } catch (e) {
        // fail silently
      }
    };
    fetchUsers();
  }, []);

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
    if ((!newComment.trim() && !attachment) || submitting) return;

    setSubmitting(true);
    const authorName =
      localStorage.getItem('tp_avatar_name') || user?.email?.split('@')[0] || 'User';
      
    const finalComment = attachment 
      ? (newComment.trim() ? `${newComment}\n\n${attachment.url}` : attachment.url)
      : newComment;
      
    await addComment(finalComment, authorName, role || 'intern');
    
    setNewComment('');
    setAttachment(null);
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

  const renderCommentContent = (content: string) => {
    // First split by URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);
    
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        // Check if it's an image
        if (part.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i)) {
          return (
            <button 
              key={i} 
              type="button"
              onClick={() => setSelectedImage(part)}
              className="block my-2 text-left focus:outline-none"
            >
              <img src={part} alt="attachment" className="max-w-full h-auto max-h-48 rounded-lg border border-teal/10 dark:border-white/10 hover:opacity-90 transition-opacity" />
            </button>
          );
        }
        return (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-500 dark:text-blue-400 hover:underline break-all">
            {part}
          </a>
        );
      }
      
      // Process mentions in non-URL text
      return part.split(/(@[a-zA-Z0-9_]+)/g).map((subPart, j) => {
        if (subPart.startsWith('@')) {
          return (
            <span key={`${i}-${j}`} className="font-bold text-teal dark:text-gold bg-teal/10 dark:bg-gold/10 px-1 rounded">
              {subPart}
            </span>
          );
        }
        return <React.Fragment key={`${i}-${j}`}>{subPart}</React.Fragment>;
      });
    });
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
                    <div className="text-[13px] sm:text-sm text-[#003946]/90 dark:text-cream/80 leading-relaxed break-words whitespace-pre-wrap">
                      {renderCommentContent(c.content)}
                    </div>
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
      <form 
        onSubmit={handleSubmit} 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative mt-auto flex items-end gap-2 px-4 py-4 border-t border-teal/10 dark:border-white/5 bg-white dark:bg-[#001f26] transition-colors ${isDraggingFile ? 'bg-teal/5 dark:bg-white/5 ring-2 ring-teal dark:ring-gold border-transparent' : ''}`}
      >
        {mentionQuery !== null && mentionUsers.length > 0 && (
          <div className="absolute bottom-[calc(100%+8px)] left-4 bg-white dark:bg-[#002b36] border border-teal/10 dark:border-white/10 rounded-xl shadow-lg p-1.5 flex flex-wrap max-w-[90%] gap-1 z-50">
            {mentionUsers.filter(u => u.name.toLowerCase().startsWith(mentionQuery.toLowerCase())).slice(0, 6).map(u => (
              <button
                key={u.name}
                type="button"
                onClick={() => {
                  const parts = newComment.split(/([\s\n]+)/); // preserve whitespace
                  parts.pop(); // remove the @... part
                  const newText = parts.join('') + '@' + u.name + ' ';
                  setNewComment(newText);
                  setMentionQuery(null);
                  textareaRef.current?.focus();
                }}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-teal/5 dark:bg-gold/10 text-teal dark:text-cream hover:bg-teal/10 dark:hover:bg-gold/20 transition-colors"
              >
                @{u.name}
              </button>
            ))}
            {mentionUsers.filter(u => u.name.toLowerCase().startsWith(mentionQuery.toLowerCase())).length === 0 && (
              <div className="px-2 py-1 text-xs text-teal/50 dark:text-cream/50">No matching users</div>
            )}
          </div>
        )}
        <div className="flex-1 flex flex-col gap-2">
          {attachment && (
            <div className="relative inline-block w-fit max-w-full group/preview">
              {attachment.url.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i) ? (
                <img src={attachment.url} alt="attachment preview" className="w-auto h-24 object-cover rounded-lg border border-teal/20 dark:border-white/10 shadow-sm" />
              ) : (
                <div className="w-auto min-w-[120px] h-24 p-3 flex flex-col items-center justify-center bg-teal/5 dark:bg-white/5 rounded-lg border border-teal/20 dark:border-white/10 text-teal/80 dark:text-cream/80 shadow-sm">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                  <span className="text-[10px] font-medium truncate w-full px-2 text-center max-w-[150px]">{attachment.name}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow-md transform transition-transform hover:scale-110 active:scale-95"
                title="Remove attachment"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
          )}
          <textarea
            ref={textareaRef}
            rows={1}
            value={newComment}
            onChange={(e) => {
              const val = e.target.value;
              setNewComment(val);
              const words = val.split(/[\s\n]+/);
              const lastWord = words[words.length - 1];
              if (lastWord.startsWith('@')) {
                setMentionQuery(lastWord.slice(1));
              } else {
                setMentionQuery(null);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            onPaste={handlePaste}
            placeholder="Write a comment…"
            className="w-full resize-none text-sm px-4 py-3 rounded-xl border border-teal/20 dark:border-white/10 bg-transparent text-teal dark:text-cream placeholder:text-teal/40 dark:placeholder:text-cream/30 focus:outline-none focus:border-teal dark:focus:border-cream transition-all max-h-[120px] scrollbar-thin"
          />
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          className="hidden" 
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="p-3 rounded-xl bg-teal/5 dark:bg-white/5 text-teal/70 dark:text-cream/70 hover:bg-teal/10 dark:hover:bg-white/10 hover:text-teal dark:hover:text-cream transition-all disabled:opacity-50 shrink-0"
          title="Attach file or photo"
        >
          {uploading ? (
            <div className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          )}
        </button>
        <button
          type="submit"
          disabled={(!newComment.trim() && !attachment) || submitting || uploading}
          className="p-3 rounded-xl bg-[#003946] dark:bg-teal-light text-white hover:bg-[#003946] dark:hover:bg-teal-lighter disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 shrink-0"
          title="Send comment"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

      {/* Full Screen Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl max-h-full flex flex-col justify-center items-center">
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gold transition-colors p-2"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <img 
              src={selectedImage} 
              alt="fullscreen attachment" 
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
      )}
    </div>
  );
};
