import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { sendNotification, removeNotificationByMetadata } from './useNotifications';
import { isPoolId, type DailyTask, type TaskStatus } from '../types';

/** Helper to get local date in YYYY-MM-DD format */
const getLocalToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Demo daily tasks */
const DEMO_DAILY_TASKS: DailyTask[] = [
  { id: 'dt-1', intern_id: 'demo-1', task_name: 'Review client onboarding checklist', status: 'Done', task_date: getLocalToday() },
  { id: 'dt-2', intern_id: 'demo-1', task_name: 'Prepare advisor meeting notes', status: 'In Progress', task_date: getLocalToday() },
  { id: 'dt-3', intern_id: 'demo-2', task_name: 'Update support documentation', status: 'Pending', task_date: getLocalToday() },
  { id: 'dt-4', intern_id: 'demo-3', task_name: 'Compile weekly financial report', status: 'In Progress', task_date: getLocalToday() },
  { id: 'dt-5', intern_id: 'demo-3', task_name: 'Process invoice batch #42', status: 'Done', task_date: getLocalToday() },
  { id: 'dt-6', intern_id: 'demo-4', task_name: 'Audit vendor contracts', status: 'On Hold', task_date: getLocalToday() },
  { id: 'dt-7', intern_id: 'demo-5', task_name: 'Draft client welcome email', status: 'Done', task_date: getLocalToday() },
  { id: 'dt-8', intern_id: 'demo-5', task_name: 'Schedule Q3 follow-up calls', status: 'Pending', task_date: getLocalToday() },
  { id: 'dt-9', intern_id: 'demo-6', task_name: 'Respond to client feedback survey', status: 'Acknowledge', task_date: getLocalToday() },
  { id: 'dt-10', intern_id: 'demo-7', task_name: 'Design social media banner', status: 'In Progress', task_date: getLocalToday() },
  { id: 'dt-11', intern_id: 'demo-7', task_name: 'Update brand guidelines PDF', status: 'Done', task_date: getLocalToday() },
  { id: 'dt-12', intern_id: 'demo-8', task_name: 'Create presentation templates', status: 'Pending', task_date: getLocalToday() },
];

export function useDailyTasks(date?: string) {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = getLocalToday();
  const targetDate = date ?? today;

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      const stored = localStorage.getItem('padua_daily_tasks');
      if (stored) {
        setTasks(JSON.parse(stored).filter((t: DailyTask) => t.task_date === targetDate || (t.status !== 'Done' && t.task_date < targetDate)));
      } else {
        setTasks(DEMO_DAILY_TASKS.filter((t) => t.task_date === targetDate || (t.status !== 'Done' && t.task_date < targetDate)));
        localStorage.setItem('padua_daily_tasks', JSON.stringify(DEMO_DAILY_TASKS));
      }
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('daily_tasks')
        .select('*')
        .or(`task_date.eq.${targetDate},and(status.neq.Done,task_date.lt.${targetDate})`)
        .order('order_index', { ascending: true })
        .order('task_name', { ascending: true });

      let { data, error: fetchError } = await query;

      if (fetchError && fetchError.message.includes('order_index')) {
        console.warn("order_index column is missing in daily_tasks. Falling back to fetching without order_index. Please run the SQL to add the column.");
        // Fallback if column doesn't exist
        const fallbackQuery = await supabase
          .from('daily_tasks')
          .select('*')
          .or(`task_date.eq.${targetDate},and(status.neq.Done,task_date.lt.${targetDate})`)
          .order('created_at', { ascending: true });
        data = fallbackQuery.data;
        fetchError = fallbackQuery.error;
        alert("Action Required: Please run the SQL command in your Supabase SQL Editor to add the 'order_index' column to the 'daily_tasks' table, otherwise task drag-and-drop ordering will not work. \n\nALTER TABLE daily_tasks ADD COLUMN order_index NUMERIC DEFAULT 0;");
      }

      if (fetchError) throw fetchError;
      setTasks(data ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch daily tasks';
      setError(message);
      console.error('Error fetching daily tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [targetDate]);

  useEffect(() => {
    fetchTasks();

    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel(`daily_tasks_changes_${Math.random().toString(36).substring(7)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_tasks' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newTask = payload.new as DailyTask;
            if (newTask.task_date === targetDate) {
              setTasks((prev) => {
                if (prev.some((t) => t.id === newTask.id)) return prev;
                return [...prev, newTask];
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedTask = payload.new as DailyTask;
            setTasks((prev) => {
              if (prev.some(t => t.id === updatedTask.id)) {
                return prev.map((t) => (t.id === updatedTask.id ? updatedTask : t));
              }
              return prev;
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id;
            if (deletedId) {
              setTasks((prev) => prev.filter((t) => t.id !== deletedId));
              // Allow the client that owns the notification (intern) to delete it when they receive the realtime task deletion event
              removeNotificationByMetadata('task_assigned', { task_id: deletedId });
              removeNotificationByMetadata('task_done', { task_id: deletedId });
              removeNotificationByMetadata('comment', { task_id: deletedId });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTasks, targetDate]);

  const toggleVerify = async (taskId: string, isVerified: boolean) => {
    if (!isSupabaseConfigured) {
      setTasks((prev) => {
        const next = prev.map((t) => (t.id === taskId ? { ...t, is_verified: isVerified } : t));
        const allStored = JSON.parse(localStorage.getItem('padua_daily_tasks') || '[]');
        const updatedStored = allStored.map((t: DailyTask) => t.id === taskId ? { ...t, is_verified: isVerified } : t);
        localStorage.setItem('padua_daily_tasks', JSON.stringify(updatedStored));
        return next;
      });
      return;
    }

    try {
      const { data, error: updateError } = await supabase
        .from('daily_tasks')
        .update({ is_verified: isVerified })
        .eq('id', taskId)
        .select();

      if (updateError) {
        const errorMsg = updateError.message.toLowerCase();
        if (errorMsg.includes("is_verified") && (errorMsg.includes("does not exist") || errorMsg.includes("schema cache"))) {
          alert("Database error: The 'is_verified' column is missing from the 'daily_tasks' table in your Supabase database. Please add a boolean column named 'is_verified' to fix this.");
        } else {
          alert(`Failed to verify task: ${updateError.message}`);
        }
        throw updateError;
      }
      
      if (!data || data.length === 0) {
        alert("Warning: The database update succeeded but 0 rows were affected. This usually means you don't have permission to update this specific task (RLS policy issue) or the task was deleted.");
        return; // Don't update local state if the db update failed
      }

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, is_verified: isVerified } : t))
      );
    } catch (err) {
      console.error('Error verifying task:', err);
    }
  };

  const addTask = useCallback(
    async (internId: string, taskName: string, emptyGapsCount: number = 0) => {
      const internTasks = tasks.filter(t => t.intern_id === internId);
      const maxOrder = internTasks.length > 0 ? Math.max(...internTasks.map(t => Number(t.order_index) || 0)) : 0;
      let currentOrderIndex = maxOrder + 1;

      // Get current user's name for pool tasks
      const isPool = isPoolId(internId);
      const creatorName = isPool ? (localStorage.getItem('tp_avatar_name') || 'Unknown') : undefined;

      const newTasksToInsert: Partial<DailyTask>[] = [];
      const tempIds: string[] = [];

      for (let i = 0; i < emptyGapsCount; i++) {
        tempIds.push(`dt-${Date.now()}-${i}`);
        newTasksToInsert.push({
          intern_id: internId,
          task_name: ' ', // Use a single space for blank tasks
          status: 'Pending',
          task_date: targetDate,
          order_index: currentOrderIndex++,
          ...(isPool && creatorName ? { created_by_name: creatorName } : {}),
        });
      }

      const actualTaskId = `dt-${Date.now()}-actual`;
      newTasksToInsert.push({
        intern_id: internId,
        task_name: taskName,
        status: 'Pending',
        task_date: targetDate,
        order_index: currentOrderIndex++,
        ...(isPool && creatorName ? { created_by_name: creatorName } : {}),
      });

      if (!isSupabaseConfigured) {
        setTasks((prev) => {
          const next = [...prev];
          const allStored = JSON.parse(localStorage.getItem('padua_daily_tasks') || '[]');
          
          newTasksToInsert.forEach((t, i) => {
            const newTask = { ...t, id: i === newTasksToInsert.length - 1 ? actualTaskId : tempIds[i] } as DailyTask;
            next.push(newTask);
            allStored.push(newTask);
          });
          
          localStorage.setItem('padua_daily_tasks', JSON.stringify(allStored));
          return next;
        });
        return { success: true };
      }

      try {
        const { data: userData } = await supabase.auth.getUser();
        
        // For pool tasks, resolve creator name from profile
        let resolvedCreatorName = creatorName;
        if (isPool && userData.user?.email) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('email', userData.user.email)
            .single();
          if (profile?.full_name) resolvedCreatorName = profile.full_name;
        }

        const tasksWithAdmin = newTasksToInsert.map(t => ({
          ...t,
          admin_id: userData.user?.id,
          ...(isPool && resolvedCreatorName ? { created_by_name: resolvedCreatorName } : {}),
        }));

        let { data, error: insertError } = await supabase
          .from('daily_tasks')
          .insert(tasksWithAdmin)
          .select();

        // Fallback: if insert fails (e.g. created_by_name column missing), retry without it
        if (insertError && isPool) {
          const tasksWithoutCreator = newTasksToInsert.map(t => ({
            ...t,
            admin_id: userData.user?.id,
          }));
          const retryResult = await supabase
            .from('daily_tasks')
            .insert(tasksWithoutCreator)
            .select();
          data = retryResult.data;
          insertError = retryResult.error;
        }

        if (insertError) throw insertError;
        if (data) {
          setTasks((prev) => {
            const next = [...prev, ...data];
            return next.sort((a, b) => (Number(a.order_index) || 0) - (Number(b.order_index) || 0));
          });

          // ── Auto-discover and notify intern about new task ──────────────────────
          if (taskName.trim()) {
            try {
              // Find the intern's email
              const { data: internData } = await supabase
                .from('interns')
                .select('email')
                .eq('id', internId)
                .single();
              
              const internEmail = internData?.email;

              // Find assigner's name
              let assignerName = 'An Admin';
              if (userData.user?.email) {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('full_name')
                  .eq('email', userData.user.email)
                  .single();
                if (profile?.full_name) {
                  assignerName = profile.full_name;
                }
              } else {
                assignerName = localStorage.getItem('tp_avatar_name') || assignerName;
              }

              // Only send a notification if the assigner is NOT the intern themselves
              if (internEmail && internEmail !== userData.user?.email) {
                console.log('[Notification Debug] Task Assigned. Intern to notify:', internEmail);
                sendNotification(
                  internEmail,
                  'task_assigned',
                  `${assignerName} assigned you a task`,
                  `"${taskName}" has been added to your daily tasks`,
                  { task_id: data?.[0]?.id, task_name: taskName, intern_id: internId }
                );
              } else if (!internEmail) {
                console.warn('[Notification Debug] Task Assigned. Could not find intern email for internId:', internId);
              }
            } catch (notifErr) {
              console.warn('Could not send task assignment notification:', notifErr);
            }
          }
        }
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add task';
        console.error('Error adding task:', err);
        alert(`Failed to add task: ${message}\n\nThis is likely a database permissions issue. Please check your Supabase Row Level Security (RLS) policies for the 'daily_tasks' table to ensure all authenticated users are allowed to insert tasks.`);
        return { success: false, error: message };
      }
    },
    [targetDate, tasks]
  );

  const updateStatus = useCallback(
    async (taskId: string, status: TaskStatus) => {
      if (!isSupabaseConfigured) {
        setTasks((prev) => {
          const next = prev.map((t) => (t.id === taskId ? { ...t, status, task_date: targetDate } : t));
          const allStored = JSON.parse(localStorage.getItem('padua_daily_tasks') || '[]');
          const updatedStored = allStored.map((t: DailyTask) => t.id === taskId ? { ...t, status, task_date: targetDate } : t);
          localStorage.setItem('padua_daily_tasks', JSON.stringify(updatedStored));
          return next;
        });
        return { success: true };
      }

      try {
        const { data, error: updateError } = await supabase
          .from('daily_tasks')
          .update({ status, task_date: targetDate })
          .eq('id', taskId)
          .select();

        if (updateError) throw updateError;
        
        if (!data || data.length === 0) {
          alert("Warning: Could not update status. 0 rows affected. Check your permissions (RLS).");
          return { success: false, error: 'Permission denied' };
        }

        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status, task_date: targetDate } : t))
        );

        // ── Auto-discover and send notifications ──────────
        if (status === 'Done') {
          try {
            const taskData = data[0];
            const taskName = taskData.task_name;
            const internId = taskData.intern_id;

            // Get current user to see who is doing the action
            const { data: authData } = await supabase.auth.getUser();
            const currentUserEmail = authData.user?.email;

            // Determine if current user is admin
            let isCurrentUserAdmin = false;
            let currentUserName = 'Someone';
            
            if (currentUserEmail) {
              const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('email', currentUserEmail).single();
              if (profile) {
                isCurrentUserAdmin = profile.role === 'admin';
                currentUserName = profile.full_name || currentUserName;
              }
            }

            // Find intern info
            const { data: internData } = await supabase
              .from('interns')
              .select('full_name, email')
              .eq('id', internId)
              .single();
            const internName = internData?.full_name || 'An intern';
            const internEmail = internData?.email;

            if (isCurrentUserAdmin) {
              // Admin marked it as Done -> Notify Intern
              if (internEmail) {
                sendNotification(
                  internEmail,
                  'task_done',
                  `${currentUserName} updated your task`,
                  `"${taskName}" has been marked as Done`,
                  { task_id: taskId, task_name: taskName }
                );
              }
            } else {
              // Intern marked it as Done -> Notify Admins
              const { data: admins } = await supabase
                .from('profiles')
                .select('email')
                .eq('role', 'admin');
              
              const adminEmails = (admins ?? []).map((a) => a.email).filter(Boolean);
              
              for (const adminEmail of adminEmails) {
                sendNotification(
                  adminEmail,
                  'task_done',
                  `${internName} completed a task`,
                  `"${taskName}" has been marked as Done`,
                  { task_id: taskId, task_name: taskName }
                );
              }
            }
          } catch (notifErr) {
            console.warn('Could not send task completion notification:', notifErr);
          }
        }

        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update status';
        console.error('Error updating task status:', err);
        return { success: false, error: message };
      }
    },
    [targetDate]
  );

  const removeTask = async (id: string) => {
    if (!isSupabaseConfigured) {
      setTasks((prev) => {
        const next = prev.filter(t => t.id !== id);
        const allStored = JSON.parse(localStorage.getItem('padua_daily_tasks') || '[]');
        localStorage.setItem('padua_daily_tasks', JSON.stringify(allStored.filter((t: DailyTask) => t.id !== id)));
        return next;
      });
      removeNotificationByMetadata('task_assigned', { task_id: id });
      removeNotificationByMetadata('task_done', { task_id: id });
      removeNotificationByMetadata('comment', { task_id: id });
      return;
    }

    try {
      const { error } = await supabase.from('daily_tasks').delete().eq('id', id);
      if (error) throw error;
      setTasks(prev => prev.filter(t => t.id !== id));
      removeNotificationByMetadata('task_assigned', { task_id: id });
      removeNotificationByMetadata('task_done', { task_id: id });
      removeNotificationByMetadata('comment', { task_id: id });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const editTask = async (taskId: string, newName: string) => {
    if (!isSupabaseConfigured) {
      setTasks((prev) => {
        const next = prev.map((t) => (t.id === taskId ? { ...t, task_name: newName } : t));
        const allStored = JSON.parse(localStorage.getItem('padua_daily_tasks') || '[]');
        const updatedStored = allStored.map((t: DailyTask) => t.id === taskId ? { ...t, task_name: newName } : t);
        localStorage.setItem('padua_daily_tasks', JSON.stringify(updatedStored));
        return next;
      });
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from('daily_tasks')
        .update({ task_name: newName })
        .eq('id', taskId);

      if (updateError) throw updateError;
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, task_name: newName } : t))
      );
    } catch (err: any) {
      console.error('Error renaming task:', err);
      setError(err.message);
    }
  };

  const reorderTasks = async (updates: { id: string, intern_id: string, order_index: number }[], newTasksState: DailyTask[]) => {
    // Optimistic update
    setTasks(newTasksState);
    if (!isSupabaseConfigured) {
      localStorage.setItem('padua_daily_tasks', JSON.stringify(newTasksState));
      return;
    }

    try {
      // Bulk update is not natively supported in supabase JS without RPC, 
      // so we do Promise.all for now.
      await Promise.all(
        updates.map(u => 
          supabase
            .from('daily_tasks')
            .update({ intern_id: u.intern_id, order_index: u.order_index })
            .eq('id', u.id)
        )
      );
    } catch (err) {
      console.error('Error reordering tasks:', err);
      // Revert optimism by refetching
      fetchTasks();
    }
  };

  return { tasks, loading, error, refetch: fetchTasks, addTask, updateStatus, toggleVerify, editTask, removeTask, reorderTasks };
}
