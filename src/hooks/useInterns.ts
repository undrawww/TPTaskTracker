import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { Intern, Department } from '../types';

/** Demo data shown when Supabase is not configured */
const MOCK_INTERNS: Intern[] = [
  { id: '1', full_name: 'Ana Santos', department: 'Advisor Support Associate', email: 'ana@example.com' },
  { id: '2', full_name: 'Marco Reyes', department: 'Advisor Support Associate', email: 'marco@example.com' },
  { id: '3', full_name: 'Sofia Garcia', department: 'Business Support Associate', email: 'sofia@example.com' },
  { id: '4', full_name: 'David Lee', department: 'Business Support Associate', email: 'david@example.com' },
  { id: '5', full_name: 'Elena Cruz', department: 'Client Relations Associate', email: 'elena@example.com' },
  { id: '6', full_name: 'James Wilson', department: 'Client Relations Associate', email: 'james@example.com' },
  { id: '7', full_name: 'Maria Torres', department: 'Design Content Associate', email: 'maria@example.com' },
  { id: '8', full_name: 'John Chen', department: 'Design Content Associate', email: 'john@example.com' },
];

export function useInterns() {
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInterns = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      const stored = localStorage.getItem('padua_interns');
      if (stored) {
        setInterns(JSON.parse(stored));
      } else {
        setInterns(MOCK_INTERNS);
        localStorage.setItem('padua_interns', JSON.stringify(MOCK_INTERNS));
      }
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('interns')
        .select('*')
        .order('order_index', { ascending: true, nullsFirst: false })
        .order('full_name', { ascending: true });

      let { data, error: fetchError } = await query;

      if (fetchError && fetchError.message.includes('order_index')) {
        console.warn("order_index column is missing. Falling back to fetching without order_index. Please run the SQL to add the column.");
        // Fallback if column doesn't exist
        const fallbackQuery = await supabase
          .from('interns')
          .select('*')
          .order('full_name', { ascending: true });
        data = fallbackQuery.data;
        fetchError = fallbackQuery.error;
        alert("Action Required: Please run the SQL command in your Supabase SQL Editor to add the 'order_index' column to the 'interns' table, otherwise drag-and-drop ordering will not work. \n\nALTER TABLE interns ADD COLUMN order_index NUMERIC DEFAULT 0;");
      }

      if (fetchError) throw fetchError;
      
      const internsData = data ?? [];
      
      // Fetch avatar indexes from profiles
      if (internsData.length > 0) {
        const emails = internsData.map(i => i.email);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('email, avatar_index')
          .in('email', emails);
          
        if (profilesData) {
          const avatarMap = new Map(profilesData.map(p => [p.email, p.avatar_index]));
          internsData.forEach(i => {
            i.avatar_index = avatarMap.get(i.email) ?? undefined;
          });
        }
      }
      
      setInterns(internsData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch interns';
      setError(message);
      console.error('Error fetching interns:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInterns();

    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel(`interns_changes_${Math.random().toString(36).substring(7)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'interns' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newIntern = payload.new as Intern;
            setInterns((prev) => {
              if (prev.some((i) => i.id === newIntern.id)) return prev;
              return [...prev, newIntern];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedIntern = payload.new as Intern;
            setInterns((prev) => prev.map((i) => (i.id === updatedIntern.id ? { ...updatedIntern, avatar_index: i.avatar_index } : i)));
          } else if (payload.eventType === 'DELETE') {
            setInterns((prev) => prev.filter((i) => i.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchInterns]);

  const addIntern = async (payload: { email: string; department: Department }) => {
    if (!isSupabaseConfigured) {
      const newIntern = { 
        id: Math.random().toString(36).substr(2, 9),
        full_name: payload.email.split('@')[0], // better fallback name
        department: payload.department,
        email: payload.email
      };
      setInterns(prev => {
        const next = [...prev, newIntern];
        localStorage.setItem('padua_interns', JSON.stringify(next));
        return next;
      });
      return { success: true };
    }

    try {
      // 1. Must be registered in profiles
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('email', payload.email)
        .single();
        
      if (!profileData) {
        return { success: false, error: 'This email is not registered yet. Please ask them to create an account first.' };
      }

      // 2. Prevent adding if already in interns table (no promoting active interns)
      const { data: existingIntern } = await supabase
        .from('interns')
        .select('id')
        .eq('email', payload.email)
        .single();
        
      if (existingIntern) {
        return { success: false, error: 'This person is already assigned to the workspace. You cannot change their role here.' };
      }

      const { data: userData } = await supabase.auth.getUser();
      
      // 3. Insert into interns table
      const { data, error } = await supabase
        .from('interns')
        .insert([{ 
          full_name: profileData.full_name, 
          department: payload.department,
          email: payload.email,
          admin_id: userData.user?.id
        }])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      setInterns(prev => [...prev, data]);
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const removeIntern = async (id: string) => {
    if (!isSupabaseConfigured) {
      setInterns(prev => {
        const next = prev.filter(i => i.id !== id);
        localStorage.setItem('padua_interns', JSON.stringify(next));
        return next;
      });
      return;
    }

    try {
      const { error } = await supabase.from('interns').delete().eq('id', id);
      if (error) throw error;
      setInterns(prev => prev.filter(i => i.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };
  const reorderInterns = async (updates: { id: string, department: Department, order_index: number }[], newInternsState: Intern[]) => {
    setInterns(newInternsState);
    if (!isSupabaseConfigured) {
      localStorage.setItem('padua_interns', JSON.stringify(newInternsState));
      return;
    }

    try {
      await Promise.all(
        updates.map(u => 
          supabase
            .from('interns')
            .update({ department: u.department, order_index: u.order_index })
            .eq('id', u.id)
        )
      );
    } catch (err) {
      console.error('Error reordering interns:', err);
      fetchInterns(); // Revert on failure
    }
  };

  return { interns, loading, error, refetch: fetchInterns, addIntern, removeIntern, reorderInterns };
}
