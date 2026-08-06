import React, { useState, useEffect, useRef } from 'react';
import { useTaskComments } from '../../hooks/useTaskComments';
import { useAuth } from '../../contexts/AuthContext';
import { useInterns } from '../../hooks/useInterns';
import { renderAvatar } from './AvatarIcons';
import { ConfirmModal } from '../common/ConfirmModal';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { sendNotification } from '../../hooks/useNotifications';

interface Props {
  taskId: string;
  taskName?: string;
  readOnly?: boolean;
}

export const TaskUpdates: React.FC<Props> = ({ taskId, taskName: _taskName, readOnly }) => {
  const { user, role } = useAuth();
  const { comments, loading, fetchComments, addComment, deleteComment, editComment, toggleLike } = useTaskComments(taskId);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Edit state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  const getLikesArray = (likes: any): string[] => {
    if (Array.isArray(likes)) return likes;
    if (typeof likes === 'string') {
      try { return JSON.parse(likes); } catch { return []; }
    }
    return [];
  };

  // Like, Pin, and Reply states
  const [pinnedComments, setPinnedComments] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('tp_pinned_comments') || '{}'); } catch { return {}; }
  });
  const replyInputRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});

  const handleToggleLike = async (commentId: string) => {
    const currentUser = localStorage.getItem('tp_avatar_name') || user?.email?.split('@')[0] || 'User';
    const { isLiked, authorName } = await toggleLike(commentId, currentUser);
    
    if (isLiked && authorName !== currentUser) {
      const authorUser = mentionUsers.find(u => u.name === authorName);
      if (authorUser?.email) {
        sendNotification(
          authorUser.email,
          'comment',
          'New Like',
          `${currentUser} liked your update`,
          { link: `/tasks/${taskId}` }
        );
      }
    }
  };

  const togglePin = (commentId: string) => {
    setPinnedComments(prev => {
      const next = { ...prev, [commentId]: !prev[commentId] };
      localStorage.setItem('tp_pinned_comments', JSON.stringify(next));
      return next;
    });
  };

  const [activeReply, setActiveReply] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyMentionQuery, setReplyMentionQuery] = useState<string | null>(null);

  const handleReplyClick = (commentId: string) => {
    setActiveReply(commentId);
    setReplyContent('');
    setReplyMentionQuery(null);
    setTimeout(() => {
      replyInputRefs.current[commentId]?.focus();
    }, 50);
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mention state
  const { interns } = useInterns();
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionUsers, setMentionUsers] = useState<{name: string, full_name: string, email: string}[]>([]);
  useEffect(() => {
    if (interns.length > 0 && !isSupabaseConfigured) {
      setMentionUsers(interns.map(i => ({ name: i.full_name, full_name: i.full_name, email: i.email })));
    }
  }, [interns]);

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [attachment, setAttachment] = useState<{ url: string; name: string } | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Reply Upload state
  const replyFileInputRef = useRef<HTMLInputElement>(null);
  const [replyUploading, setReplyUploading] = useState(false);
  const [replyAttachment, setReplyAttachment] = useState<{ url: string; name: string } | null>(null);

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

  const uploadReplyFile = async (file: File) => {
    if (!isSupabaseConfigured) {
      alert("Storage is not available in local demo mode.");
      return;
    }
    try {
      setReplyUploading(true);
      const fileExt = file.name ? file.name.split('.').pop() : 'png';
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('attachments').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('attachments').getPublicUrl(fileName);
      setReplyAttachment({ url: data.publicUrl, name: file.name || 'Pasted Image.png' });
    } catch (err: any) {
      console.error('Error uploading file:', err);
      alert(`Failed to upload file: ${err.message || err.toString()}`);
    } finally {
      setReplyUploading(false);
      if (replyFileInputRef.current) replyFileInputRef.current.value = '';
    }
  };

  const handleReplyFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadReplyFile(file);
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

  const handleReplyPaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          await uploadReplyFile(file);
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
      setMentionUsers([{ name: 'Admin', full_name: 'Admin', email: 'local' }, { name: 'Intern', full_name: 'Intern', email: 'local' }]);
      return;
    }
    const fetchUsers = async () => {
      try {
        const { data: p } = await supabase.from('profiles').select('username, full_name, email');
        const { data: i } = await supabase.from('interns').select('username, full_name, email');
        const all: {name: string, full_name: string, email: string}[] = [];
        const add = (u: any) => {
          if (!u.email) return;
          if (u.username) all.push({ name: u.username.replace(/\s+/g, ''), full_name: u.full_name || '', email: u.email });
          else if (u.full_name) all.push({ name: u.full_name.split(' ')[0], full_name: u.full_name, email: u.email });
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.dropdown-container')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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

  const sortedComments = [...comments].sort((a, b) => {
    const aPinned = pinnedComments[a.id];
    const bPinned = pinnedComments[b.id];
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  const topLevelComments = sortedComments.filter(c => !c.parent_id);
  const repliesByParent = sortedComments.filter(c => c.parent_id).reduce((acc, c) => {
    const parentId = c.parent_id!;
    if (!acc[parentId]) acc[parentId] = [];
    acc[parentId].push(c);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="flex flex-col h-full bg-transparent border-none shadow-none">
      {/* ── Editor Area (Top) ─────────────────────────────── */}
      {!readOnly && (
        <div className="flex gap-3 px-5 pt-4 pb-3">
          <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center mt-1 ${(localStorage.getItem('tp_avatar') !== null || localStorage.getItem('tp_avatar_url')) ? '[&_svg]:w-8 [&_svg]:h-8' : 'rounded-full overflow-hidden bg-[#003946]/10 dark:bg-white/10 text-xs font-bold text-[#003946] dark:text-cream'}`}>
          {localStorage.getItem('tp_avatar') !== null || localStorage.getItem('tp_avatar_url')
            ? renderAvatar(
                localStorage.getItem('tp_avatar') !== null ? Number(localStorage.getItem('tp_avatar')) : undefined, 
                localStorage.getItem('tp_avatar_url') || undefined
              )
            : (localStorage.getItem('tp_avatar_name') || user?.email?.split('@')[0] || 'U').charAt(0).toUpperCase()}
        </div>
        <form 
          onSubmit={handleSubmit} 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex-1 relative transition-colors ${isDraggingFile ? 'bg-teal/5 dark:bg-white/5 ring-2 ring-teal dark:ring-gold rounded-xl' : ''}`}
        >
          {/* Mention popup (below textarea for main editor) */}
          {mentionQuery !== null && mentionUsers.length > 0 && (
            <div className="absolute top-[calc(100%+4px)] left-0 bg-white dark:bg-[#002b36] border border-teal/10 dark:border-white/10 rounded-xl shadow-lg p-1.5 flex flex-wrap max-w-[90%] gap-1 z-50">
              {mentionUsers.filter(u => u.name.toLowerCase().startsWith(mentionQuery.toLowerCase()) || u.full_name.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 6).map(u => (
              <button
                key={u.name}
                type="button"
                onClick={() => {
                  const parts = newComment.split(/([\s\n]+)/);
                  parts.pop();
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
            {mentionUsers.filter(u => u.name.toLowerCase().startsWith(mentionQuery.toLowerCase()) || u.full_name.toLowerCase().includes(mentionQuery.toLowerCase())).length === 0 && (
              <div className="px-2 py-1 text-xs text-teal/50 dark:text-cream/50">No matching users</div>
            )}
          </div>
        )}

        {/* Text editor box */}
        <div className={`rounded-xl border ${isDraggingFile ? 'border-teal dark:border-gold' : 'border-teal/20 dark:border-white/10'} bg-white dark:bg-[#00151a] transition-colors`}>
          {/* Attachment preview inside the editor */}
          {attachment && (
            <div className="px-4 pt-3">
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
            </div>
          )}

          <textarea
            ref={textareaRef}
            rows={2}
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
            onPaste={handlePaste}
            placeholder="Write an update and mention others with @"
            className="w-full resize-none text-sm px-4 py-3 bg-transparent text-teal dark:text-cream placeholder:text-teal/40 dark:placeholder:text-cream/30 focus:outline-none max-h-[150px] scrollbar-thin"
          />

          {/* Action bar: icons left, Update button right */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-teal/10 dark:border-white/5">
            <div className="flex items-center gap-1">
              {/* @ Mention */}
              <button
                type="button"
                onClick={() => {
                  setNewComment(prev => prev + '@');
                  setMentionQuery('');
                  textareaRef.current?.focus();
                }}
                className="p-2 rounded-lg text-teal/50 dark:text-cream/40 hover:text-teal dark:hover:text-cream hover:bg-teal/5 dark:hover:bg-white/5 transition-colors"
                title="Mention someone"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
                </svg>
              </button>
              {/* Attach */}
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
                className="p-2 rounded-lg text-teal/50 dark:text-cream/40 hover:text-teal dark:hover:text-cream hover:bg-teal/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                title="Attach file or photo"
              >
                {uploading ? (
                  <div className="w-[18px] h-[18px] rounded-full border-2 border-current border-t-transparent animate-spin" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                )}
              </button>
            </div>

            {/* Update button */}
            <button
              type="submit"
              disabled={(!newComment.trim() && !attachment) || submitting || uploading}
              className="px-5 py-1.5 rounded-lg bg-[#003946] dark:bg-teal-light text-white text-sm font-bold hover:bg-[#004a5e] dark:hover:bg-teal-lighter disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {submitting ? 'Posting...' : 'Update'}
            </button>
          </div>
        </div>
      </form>
      </div>
      )}

      {/* ── Updates Feed (Scrollable) ─────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-teal/40 dark:text-cream/40">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm font-medium">Loading updates…</span>
            </div>
          </div>
        ) : comments.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="relative mb-6">
              {/* Chat bubble illustrations */}
              <div className="w-16 h-12 bg-teal/10 dark:bg-cream/10 rounded-xl flex items-center justify-center">
                <div className="w-8 h-1 bg-teal/20 dark:bg-cream/20 rounded-full mb-1" />
                <div className="w-6 h-1 bg-teal/15 dark:bg-cream/15 rounded-full" />
              </div>
              <div className="absolute -bottom-2 -right-3 w-12 h-10 bg-blue-500/15 dark:bg-blue-400/15 rounded-xl flex items-center justify-center">
                <span className="text-lg">😊</span>
              </div>
            </div>
            <h4 className="text-lg font-bold text-teal dark:text-cream mb-2">No updates yet</h4>
            <p className="text-sm text-teal/50 dark:text-cream/40 max-w-[280px] leading-relaxed">
              {readOnly 
                ? "No updates recorded on this task." 
                : <>Share progress, mention a teammate,<br/>or upload a file to get things moving</>}
            </p>
          </div>
        ) : (
          topLevelComments.map((c) => (
            <div key={c.id} className="group/comment flex flex-col mb-4 bg-white dark:bg-[#002b36] border border-teal/10 dark:border-white/10 rounded-xl overflow-visible shadow-sm">
              <div className="flex justify-between items-start p-4">
                <div className="flex gap-3">
                  {/* Avatar */}
                  <div
                    className={`
                      w-10 h-10 flex-shrink-0 flex items-center justify-center
                      ${c.avatar_index !== undefined ? '[&_svg]:w-10 [&_svg]:h-10' : 'rounded-full text-sm font-bold'}
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
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#003946] dark:text-cream">{c.author_name}</span>
                      <span className="text-[#003946]/50 dark:text-cream/50 text-sm">{formatTime(c.created_at)}</span>
                      {pinnedComments[c.id] && (
                        <svg className="text-gold w-3 h-3 ml-1" viewBox="0 0 24 24" fill="currentColor"><path d="M16 2v6l1 1v2h-4v9l-1 2-1-2v-9H7v-2l1-1V2h8zm-2 2h-4v4h4V4z"/></svg>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dropdown Menu */}
                {(role === 'admin' || c.author_name === (localStorage.getItem('tp_avatar_name') || user?.email?.split('@')[0] || 'User')) && (
                  <div className="relative dropdown-container">
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === c.id ? null : c.id)}
                      className="p-1 rounded-md text-[#003946]/50 dark:text-cream/50 hover:bg-teal/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="19" cy="12" r="1"></circle>
                        <circle cx="5" cy="12" r="1"></circle>
                      </svg>
                    </button>
                    {activeDropdown === c.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#002b36] border border-teal/10 dark:border-white/10 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                        <button
                          onClick={() => { startEdit(c.id, c.content); setActiveDropdown(null); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-[#003946] dark:text-cream hover:bg-teal/5 dark:hover:bg-white/5 flex items-center gap-2"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                          Edit update
                        </button>
                        <div className="h-px bg-teal/10 dark:bg-white/10 my-1" />
                        <button
                          onClick={() => { togglePin(c.id); setActiveDropdown(null); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-[#003946] dark:text-cream hover:bg-teal/5 dark:hover:bg-white/5 flex items-center gap-2"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 2v6l1 1v2h-4v9l-1 2-1-2v-9H7v-2l1-1V2h8z"></path></svg>
                          {pinnedComments[c.id] ? 'Unpin from top' : 'Pin to top'}
                        </button>
                        <div className="h-px bg-teal/10 dark:bg-white/10 my-1" />
                        <button
                          onClick={() => { setCommentToDelete(c.id); setActiveDropdown(null); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-status-hold hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                          Delete update
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="px-4 pb-4">
                {editingCommentId === c.id ? (
                  <div className="space-y-2 w-full">
                    <textarea
                      ref={(el) => {
                        if (el) {
                          el.style.height = 'auto';
                          el.style.height = `${el.scrollHeight}px`;
                        }
                      }}
                      autoFocus
                      value={editContent}
                      onChange={(e) => {
                        setEditContent(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') cancelEdit();
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleEditSubmit(c.id);
                        }
                      }}
                      className="w-full text-sm px-3 py-2.5 rounded-xl bg-white/80 dark:bg-black/30 border border-teal/20 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-gold text-teal dark:text-cream resize-none leading-relaxed overflow-hidden"
                      rows={1}
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
                  <div className="text-sm text-[#003946]/90 dark:text-cream/90 leading-relaxed break-words whitespace-pre-wrap">
                    {renderCommentContent(c.content)}
                  </div>
                )}
              </div>

              {/* Action Buttons (Like / Reply) */}
              {!readOnly && (
                <div className="border-t border-teal/10 dark:border-white/10 px-4 py-2 flex gap-4">
                  <button 
                  onClick={() => handleToggleLike(c.id)}
                  className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${getLikesArray(c.likes).includes(localStorage.getItem('tp_avatar_name') || user?.email?.split('@')[0] || 'User') ? 'text-blue-500' : 'text-[#003946]/50 dark:text-cream/50 hover:text-[#003946] dark:hover:text-cream'}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={getLikesArray(c.likes).includes(localStorage.getItem('tp_avatar_name') || user?.email?.split('@')[0] || 'User') ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                  Like {getLikesArray(c.likes).length > 0 && <span className="ml-0.5 opacity-80">{getLikesArray(c.likes).length}</span>}
                </button>
                <button 
                  onClick={() => handleReplyClick(c.id)}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#003946]/50 dark:text-cream/50 hover:text-[#003946] dark:hover:text-cream transition-colors"
                >
                  Reply
                </button>
              </div>
              )}

              {/* Nested Replies */}
              {repliesByParent[c.id] && repliesByParent[c.id].length > 0 && (
                <div className="px-4 pb-3 pt-1 space-y-4">
                  {repliesByParent[c.id].map(reply => (
                    <div key={reply.id} className="flex gap-3">
                      {/* Avatar */}
                      <div
                        className={`
                          w-8 h-8 flex-shrink-0 flex items-center justify-center mt-0.5
                          ${reply.avatar_index !== undefined ? '[&_svg]:w-8 [&_svg]:h-8' : 'rounded-full text-xs font-bold'}
                          ${reply.avatar_index !== undefined ? '' : (reply.author_role === 'admin'
                            ? 'bg-[#ebbc0f]/25 text-[#8a6d00] dark:text-gold'
                            : 'bg-[#003946]/10 text-[#003946]/70 dark:bg-white/10 dark:text-cream/60')}
                        `}
                      >
                        {reply.avatar_index !== undefined ? (
                          renderAvatar(reply.avatar_index, reply.avatar_url)
                        ) : (
                          reply.author_name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1">
                        {/* Gray Bubble & Dropdown */}
                        <div className="flex items-start gap-2 group/reply">
                          <div className="bg-slate-50 dark:bg-[#001f26] rounded-xl px-4 py-3 border border-teal/5 dark:border-white/5 shadow-sm inline-block min-w-[200px] max-w-full">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-[13px] text-[#003946] dark:text-cream">{reply.author_name}</span>
                              <span className="text-[#003946]/40 dark:text-cream/40 text-[11px]">{formatTime(reply.created_at)}</span>
                            </div>
                            
                            {editingCommentId === reply.id ? (
                              <div className="space-y-2 mt-2 w-full min-w-[250px]">
                                <textarea
                                  ref={(el) => {
                                    if (el) {
                                      el.style.height = 'auto';
                                      el.style.height = `${el.scrollHeight}px`;
                                    }
                                  }}
                                  autoFocus
                                  value={editContent}
                                  onChange={(e) => {
                                    setEditContent(e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = `${e.target.scrollHeight}px`;
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Escape') cancelEdit();
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleEditSubmit(reply.id);
                                    }
                                  }}
                                  className="w-full text-sm px-3 py-2.5 rounded-xl bg-white dark:bg-black/30 border border-teal/20 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-gold text-teal dark:text-cream resize-none leading-relaxed overflow-hidden"
                                  rows={1}
                                />
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => handleEditSubmit(reply.id)}
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
                              <div className="text-[13px] text-[#003946]/90 dark:text-cream/90 leading-relaxed break-words whitespace-pre-wrap">
                                {renderCommentContent(reply.content)}
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Reply Action */}
                        {!readOnly && (
                          <div className="flex gap-4 mt-2 ml-2">
                             <button 
                              onClick={() => handleReplyClick(c.id)}
                              className="flex items-center gap-1.5 text-[11px] font-bold text-[#003946]/50 dark:text-cream/50 hover:text-[#003946] dark:hover:text-cream transition-colors"
                            >
                              Reply
                            </button>
                            {(role === 'admin' || reply.author_name === (localStorage.getItem('tp_avatar_name') || user?.email?.split('@')[0] || 'User')) && editingCommentId !== reply.id && (
                              <>
                                <button
                                  onClick={() => startEdit(reply.id, reply.content)}
                                  className="flex items-center gap-1.5 text-[11px] font-bold text-[#003946]/50 dark:text-cream/50 hover:text-[#003946] dark:hover:text-cream transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => setCommentToDelete(reply.id)}
                                  className="flex items-center gap-1.5 text-[11px] font-bold text-[#003946]/50 dark:text-cream/50 hover:text-red-500 transition-colors"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Input Box */}
              {!readOnly && (
                <div className="border-t border-teal/10 dark:border-white/10 px-4 py-3 flex gap-3">
                  <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center mt-1 ${(localStorage.getItem('tp_avatar') !== null || localStorage.getItem('tp_avatar_url')) ? '[&_svg]:w-8 [&_svg]:h-8' : 'rounded-full overflow-hidden bg-[#003946]/10 dark:bg-white/10 text-xs font-bold text-[#003946] dark:text-cream'}`}>
                  {localStorage.getItem('tp_avatar') !== null || localStorage.getItem('tp_avatar_url')
                    ? renderAvatar(
                        localStorage.getItem('tp_avatar') !== null ? Number(localStorage.getItem('tp_avatar')) : undefined, 
                        localStorage.getItem('tp_avatar_url') || undefined
                      )
                    : (localStorage.getItem('tp_avatar_name') || user?.email?.split('@')[0] || 'U').charAt(0).toUpperCase()}
                </div>
                {activeReply === c.id ? (
                  <div className="flex-1 rounded-xl border border-teal dark:border-cream ring-1 ring-teal dark:ring-cream bg-transparent flex flex-col relative">
                    {replyMentionQuery !== null && mentionUsers.length > 0 && (
                      <div className="absolute bottom-[calc(100%+8px)] left-0 bg-white dark:bg-[#002b36] border border-teal/10 dark:border-white/10 rounded-xl shadow-lg p-1.5 flex flex-wrap max-w-[90%] gap-1 z-50">
                        {mentionUsers.filter(u => u.name.toLowerCase().startsWith(replyMentionQuery.toLowerCase()) || u.full_name.toLowerCase().includes(replyMentionQuery.toLowerCase())).slice(0, 6).map(u => (
                          <button
                            key={u.name}
                            type="button"
                            onClick={() => {
                              const parts = replyContent.split(/([\s\n]+)/);
                              parts.pop();
                              const newText = parts.join('') + '@' + u.name + ' ';
                              setReplyContent(newText);
                              setReplyMentionQuery(null);
                              replyInputRefs.current[c.id]?.focus();
                            }}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-teal/5 dark:bg-gold/10 text-teal dark:text-cream hover:bg-teal/10 dark:hover:bg-gold/20 transition-colors"
                          >
                            @{u.name}
                          </button>
                        ))}
                      </div>
                    )}
                    <textarea
                      ref={(el) => { replyInputRefs.current[c.id] = el; }}
                      placeholder="Write a reply..."
                      rows={2}
                      value={replyContent}
                      onPaste={handleReplyPaste}
                      onChange={(e) => {
                        const val = e.target.value;
                        setReplyContent(val);
                        const words = val.split(/[\s\n]+/);
                        const lastWord = words[words.length - 1];
                        if (lastWord.startsWith('@')) {
                          setReplyMentionQuery(lastWord.slice(1));
                        } else {
                          setReplyMentionQuery(null);
                        }
                      }}
                      className="w-full resize-none bg-transparent px-3 py-2 text-sm text-[#003946] dark:text-cream placeholder:text-[#003946]/50 dark:placeholder:text-cream/40 focus:outline-none rounded-xl"
                    />
                    <div className="flex items-center justify-between px-2 pb-2 mt-1">
                      <div className="flex items-center gap-0.5 text-[#003946]/50 dark:text-cream/50">
                        {/* Mention */}
                        <button 
                          type="button"
                          onClick={() => {
                            setReplyContent(prev => prev + '@');
                            setReplyMentionQuery('');
                            replyInputRefs.current[c.id]?.focus();
                          }}
                          className="p-1.5 hover:bg-teal/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/></svg>
                        </button>
                        {/* Attach */}
                        <input 
                          type="file" 
                          ref={replyFileInputRef} 
                          onChange={handleReplyFileUpload} 
                          className="hidden" 
                        />
                        <button 
                          type="button"
                          onClick={() => replyFileInputRef.current?.click()}
                          disabled={replyUploading}
                          className="p-1.5 hover:bg-teal/5 dark:hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {replyUploading ? (
                            <div className="w-[15px] h-[15px] rounded-full border-2 border-current border-t-transparent animate-spin" />
                          ) : (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                          )}
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          type="button" 
                          onClick={() => {
                            setActiveReply(null);
                            setReplyAttachment(null);
                          }}
                          className="text-xs font-bold text-[#003946]/50 dark:text-cream/50 hover:text-[#003946] dark:hover:text-cream transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          type="button"
                          disabled={(!replyContent.trim() && !replyAttachment) || replyUploading || submitting}
                          onClick={async () => {
                            if ((!replyContent.trim() && !replyAttachment) || replyUploading || submitting) return;
                            const authorName = localStorage.getItem('tp_avatar_name') || user?.email?.split('@')[0] || 'User';
                            const finalComment = replyAttachment 
                              ? (replyContent.trim() ? `${replyContent}\n\n${replyAttachment.url}` : replyAttachment.url)
                              : replyContent;
                            await addComment(finalComment, authorName, role || 'intern', undefined, c.id);
                            setReplyContent('');
                            setReplyAttachment(null);
                            setActiveReply(null);
                          }}
                          className="bg-[#0073ea] hover:bg-[#0060c2] text-white text-[13px] font-bold px-3 py-1.5 rounded transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => handleReplyClick(c.id)}
                    className="flex-1 rounded-full border border-teal/20 dark:border-white/20 px-4 py-2 text-xs text-[#003946]/50 dark:text-cream/40 flex items-center cursor-text hover:bg-teal/5 dark:hover:bg-white/5 transition-colors cursor-pointer h-[38px] mt-0.5"
                  >
                    Write a reply...
                  </div>
                )}
              </div>
              )}
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={commentToDelete !== null}
        title="Delete Update"
        message="Are you sure you want to delete this update? This action cannot be undone."
        confirmText="Delete Update"
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

