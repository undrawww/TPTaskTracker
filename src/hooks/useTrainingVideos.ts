import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export interface TrainingVideo {
  id: string;
  title: string;
  url: string;
  thumbnail_url: string | null;
  created_at: string;
}

export interface VideoCompletion {
  video_id: string;
  user_id: string;
  completed_at: string;
  // Joined profile data
  full_name?: string;
  avatar_index?: number;
  avatar_url?: string;
}

export function useTrainingVideos() {
  const { session } = useAuth();
  const [videos, setVideos] = useState<TrainingVideo[]>([]);
  const [completions, setCompletions] = useState<VideoCompletion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVideos = useCallback(async () => {
    const { data, error } = await supabase
      .from('training_videos')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && data) {
      setVideos(data);
    }
  }, []);

  const fetchCompletions = useCallback(async () => {
    // Fetch completions with user profile info
    const { data, error } = await supabase
      .from('video_completions')
      .select('video_id, user_id, completed_at');

    if (error || !data) return;

    // Fetch profile info for all users who completed videos
    const userIds = [...new Set(data.map(c => c.user_id))];
    if (userIds.length === 0) {
      setCompletions([]);
      return;
    }

    // Get from profiles table
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_index, avatar_url')
      .in('id', userIds);

    // Get from interns table for avatar fallback
    const { data: interns } = await supabase
      .from('interns')
      .select('email, full_name, avatar_index, avatar_url');

    // Build a map of user_id -> profile data
    const profileMap = new Map<string, { full_name: string; avatar_index: number; avatar_url?: string }>();

    // First populate from profiles
    if (profiles) {
      for (const p of profiles) {
        profileMap.set(p.id, {
          full_name: p.full_name || 'Unknown',
          avatar_index: p.avatar_index ?? 0,
          avatar_url: p.avatar_url,
        });
      }
    }

    // Then try to fill in from interns (match by email via auth)
    // We already have user_ids, try to match profiles' emails with interns
    if (interns && profiles) {
      for (const profile of profiles) {
        const existing = profileMap.get(profile.id);
        if (existing && (!existing.avatar_index && existing.avatar_index !== 0)) {
          // Try to find matching intern
          const intern = interns.find(i => i.full_name === existing.full_name);
          if (intern) {
            existing.avatar_index = intern.avatar_index ?? 0;
            if (intern.avatar_url) existing.avatar_url = intern.avatar_url;
          }
        }
      }
    }

    const enrichedCompletions: VideoCompletion[] = data.map(c => {
      const profile = profileMap.get(c.user_id);
      return {
        ...c,
        full_name: profile?.full_name || 'Unknown',
        avatar_index: profile?.avatar_index ?? 0,
        avatar_url: profile?.avatar_url,
      };
    });

    setCompletions(enrichedCompletions);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchVideos(), fetchCompletions()]);
    setLoading(false);
  }, [fetchVideos, fetchCompletions]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();

    // Subscribe to realtime completion updates
    const channel = supabase
      .channel('video_completions_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'video_completions' },
        () => {
          fetchCompletions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadAll, fetchCompletions]);

  // Check if current user has completed a video
  const hasCompleted = useCallback((videoId: string): boolean => {
    if (!session?.user?.id) return false;
    return completions.some(c => c.video_id === videoId && c.user_id === session.user.id);
  }, [completions, session]);

  // Get completions for a specific video
  const getVideoCompletions = useCallback((videoId: string): VideoCompletion[] => {
    return completions.filter(c => c.video_id === videoId);
  }, [completions]);

  // Mark video as watched
  const markAsWatched = useCallback(async (videoId: string) => {
    if (!session?.user?.id) return;

    const { error } = await supabase
      .from('video_completions')
      .insert({ video_id: videoId, user_id: session.user.id });

    if (!error) {
      await fetchCompletions();
    }
  }, [session, fetchCompletions]);

  // Undo watched status
  const unmarkAsWatched = useCallback(async (videoId: string) => {
    if (!session?.user?.id) return;

    const { error } = await supabase
      .from('video_completions')
      .delete()
      .eq('video_id', videoId)
      .eq('user_id', session.user.id);

    if (!error) {
      await fetchCompletions();
    }
  }, [session, fetchCompletions]);

  // Add a new video (admin only)
  const addVideo = useCallback(async (title: string, url: string) => {
    if (!session?.user?.id) return;

    // Extract YouTube thumbnail
    let thumbnail_url: string | null = null;
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) {
      thumbnail_url = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
    }

    const { error } = await supabase
      .from('training_videos')
      .insert({ title, url, thumbnail_url, created_by: session.user.id });

    if (!error) {
      await fetchVideos();
    }
  }, [session, fetchVideos]);

  // Delete a video (admin only)
  const deleteVideo = useCallback(async (videoId: string) => {
    const { error } = await supabase
      .from('training_videos')
      .delete()
      .eq('id', videoId);

    if (!error) {
      await loadAll();
    }
  }, [loadAll]);

  return {
    videos,
    loading,
    hasCompleted,
    getVideoCompletions,
    markAsWatched,
    unmarkAsWatched,
    addVideo,
    deleteVideo,
    refresh: loadAll,
  };
}
