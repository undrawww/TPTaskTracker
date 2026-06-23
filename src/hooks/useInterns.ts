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
      const { data, error: fetchError } = await supabase
        .from('interns')
        .select('*')
        .order('full_name', { ascending: true }); // fixed 'name' to 'full_name'

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
      // 1. Check if email is registered in profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('email', payload.email)
        .single();
        
      if (profileError || !profileData) {
        return { success: false, error: 'Email is not registered.' };
      }
      
      if (profileData.role !== 'intern') {
        return { success: false, error: 'This email is registered as an Admin, not an Intern.' };
      }

      const { data: userData } = await supabase.auth.getUser();
      
      // 2. Insert into interns table
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
        if (error.code === '23505') {
          return { success: false, error: 'This intern is already assigned to a workspace.' };
        }
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

  return { interns, loading, error, refetch: fetchInterns, addIntern, removeIntern };
}
