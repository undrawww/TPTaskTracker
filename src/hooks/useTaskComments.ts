import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export interface TaskComment {
  id: string;
  task_id: string;
  author_name: string;
  author_role: 'admin' | 'intern';
  content: string;
  created_at: string;
  avatar_index?: number;
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
      setComments(all.filter((c) => c.task_id === taskId));
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
      
      // Fetch avatars based on author_name
      if (commentsData.length > 0) {
        const names = Array.from(new Set(commentsData.map(c => c.author_name)));
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('full_name, avatar_index')
          .in('full_name', names);
          
        if (profilesData) {
          const avatarMap = new Map(profilesData.map(p => [p.full_name, p.avatar_index]));
          commentsData = commentsData.map(c => ({
            ...c,
            avatar_index: avatarMap.get(c.author_name) ?? undefined
          }));
        }
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
            
            // For real-time inserts, we can try to find the avatar from existing comments
            setComments((prev) => {
              if (prev.some((c) => c.id === newComment.id)) return prev;
              const existingAuthor = prev.find(c => c.author_name === newComment.author_name);
              if (existingAuthor && existingAuthor.avatar_index !== undefined) {
                newComment.avatar_index = existingAuthor.avatar_index;
              }
              return [...prev, newComment];
            });
          } else if (payload.eventType === 'DELETE') {
            setComments((prev) => prev.filter((c) => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId]);

  const addComment = useCallback(
    async (content: string, authorName: string, authorRole: 'admin' | 'intern') => {
      if (!content.trim()) return;

      if (!isSupabaseConfigured) {
        const newComment: TaskComment = {
          id: `tc-${Date.now()}`,
          task_id: taskId,
          author_name: authorName,
          author_role: authorRole,
          content: content.trim(),
          created_at: new Date().toISOString(),
        };
        const all = getStoredComments();
        all.push(newComment);
        saveStoredComments(all);
        setComments((prev) => [...prev, newComment]);
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
              content: content.trim(),
            },
          ])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          // Read local avatar index to show immediately
          const localAvatar = localStorage.getItem('tp_avatar');
          const commentWithAvatar: TaskComment = {
            ...data,
            avatar_index: localAvatar ? parseInt(localAvatar, 10) : undefined
          };
          setComments((prev) => [...prev, commentWithAvatar]);
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
        return;
      }

      try {
        const { error } = await supabase.from('task_comments').delete().eq('id', commentId);
        if (error) throw error;
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } catch (err) {
        console.error('Error deleting comment:', err);
      }
    },
    []
  );

  return { comments, loading, fetchComments, addComment, deleteComment };
}
