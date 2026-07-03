import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export interface Notification {
  id: string;
  recipient_email: string;
  type: 'comment' | 'feedback' | 'task_done' | 'task_assigned';
  title: string;
  message: string;
  is_read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

const STORAGE_KEY = 'padua_notifications';

function getStoredNotifications(): Notification[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveStoredNotifications(notifications: Notification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const email = user?.email ?? '';

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // ── Fetch notifications ─────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!email) {
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      const stored = getStoredNotifications().filter((n) => n.recipient_email === email);
      setNotifications(stored.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_email', email)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        // Table might not exist yet — fail silently
        if (error.message.includes('relation') || error.code === '42P01') {
          console.warn('Notifications table does not exist yet. Run the SQL to create it.');
          setLoading(false);
          return;
        }
        throw error;
      }

      setNotifications((data as Notification[]) ?? []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [email]);

  // ── Initial fetch + realtime subscription ───────────────────────
  useEffect(() => {
    fetchNotifications();

    if (!isSupabaseConfigured || !email) return;

    const channel = supabase
      .channel(`notifications_${email.replace(/[^a-zA-Z0-9]/g, '_')}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_email=eq.${email}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => {
            if (prev.some((n) => n.id === newNotif.id)) return prev;
            return [newNotif, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_email=eq.${email}`,
        },
        (payload) => {
          const updated = payload.new as Notification;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n))
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const deletedId = payload.old?.id;
          if (deletedId) {
            setNotifications((prev) => prev.filter((n) => n.id !== deletedId));
          }
        }
      )
      .subscribe();

    // Local storage event listener for demo mode
    const handleLocalChange = () => fetchNotifications();
    window.addEventListener('notification-change', handleLocalChange);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('notification-change', handleLocalChange);
    };
  }, [fetchNotifications, email]);

  // ── Mark a single notification as read ──────────────────────────
  const markAsRead = useCallback(async (id: string) => {
    if (!isSupabaseConfigured) {
      const all = getStoredNotifications();
      const updated = all.map((n) => (n.id === id ? { ...n, is_read: true } : n));
      saveStoredNotifications(updated);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      return;
    }

    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  // ── Mark all as read ────────────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    if (!email) return;

    if (!isSupabaseConfigured) {
      const all = getStoredNotifications();
      const updated = all.map((n) => (n.recipient_email === email ? { ...n, is_read: true } : n));
      saveStoredNotifications(updated);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      return;
    }

    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_email', email)
        .eq('is_read', false);

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, [email]);

  // ── Clear all notifications ─────────────────────────────────────
  const clearAll = useCallback(async () => {
    if (!email) return;

    if (!isSupabaseConfigured) {
      const all = getStoredNotifications().filter((n) => n.recipient_email !== email);
      saveStoredNotifications(all);
      setNotifications([]);
      return;
    }

    try {
      await supabase.from('notifications').delete().eq('recipient_email', email);
      setNotifications([]);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  }, [email]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    clearAll,
    refetch: fetchNotifications,
  };
}

// ── Helper: Send a notification ───────────────────────────────────
// This is called from other hooks to create notifications
export async function sendNotification(
  recipientEmail: string,
  type: 'comment' | 'feedback' | 'task_done' | 'task_assigned',
  title: string,
  message: string,
  metadata: Record<string, unknown> = {}
) {
  if (!recipientEmail) return;

  const notification: Notification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    recipient_email: recipientEmail,
    type,
    title,
    message,
    is_read: false,
    metadata,
    created_at: new Date().toISOString(),
  };

  if (!isSupabaseConfigured) {
    const all = getStoredNotifications();
    all.push(notification);
    saveStoredNotifications(all);
    // Dispatch a custom event so the hook re-fetches
    window.dispatchEvent(new Event('notification-change'));
    return;
  }

  try {
    await supabase.from('notifications').insert({
      recipient_email: recipientEmail,
      type,
      title,
      message,
      metadata,
    });
  } catch (err) {
    console.error('Error sending notification:', err);
  }
}

export async function removeNotificationByMetadata(
  type: string,
  metadataMatches: Record<string, unknown>
) {
  if (!isSupabaseConfigured) {
    let all = getStoredNotifications();
    all = all.filter((n) => {
      if (n.type !== type) return true;
      for (const key in metadataMatches) {
        if (n.metadata[key] !== metadataMatches[key]) return true;
      }
      return false; // remove
    });
    saveStoredNotifications(all);
    window.dispatchEvent(new Event('notification-change'));
    return;
  }

  try {
    // Fetch notifications of this type. RLS will automatically restrict this to what the user can see.
    const { data, error } = await supabase
      .from('notifications')
      .select('id, metadata')
      .eq('type', type);

    if (error) throw error;
    if (!data) return;

    const toDelete = data
      .filter((n) => {
        if (!n.metadata) return false;
        
        // Handle both JSONB and stringified JSON just in case
        let meta = n.metadata as any;
        if (typeof meta === 'string') {
          try {
            meta = JSON.parse(meta);
          } catch (e) {
            return false;
          }
        }

        for (const key in metadataMatches) {
          if (meta[key] !== metadataMatches[key]) return false;
        }
        return true;
      })
      .map((n) => n.id);

    if (toDelete.length > 0) {
      await supabase.from('notifications').delete().in('id', toDelete);
      window.dispatchEvent(new Event('notification-change'));
    }
  } catch (err) {
    console.error('Error removing notification by metadata:', err);
  }
}
