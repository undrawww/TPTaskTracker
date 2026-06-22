import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: 'admin' | 'intern' | null;
  currentInternId: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  role: null,
  currentInternId: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'admin' | 'intern' | null>(null);
  const [currentInternId, setCurrentInternId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async (currentUser: User | null) => {
      if (!currentUser) {
        setRole(null);
        setCurrentInternId(null);
        setLoading(false);
        return;
      }

      if (!isSupabaseConfigured) {
        // In demo mode, simulate being an admin so we see everything
        setRole('admin');
        setCurrentInternId(null);
        setLoading(false);
        return;
      }

      // Query the profiles table to get the explicit role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, avatar_index, full_name')
        .eq('email', currentUser.email)
        .single();

      if (profile) {
        if (profile.avatar_index !== null && profile.avatar_index !== undefined) {
          localStorage.setItem('tp_avatar', String(profile.avatar_index));
        }
        if (profile.full_name) {
          localStorage.setItem('tp_avatar_name', profile.full_name);
        }
        window.dispatchEvent(new Event('avatar-change'));
      }

      if (profile?.role === 'intern') {
        setRole('intern');
        // Now find their intern ID for filtering
        const { data: internData } = await supabase
          .from('interns')
          .select('id')
          .eq('email', currentUser.email)
          .single();
        
        setCurrentInternId(internData?.id || null);
      } else {
        setRole('admin'); // fallback or explicit admin
        setCurrentInternId(null);
      }
      setLoading(false);
    };

    if (!isSupabaseConfigured) {
      const mockUser = { id: 'demo-user', email: 'demo@example.com' } as User;
      setUser(mockUser);
      setSession({ user: mockUser } as Session);
      fetchRole(mockUser);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      fetchRole(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    session,
    loading,
    role,
    currentInternId,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
