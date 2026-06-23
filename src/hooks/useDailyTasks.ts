import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { DailyTask, TaskStatus } from '../types';

/** Demo daily tasks */
const DEMO_DAILY_TASKS: DailyTask[] = [
  { id: 'dt-1', intern_id: 'demo-1', task_name: 'Review client onboarding checklist', status: 'Done', task_date: new Date().toISOString().split('T')[0] },
  { id: 'dt-2', intern_id: 'demo-1', task_name: 'Prepare advisor meeting notes', status: 'In Progress', task_date: new Date().toISOString().split('T')[0] },
  { id: 'dt-3', intern_id: 'demo-2', task_name: 'Update support documentation', status: 'Pending', task_date: new Date().toISOString().split('T')[0] },
  { id: 'dt-4', intern_id: 'demo-3', task_name: 'Compile weekly financial report', status: 'In Progress', task_date: new Date().toISOString().split('T')[0] },
  { id: 'dt-5', intern_id: 'demo-3', task_name: 'Process invoice batch #42', status: 'Done', task_date: new Date().toISOString().split('T')[0] },
  { id: 'dt-6', intern_id: 'demo-4', task_name: 'Audit vendor contracts', status: 'On Hold', task_date: new Date().toISOString().split('T')[0] },
  { id: 'dt-7', intern_id: 'demo-5', task_name: 'Draft client welcome email', status: 'Done', task_date: new Date().toISOString().split('T')[0] },
  { id: 'dt-8', intern_id: 'demo-5', task_name: 'Schedule Q3 follow-up calls', status: 'Pending', task_date: new Date().toISOString().split('T')[0] },
  { id: 'dt-9', intern_id: 'demo-6', task_name: 'Respond to client feedback survey', status: 'Acknowledge', task_date: new Date().toISOString().split('T')[0] },
  { id: 'dt-10', intern_id: 'demo-7', task_name: 'Design social media banner', status: 'In Progress', task_date: new Date().toISOString().split('T')[0] },
  { id: 'dt-11', intern_id: 'demo-7', task_name: 'Update brand guidelines PDF', status: 'Done', task_date: new Date().toISOString().split('T')[0] },
  { id: 'dt-12', intern_id: 'demo-8', task_name: 'Create presentation templates', status: 'Pending', task_date: new Date().toISOString().split('T')[0] },
];

export function useDailyTasks(date?: string) {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const targetDate = date ?? today;

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      const stored = localStorage.getItem('padua_daily_tasks');
      if (stored) {
        setTasks(JSON.parse(stored).filter((t: DailyTask) => t.task_date === targetDate));
      } else {
        setTasks(DEMO_DAILY_TASKS.filter((t) => t.task_date === targetDate));
        localStorage.setItem('padua_daily_tasks', JSON.stringify(DEMO_DAILY_TASKS));
      }
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('task_date', targetDate)
        .order('task_name', { ascending: true });

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
  }, [fetchTasks]);

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
      const { error: updateError } = await supabase
        .from('daily_tasks')
        .update({ is_verified: isVerified })
        .eq('id', taskId);

      if (updateError) {
        if (updateError.message.includes("column \"is_verified\" of relation \"daily_tasks\" does not exist")) {
          alert("Database error: The 'is_verified' column is missing from the 'daily_tasks' table in your Supabase database. Please add a boolean column named 'is_verified' to fix this.");
        } else {
          alert(`Failed to verify task: ${updateError.message}`);
        }
        throw updateError;
      }

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, is_verified: isVerified } : t))
      );
    } catch (err) {
      console.error('Error verifying task:', err);
    }
  };

  const addTask = useCallback(
    async (internId: string, taskName: string) => {
      if (!isSupabaseConfigured) {
        const newTask: DailyTask = {
          id: `dt-${Date.now()}`,
          intern_id: internId,
          task_name: taskName,
          status: 'Pending',
          task_date: targetDate,
        };
        setTasks((prev) => {
          const next = [...prev, newTask];
          const allStored = JSON.parse(localStorage.getItem('padua_daily_tasks') || '[]');
          localStorage.setItem('padua_daily_tasks', JSON.stringify([...allStored, newTask]));
          return next;
        });
        return { success: true };
      }

      try {
        const { data: userData } = await supabase.auth.getUser();
        const { data, error: insertError } = await supabase
          .from('daily_tasks')
          .insert([{
            intern_id: internId,
            task_name: taskName,
            status: 'Pending' as TaskStatus,
            task_date: targetDate,
            admin_id: userData.user?.id
          }])
          .select()
          .single();

        if (insertError) throw insertError;
        if (data) {
          setTasks((prev) => [...prev, data]);
        }
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add task';
        console.error('Error adding task:', err);
        return { success: false, error: message };
      }
    },
    [targetDate]
  );

  const updateStatus = useCallback(
    async (taskId: string, status: TaskStatus) => {
      if (!isSupabaseConfigured) {
        setTasks((prev) => {
          const next = prev.map((t) => (t.id === taskId ? { ...t, status } : t));
          const allStored = JSON.parse(localStorage.getItem('padua_daily_tasks') || '[]');
          const updatedStored = allStored.map((t: DailyTask) => t.id === taskId ? { ...t, status } : t);
          localStorage.setItem('padua_daily_tasks', JSON.stringify(updatedStored));
          return next;
        });
        return { success: true };
      }

      try {
        const { error: updateError } = await supabase
          .from('daily_tasks')
          .update({ status })
          .eq('id', taskId);

        if (updateError) throw updateError;
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status } : t))
        );
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update status';
        console.error('Error updating task status:', err);
        return { success: false, error: message };
      }
    },
    []
  );

  const removeTask = async (id: string) => {
    if (!isSupabaseConfigured) {
      setTasks((prev) => {
        const next = prev.filter(t => t.id !== id);
        const allStored = JSON.parse(localStorage.getItem('padua_daily_tasks') || '[]');
        localStorage.setItem('padua_daily_tasks', JSON.stringify(allStored.filter((t: DailyTask) => t.id !== id)));
        return next;
      });
      return;
    }

    try {
      const { error } = await supabase.from('daily_tasks').delete().eq('id', id);
      if (error) throw error;
      setTasks(prev => prev.filter(t => t.id !== id));
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

  return { tasks, loading, error, refetch: fetchTasks, addTask, updateStatus, toggleVerify, editTask, removeTask };
}
