import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { WeeklyTask, TaskStatus } from '../types';

/** Demo weekly tasks */
const DEMO_WEEKLY_TASKS: WeeklyTask[] = [
  { id: 'wt-1', intern_id: 'demo-1', task_name: 'Complete advisor training module', status: 'Done', week_number: 1 },
  { id: 'wt-2', intern_id: 'demo-2', task_name: 'Shadow senior advisor sessions', status: 'In Progress', week_number: 1 },
  { id: 'wt-3', intern_id: 'demo-3', task_name: 'Learn accounting software basics', status: 'Done', week_number: 1 },
  { id: 'wt-4', intern_id: 'demo-4', task_name: 'Review procurement procedures', status: 'Pending', week_number: 1 },
  { id: 'wt-5', intern_id: 'demo-5', task_name: 'Study CRM platform workflows', status: 'In Progress', week_number: 1 },
  { id: 'wt-6', intern_id: 'demo-6', task_name: 'Analyze client retention data', status: 'On Hold', week_number: 1 },
  { id: 'wt-7', intern_id: 'demo-7', task_name: 'Create brand asset library', status: 'Done', week_number: 1 },
  { id: 'wt-8', intern_id: 'demo-8', task_name: 'Design newsletter template', status: 'Pending', week_number: 1 },
  { id: 'wt-9', intern_id: 'demo-1', task_name: 'Prepare advisor KPI dashboard', status: 'Pending', week_number: 2 },
  { id: 'wt-10', intern_id: 'demo-3', task_name: 'Reconcile monthly statements', status: 'In Progress', week_number: 2 },
  { id: 'wt-11', intern_id: 'demo-5', task_name: 'Draft client satisfaction survey', status: 'Acknowledge', week_number: 2 },
  { id: 'wt-12', intern_id: 'demo-7', task_name: 'Redesign landing page mockup', status: 'In Progress', week_number: 2 },
];

export function useWeeklyTasks(weekNumber: number) {
  const [tasks, setTasks] = useState<WeeklyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      const stored = localStorage.getItem('padua_weekly_tasks');
      if (stored) {
        setTasks(JSON.parse(stored).filter((t: WeeklyTask) => t.week_number === weekNumber));
      } else {
        setTasks(DEMO_WEEKLY_TASKS.filter((t) => t.week_number === weekNumber));
        localStorage.setItem('padua_weekly_tasks', JSON.stringify(DEMO_WEEKLY_TASKS));
      }
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('weekly_tasks')
        .select('*')
        .eq('week_number', weekNumber)
        .order('task_name', { ascending: true });

      if (fetchError) throw fetchError;
      setTasks(data ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch weekly tasks';
      setError(message);
      console.error('Error fetching weekly tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [weekNumber]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = useCallback(
    async (internId: string, taskName: string) => {
      if (!isSupabaseConfigured) {
        const newTask: WeeklyTask = {
          id: `wt-${Date.now()}`,
          intern_id: internId,
          task_name: taskName,
          status: 'Pending',
          week_number: weekNumber,
        };
        setTasks((prev) => {
          const next = [...prev, newTask];
          const allStored = JSON.parse(localStorage.getItem('padua_weekly_tasks') || '[]');
          localStorage.setItem('padua_weekly_tasks', JSON.stringify([...allStored, newTask]));
          return next;
        });
        return { success: true };
      }

      try {
        const { data: userData } = await supabase.auth.getUser();
        const { data, error: insertError } = await supabase
          .from('weekly_tasks')
          .insert([{
            intern_id: internId,
            task_name: taskName,
            status: 'Pending' as TaskStatus,
            week_number: weekNumber,
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
        const message = err instanceof Error ? err.message : 'Failed to add weekly task';
        console.error('Error adding weekly task:', err);
        return { success: false, error: message };
      }
    },
    [weekNumber]
  );

  const updateStatus = useCallback(
    async (taskId: string, status: TaskStatus) => {
      if (!isSupabaseConfigured) {
        setTasks((prev) => {
          const next = prev.map((t) => (t.id === taskId ? { ...t, status } : t));
          const allStored = JSON.parse(localStorage.getItem('padua_weekly_tasks') || '[]');
          const updatedStored = allStored.map((t: WeeklyTask) => t.id === taskId ? { ...t, status } : t);
          localStorage.setItem('padua_weekly_tasks', JSON.stringify(updatedStored));
          return next;
        });
        return { success: true };
      }

      try {
        const { error: updateError } = await supabase
          .from('weekly_tasks')
          .update({ status })
          .eq('id', taskId);

        if (updateError) throw updateError;
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status } : t))
        );
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update status';
        console.error('Error updating weekly task status:', err);
        return { success: false, error: message };
      }
    },
    []
  );

  return { tasks, loading, error, refetch: fetchTasks, addTask, updateStatus };
}
