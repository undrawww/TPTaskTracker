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

      let userRole: 'intern' | 'admin' | null = null;
      let avatarIndex: number | null = null;
      let fullName: string | null = null;

      if (profile) {
        userRole = profile.role as 'intern' | 'admin';
        avatarIndex = profile.avatar_index;
        fullName = profile.full_name;

        // Auto-repair: If admin2@test.com got stuck as an intern during the previous bugs, fix them!
        if (currentUser.email === 'admin2@test.com' && userRole === 'intern') {
          await supabase.from('profiles').update({ role: 'admin' }).eq('email', 'admin2@test.com');
          userRole = 'admin';
        }
      } else {
        // Self-heal: recreate missing profile if they somehow lost it (e.g. from an aggressive delete)
        const newRole = 'intern';
        const newFullName = currentUser.email?.split('@')[0] || 'User';
        const { error } = await supabase.from('profiles').insert([{
          id: currentUser.id,
          email: currentUser.email,
          full_name: newFullName,
          role: newRole
        }]);
        
        if (!error) {
          userRole = newRole;
          fullName = newFullName;
        }
      }

      if (avatarIndex !== null && avatarIndex !== undefined) {
        localStorage.setItem('tp_avatar', String(avatarIndex));
      }
      if (fullName) {
        localStorage.setItem('tp_avatar_name', fullName);
      }
      if (profile || userRole) {
        window.dispatchEvent(new Event('avatar-change'));
      }

      if (userRole === 'admin') {
        setRole('admin');
        setCurrentInternId(null);
      } else {
        setRole('intern');
        // Now find their intern ID for filtering
        const { data: internData } = await supabase
          .from('interns')
          .select('id')
          .eq('email', currentUser.email)
          .single();
        
        setCurrentInternId(internData?.id || null);
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
