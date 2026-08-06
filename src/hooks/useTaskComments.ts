import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { sendNotification, removeNotificationByMetadata } from './useNotifications';

export interface TaskComment {
  id: string;
  task_id: string;
  author_name: string;
  author_role: 'admin' | 'intern';
  content: string;
  created_at: string;
  avatar_index?: number;
  avatar_url?: string;
  likes?: string[];
  parent_id?: string;
}

/** Optional metadata to send notifications when comments are posted */
export interface CommentNotifyOptions {
  taskName: string;
  internEmail?: string;    // Email of the intern who owns the task
  adminEmails?: string[];  // Emails of admins to notify
}

const STORAGE_KEY = 'padua_task_comments';

function getStoredComments(): TaskComment[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveStoredComments(comments: TaskComment[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
}

export function useTaskComments(taskId: string) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    setLoading(true);

    if (!isSupabaseConfigured) {
      const all = getStoredComments();
      const mapped = all.filter((c) => c.task_id === taskId).map(c => {
        let parsedContent = c.content;
        let parent_id = c.parent_id;
        const match = parsedContent.match(/^\[reply:([a-zA-Z0-9-]+)\]\s*(.*)$/s);
        if (match) {
          parent_id = match[1];
          parsedContent = match[2];
        }
        return { ...c, content: parsedContent, parent_id };
      });
      setComments(mapped);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('task_comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      let commentsData = data ?? [];
      
      // Fetch avatars for all comment authors
      if (commentsData.length > 0) {
        const avatarMap = new Map<string, { index: number | null, url: string | null }>();

        // Fetch all profiles
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('full_name, username, avatar_index, avatar_url');
          
        if (profilesData) {
          profilesData.forEach(p => {
            if (p.full_name) avatarMap.set(p.full_name, { index: p.avatar_index, url: p.avatar_url });
            if (p.username) avatarMap.set(p.username, { index: p.avatar_index, url: p.avatar_url });
          });
        }

        // Fetch all interns
        const { data: internsData } = await supabase
          .from('interns')
          .select('full_name, username, avatar_index, avatar_url');
          
        if (internsData) {
          internsData.forEach(i => {
            // Only override if there's actually an avatar set
            if (i.avatar_index !== null || i.avatar_url !== null) {
              if (i.full_name) avatarMap.set(i.full_name, { index: i.avatar_index, url: i.avatar_url });
              if (i.username) avatarMap.set(i.username, { index: i.avatar_index, url: i.avatar_url });
            }
          });
        }

        commentsData = commentsData.map(c => {
          let parsedContent = c.content;
          let parent_id = c.parent_id;
          const match = parsedContent.match(/^\[reply:([a-zA-Z0-9-]+)\]\s*(.*)$/s);
          if (match) {
            parent_id = match[1];
            parsedContent = match[2];
          }

          const avatarData = avatarMap.get(c.author_name);
          if (avatarData && (avatarData.index !== null && avatarData.index !== undefined)) {
            return {
              ...c,
              content: parsedContent,
              parent_id,
              avatar_index: avatarData.index,
              avatar_url: avatarData.url ?? undefined
            };
          }
          return { ...c, content: parsedContent, parent_id, avatar_index: undefined, avatar_url: undefined };
        });
      }
      
      setComments(commentsData);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel(`task_comments_${taskId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_comments', filter: `task_id=eq.${taskId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newComment = payload.new as TaskComment;
            
            let parsedContent = newComment.content;
            let parent_id = newComment.parent_id;
            const match = parsedContent.match(/^\[reply:([a-zA-Z0-9-]+)\]\s*(.*)$/s);
            if (match) {
              parent_id = match[1];
              parsedContent = match[2];
            }
            newComment.content = parsedContent;
            newComment.parent_id = parent_id;

            // For real-time inserts, we can try to find the avatar from existing comments
            setComments((prev) => {
              if (prev.some((c) => c.id === newComment.id)) return prev;
              const existingAuthor = prev.find(c => c.author_name === newComment.author_name);
              if (existingAuthor) {
                if (existingAuthor.avatar_index !== undefined) newComment.avatar_index = existingAuthor.avatar_index;
                if (existingAuthor.avatar_url !== undefined) newComment.avatar_url = existingAuthor.avatar_url;
              }
              return [...prev, newComment];
            });
          } else if (payload.eventType === 'DELETE') {
            setComments((prev) => prev.filter((c) => c.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            const updatedComment = payload.new as TaskComment;
            
            let parsedContent = updatedComment.content;
            let parent_id = updatedComment.parent_id;
            const match = parsedContent.match(/^\[reply:([a-zA-Z0-9-]+)\]\s*(.*)$/s);
            if (match) {
              parent_id = match[1];
              parsedContent = match[2];
            }
            updatedComment.content = parsedContent;
            updatedComment.parent_id = parent_id;
            
            let updatedLikes = updatedComment.likes || [];
            if (typeof updatedComment.likes === 'string') {
               try { updatedLikes = JSON.parse(updatedComment.likes); } catch { updatedLikes = []; }
            }
            
            setComments((prev) =>
              prev.map((c) => (c.id === updatedComment.id ? { ...c, content: updatedComment.content, likes: updatedLikes } : c))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId]);

  const addComment = useCallback(
    async (content: string, authorName: string, authorRole: 'admin' | 'intern', notifyOptions?: CommentNotifyOptions, parentId?: string) => {
      if (!content.trim()) return;

      const finalContent = parentId ? `[reply:${parentId}] ${content.trim()}` : content.trim();

      const getSnippet = (text: string) => {
        const cleaned = text.trim().replace(/https:\/\/[^\s]+supabase\.co\/storage[^\s]+/g, '[Uploaded a photo]');
        return cleaned.length > 60 ? cleaned.substring(0, 60) + '…' : cleaned;
      };

      if (!isSupabaseConfigured) {
        const localAvatar = localStorage.getItem('tp_avatar');
        const localAvatarUrl = localStorage.getItem('tp_avatar_url');
        
        const newComment: TaskComment = {
          id: `tc-${Date.now()}`,
          task_id: taskId,
          author_name: authorName,
          author_role: authorRole,
          content: content.trim(),
          parent_id: parentId,
          created_at: new Date().toISOString(),
          avatar_index: localAvatar ? parseInt(localAvatar, 10) : undefined,
          avatar_url: localAvatarUrl || undefined
        };
        const localCommentToStore = { ...newComment, content: finalContent, parent_id: undefined };
        const all = getStoredComments();
        all.push(localCommentToStore);
        saveStoredComments(all);
        setComments((prev) => [...prev, newComment]);
        window.dispatchEvent(new CustomEvent('task-comments-changed', { detail: { taskId } }));

        // Local Mode Notifications
        const snippet = getSnippet(content);
        const taskName = notifyOptions?.taskName || "Task";
        
        const mentionMatches = content.match(/@([a-zA-Z0-9_]+)/gi);
        if (mentionMatches && mentionMatches.length > 0) {
          sendNotification('local', 'comment', `${authorName} mentioned you`, `"${snippet}" on task "${taskName}"`, { task_id: taskId, task_name: taskName });
        } else if (authorRole === 'intern') {
          sendNotification('local', 'comment', `${authorName} commented`, `"${snippet}" on task "${taskName}"`, { task_id: taskId, task_name: taskName });
        } else if (authorRole === 'admin') {
          sendNotification('local', 'comment', `${authorName} commented`, `"${snippet}" on your task "${taskName}"`, { task_id: taskId, task_name: taskName });
        }

        return;
      }

      try {
        const { data, error } = await supabase
          .from('task_comments')
          .insert([
            {
              task_id: taskId,
              author_name: authorName,
              author_role: authorRole,
              content: finalContent,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          // Read local avatar to show immediately
          const localAvatar = localStorage.getItem('tp_avatar');
          const localAvatarUrl = localStorage.getItem('tp_avatar_url');
          
          const commentWithAvatar: TaskComment = {
            ...data,
            content: content.trim(),
            parent_id: parentId,
            avatar_index: localAvatar ? parseInt(localAvatar, 10) : undefined,
            avatar_url: localAvatarUrl || undefined
          };
          setComments((prev) => [...prev, commentWithAvatar]);
          window.dispatchEvent(new CustomEvent('task-comments-changed', { detail: { taskId } }));

          // ── Auto-discover and send notifications ────────────
          const snippet = getSnippet(content);

          try {
            // Look up the task to get the intern_id and task_name
            const { data: taskData } = await supabase
              .from('daily_tasks')
              .select('task_name, intern_id')
              .eq('id', taskId)
              .single();

            if (taskData) {
              const taskName = notifyOptions?.taskName || taskData.task_name;
              const notifiedEmails = new Set<string>();

              // 1. Process Mentions
              const mentionMatches = content.match(/@([a-zA-Z0-9_]+)/gi);
              if (mentionMatches && mentionMatches.length > 0) {
                const mentionedNames = mentionMatches.map(m => m.slice(1).toLowerCase());
                
                // Fetch all profiles and interns safely (fallback if 'username' column is missing in Vercel)
                let profiles = [];
                let internsList = [];
                
                try {
                  const resP = await supabase.from('profiles').select('email, username, full_name');
                  if (resP.error) throw resP.error;
                  profiles = resP.data || [];
                } catch {
                  const fallbackP = await supabase.from('profiles').select('email, full_name');
                  profiles = fallbackP.data || [];
                }
                
                try {
                  const resI = await supabase.from('interns').select('email, username, full_name');
                  if (resI.error) throw resI.error;
                  internsList = resI.data || [];
                } catch {
                  const fallbackI = await supabase.from('interns').select('email, full_name');
                  internsList = fallbackI.data || [];
                }
                
                const mentionCheck = (u: { email?: string; username?: string; full_name?: string }) => {
                  if (!u.email) return;
                  const isMatch = 
                    (u.username && mentionedNames.includes(u.username.toLowerCase())) ||
                    (u.full_name && mentionedNames.includes(u.full_name.split(' ')[0].toLowerCase()));
                    
                  if (isMatch && !notifiedEmails.has(u.email)) {
                    notifiedEmails.add(u.email);
                    sendNotification(
                      u.email,
                      'comment',
                      `${authorName} mentioned you`,
                      `"${snippet}" on task "${taskName}"`,
                      { task_id: taskId, task_name: taskName }
                    );
                  }
                };
                
                profiles.forEach(mentionCheck);
                internsList.forEach(mentionCheck);
              }

              // 2. Default Notifications
              if (authorRole === 'intern') {
                // Intern commented → notify all admins
                const adminEmails = notifyOptions?.adminEmails;
                let emails: string[] = [];

                if (adminEmails && adminEmails.length > 0) {
                  emails = adminEmails;
                } else {
                  // Auto-discover admin emails
                  const { data: admins } = await supabase
                    .from('profiles')
                    .select('email')
                    .eq('role', 'admin');
                  emails = (admins ?? []).map((a) => a.email).filter(Boolean);
                }

                console.log('[Notification Debug] Intern commented. Admins to notify:', emails);

                for (const adminEmail of emails) {
                  if (!notifiedEmails.has(adminEmail)) {
                    notifiedEmails.add(adminEmail);
                    sendNotification(
                      adminEmail,
                      'comment',
                      `${authorName} commented`,
                      `"${snippet}" on task "${taskName}"`,
                      { task_id: taskId, task_name: taskName }
                    );
                  }
                }
              } else if (authorRole === 'admin') {
                // Admin commented → notify the intern who owns the task
                let internEmail = notifyOptions?.internEmail;

                if (!internEmail && taskData.intern_id) {
                  const { data: internData, error: internError } = await supabase
                    .from('interns')
                    .select('email')
                    .eq('id', taskData.intern_id)
                    .single();
                  
                  if (internError) {
                    console.error('[Notification Debug] Error fetching intern email:', internError);
                  }
                  internEmail = internData?.email;
                }

                console.log('[Notification Debug] Admin commented. Intern to notify:', internEmail);

                if (internEmail && !notifiedEmails.has(internEmail)) {
                  notifiedEmails.add(internEmail);
                  sendNotification(
                    internEmail,
                    'comment',
                    `${authorName} commented`,
                    `"${snippet}" on your task "${taskName}"`,
                    { task_id: taskId, task_name: taskName }
                  );
                }
              }
            } else {
              console.warn('[Notification Debug] Task data not found for ID:', taskId);
            }
          } catch (notifErr) {
            // Don't block comment posting if notification fails
            console.warn('Could not send comment notification:', notifErr);
          }
        }
      } catch (err) {
        console.error('Error adding comment:', err);
      }
    },
    [taskId]
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      if (!isSupabaseConfigured) {
        const all = getStoredComments().filter((c) => c.id !== commentId);
        saveStoredComments(all);
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        window.dispatchEvent(new CustomEvent('task-comments-changed', { detail: { taskId } }));
        removeNotificationByMetadata('comment', { task_id: taskId });
        return;
      }

      try {
        const { error } = await supabase.from('task_comments').delete().eq('id', commentId);
        if (error) throw error;
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        window.dispatchEvent(new CustomEvent('task-comments-changed', { detail: { taskId } }));
        removeNotificationByMetadata('comment', { task_id: taskId });
      } catch (err) {
        console.error('Error deleting comment:', err);
      }
    },
    [taskId]
  );

  const editComment = useCallback(
    async (commentId: string, newContent: string) => {
      if (!newContent.trim()) return;

      if (!isSupabaseConfigured) {
        const all = getStoredComments();
        const updatedAll = all.map(c => c.id === commentId ? { ...c, content: newContent.trim() } : c);
        saveStoredComments(updatedAll);
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, content: newContent.trim() } : c))
        );
        return;
      }

      try {
        const { error } = await supabase
          .from('task_comments')
          .update({ content: newContent.trim() })
          .eq('id', commentId);

        if (error) throw error;
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, content: newContent.trim() } : c))
        );
      } catch (err) {
        console.error('Error updating comment:', err);
      }
    },
    []
  );

  const toggleLike = useCallback(
    async (commentId: string, currentUser: string) => {
      // Find comment first to calculate next state
      const comment = comments.find((c) => c.id === commentId);
      if (!comment) return { isLiked: false, nextLikes: [], authorName: '' };

      const authorName = comment.author_name;
      let currentLikes: string[] = [];
      if (Array.isArray(comment.likes)) currentLikes = comment.likes;
      else if (typeof comment.likes === 'string') {
        try { currentLikes = JSON.parse(comment.likes); } catch { currentLikes = []; }
      }

      const isLiked = currentLikes.includes(currentUser);
      const nextLikes = isLiked
        ? currentLikes.filter((u) => u !== currentUser)
        : [...currentLikes, currentUser];

      // Optimistic update
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, likes: nextLikes } : c))
      );

      if (!isSupabaseConfigured) {
        const all = getStoredComments();
        const updatedAll = all.map((c) =>
          c.id === commentId ? { ...c, likes: nextLikes } : c
        );
        saveStoredComments(updatedAll);
      } else {
        try {
          const { error } = await supabase
            .from('task_comments')
            .update({ likes: nextLikes })
            .eq('id', commentId);

          if (error) throw error;
        } catch (err) {
          console.error('Error toggling like:', err);
        }
      }

      return { isLiked: !isLiked, nextLikes, authorName };
    },
    [comments]
  );

  return { comments, loading, fetchComments, addComment, deleteComment, editComment, toggleLike };
}
