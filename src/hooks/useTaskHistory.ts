import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { WeeklyTask, DailyTask } from '../types';
import { getWeekDateRange, getWeekNumberFromDate } from '../utils/dateUtils';
import type { UnifiedTask } from './useWeeklyTasks';

export function useTaskHistory(internId: string | null, weekNumber: number | 'all') {
  const [tasks, setTasks] = useState<UnifiedTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!internId) {
      setTasks([]);
      return;
    }

    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      // LocalStorage fallback
      const storedWeekly = localStorage.getItem('padua_weekly_tasks');
      const storedDaily = localStorage.getItem('padua_daily_tasks');
      
      let parsedWeekly: WeeklyTask[] = storedWeekly ? JSON.parse(storedWeekly) : [];
      let parsedDaily: DailyTask[] = storedDaily ? JSON.parse(storedDaily) : [];

      // Filter for specific intern and Done status
      parsedWeekly = parsedWeekly.filter(t => t.intern_id === internId && t.status === 'Done');
      parsedDaily = parsedDaily.filter(t => t.intern_id === internId && t.status === 'Done');

      if (weekNumber !== 'all') {
        parsedWeekly = parsedWeekly.filter(t => t.week_number === weekNumber);
        
        const { startDate, endDate } = getWeekDateRange(weekNumber);
        parsedDaily = parsedDaily.filter(t => t.task_date >= startDate && t.task_date <= endDate);
      }

      const mappedWeekly = parsedWeekly.map(t => ({ ...t, type: 'weekly' } as UnifiedTask));
      
      // Attempt to assign week_number to daily tasks based on current filter or defaults
      const mappedDaily = parsedDaily.map(t => ({
        ...t,
        type: 'daily',
        week_number: weekNumber === 'all' ? (t.task_date ? getWeekNumberFromDate(t.task_date) : undefined) : weekNumber,
      } as unknown as UnifiedTask));

      const combined = [...mappedWeekly, ...mappedDaily].sort((a, b) => {
        // Sort by date completed if possible, otherwise alphabetically
        const dateA = a.task_date || (a as any).updated_at || '';
        const dateB = b.task_date || (b as any).updated_at || '';
        if (dateA && dateB) return dateA.localeCompare(dateB); // Ascending order
        return a.task_name.localeCompare(b.task_name);
      });

      setTasks(combined);
      setLoading(false);
      return;
    }

    try {
      let weeklyQuery = supabase
        .from('weekly_tasks')
        .select('*')
        .eq('intern_id', internId)
        .eq('status', 'Done');

      let dailyQuery = supabase
        .from('daily_tasks')
        .select('*')
        .eq('intern_id', internId)
        .eq('status', 'Done');

      if (weekNumber !== 'all') {
        weeklyQuery = weeklyQuery.eq('week_number', weekNumber);
        
        const { startDate, endDate } = getWeekDateRange(weekNumber);
        dailyQuery = dailyQuery.gte('task_date', startDate).lte('task_date', endDate);
      }

      const [weeklyRes, dailyRes] = await Promise.all([weeklyQuery, dailyQuery]);

      if (weeklyRes.error) throw weeklyRes.error;
      if (dailyRes.error) throw dailyRes.error;

      const mappedWeekly = (weeklyRes.data ?? []).map((t) => ({ ...t, type: 'weekly' } as UnifiedTask));
      const mappedDaily = (dailyRes.data ?? []).map((t) => ({
        ...t,
        type: 'daily',
        week_number: weekNumber === 'all' ? (t.task_date ? getWeekNumberFromDate(t.task_date) : undefined) : weekNumber,
      } as unknown as UnifiedTask));

      const combined = [...mappedWeekly, ...mappedDaily].sort((a, b) => {
        const dateA = a.task_date || (a as any).updated_at || (a as any).created_at || '';
        const dateB = b.task_date || (b as any).updated_at || (b as any).created_at || '';
        if (dateA && dateB) return dateA.localeCompare(dateB); // Ascending order
        return a.task_name.localeCompare(b.task_name);
      });

      setTasks(combined);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch task history';
      setError(message);
      console.error('Error fetching task history:', err);
    } finally {
      setLoading(false);
    }
  }, [internId, weekNumber]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { tasks, loading, error, refetch: fetchHistory };
}
