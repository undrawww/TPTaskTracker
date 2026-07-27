import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { Intern, Certification, DailyTask, AttendanceRecord, Department } from '../types';

export function useProfile(internId?: string) {
  const { currentInternId, role, user } = useAuth();
  
  const targetId = internId || currentInternId;
  
  const [intern, setIntern] = useState<Intern | null>(null);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [weeklyTasks, setWeeklyTasks] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshProfile();
  }, [targetId, user?.email]);

  const refreshProfile = async () => {
    if (!targetId && !user?.email && role !== 'admin') {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
        if (!isSupabaseConfigured) {
          if (role === 'admin' && !internId) {
            setIntern({
              id: 'admin',
              full_name: 'Admin User',
              department: 'Administrator' as Department,
              email: user?.email || 'admin@example.com',
              status: 'Active',
              bio: 'System Administrator account.',
            });
            setLoading(false);
            return;
          }
          // Mock data or localStorage fallback for when Supabase isn't configured
          const mockIntern: Intern = {
            id: targetId || 'demo-id',
            full_name: 'John Renz Bandianon',
            department: 'Advisor Support Associate',
            email: 'johnrenz@example.com',
            location: 'Davao City, Philippines',
            status: 'Active',
            start_date: '2026-05-12',
            bio: 'Dedicated and detail-oriented person with a passion for helping others and solving problems efficiently.',
            school: 'University of Example',
            program: 'Information Technology',
            current_year: '3rd Year',
            skills: ['Customer Support', 'Google Workspace', 'Communication', 'Problem Solving', 'Data Entry'],
          };
          setIntern(mockIntern);
          // Merge local storage certs
          const storedCerts = JSON.parse(localStorage.getItem('padua_certifications') || '[]');
          
          setCertifications([
            { id: '1', intern_id: targetId || 'demo-id', name: 'Google Workspace Fundamentals', issuer: 'Google', date_earned: '2026-05-15' },
            { id: '2', intern_id: targetId || 'demo-id', name: 'Customer Service Excellence', issuer: 'Alison', date_earned: '2026-04-30' },
            ...storedCerts.filter((c: any) => c.intern_id === targetId)
          ]);

          // Sync tasks with what Tracker uses in demo mode
          const storedTasks = localStorage.getItem('padua_daily_tasks');
          if (storedTasks) {
            try {
              const allTasks: DailyTask[] = JSON.parse(storedTasks);
              setTasks(allTasks.filter(t => t.intern_id === targetId));
            } catch (err) {
              setTasks([]);
            }
          } else {
            // Fallback demo tasks
            const d = new Date();
            const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            setTasks([
              { id: 'dt-1', intern_id: targetId || 'demo-id', task_name: 'Review client onboarding checklist', status: 'Done', task_date: today },
              { id: 'dt-2', intern_id: targetId || 'demo-id', task_name: 'Prepare advisor meeting notes', status: 'Done', task_date: today },
              { id: 'dt-3', intern_id: targetId || 'demo-id', task_name: 'Update support documentation', status: 'Done', task_date: today },
              { id: 'dt-4', intern_id: targetId || 'demo-id', task_name: 'Compile weekly financial report', status: 'Done', task_date: today },
            ]);
            setWeeklyTasks([]);
          }

          setLoading(false);
          return;
        }

        if (role === 'admin' && !internId) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', user?.email)
            .single();

          setIntern({
            id: user?.id || 'admin-id',
            full_name: profileData?.full_name || 'Administrator',
            email: user?.email || '',
            department: 'Administrator' as Department,
            status: 'Active',
            avatar_index: profileData?.avatar_index || 0,
            bio: 'System Administrator profile.',
          });
          setLoading(false);
          return;
        }

        // Try fetching Intern from interns table first
        let internData: any = null;
        if (targetId) {
          const { data } = await supabase
            .from('interns')
            .select('*')
            .eq('id', targetId)
            .maybeSingle();
          internData = data;
        }

        if (internData) {
          // Fetch profile data for avatar_index and created_at
          const { data: profileData } = await supabase
            .from('profiles')
            .select('avatar_index, avatar_url, created_at')
            .eq('email', internData.email)
            .maybeSingle();

          setIntern({
            ...internData,
            avatar_index: profileData?.avatar_index ?? internData.avatar_index ?? 0,
            avatar_url: profileData?.avatar_url || internData.avatar_url,
            created_at: profileData?.created_at || internData.created_at
          });
        } else {
          // Fallback: If not added into a daily tracker (not in interns table), load from profiles table
          let profileQuery = supabase.from('profiles').select('*');
          if (user?.email && (!internId || internId === user.id || internId === currentInternId)) {
            profileQuery = profileQuery.eq('email', user.email);
          } else if (targetId) {
            profileQuery = profileQuery.eq('id', targetId);
          } else {
            setLoading(false);
            return;
          }

          const { data: fallbackProfile, error: fallbackError } = await profileQuery.maybeSingle();
          if (!fallbackProfile || fallbackError) {
            setLoading(false);
            return;
          }

          const storedBio = localStorage.getItem(`tp_bio_${fallbackProfile.email}`);
          const storedSkillsRaw = localStorage.getItem(`tp_skills_${fallbackProfile.email}`);
          let storedSkills: string[] | null = null;
          try {
            if (storedSkillsRaw) storedSkills = JSON.parse(storedSkillsRaw);
          } catch (e) {
            // ignore parse error
          }

          setIntern({
            id: fallbackProfile.id || user?.id || 'unassigned-id',
            full_name: fallbackProfile.full_name || user?.user_metadata?.full_name || 'Intern',
            email: fallbackProfile.email || user?.email || '',
            department: (fallbackProfile.department || 'Unassigned') as Department,
            status: fallbackProfile.status || 'Active',
            avatar_index: fallbackProfile.avatar_index ?? 0,
            avatar_url: fallbackProfile.avatar_url,
            created_at: fallbackProfile.created_at,
            location: fallbackProfile.location,
            pin_location: fallbackProfile.pin_location,
            pin_location_name: fallbackProfile.pin_location_name,
            program: fallbackProfile.program,
            current_year: fallbackProfile.current_year,
            school: fallbackProfile.school,
            contact_number: fallbackProfile.contact_number,
            personal_email: fallbackProfile.personal_email,
            birthday: fallbackProfile.birthday,
            expected_graduation_date: fallbackProfile.expected_graduation_date,
            required_hours: fallbackProfile.required_hours,
            businesses: fallbackProfile.businesses,
            username: fallbackProfile.username,
            gcash_qr_url: fallbackProfile.gcash_qr_url,
            bio: fallbackProfile.bio || storedBio || 'No bio provided yet.',
            skills: fallbackProfile.skills || storedSkills || [],
          });
          setCertifications([]);
          setTasks([]);
          setWeeklyTasks([]);
          setAttendance([]);
          setLoading(false);
          return;
        }

        // Fetch Certifications, Tasks, and Attendance in parallel
        const [certRes, tasksRes, attendanceRes, weeklyRes] = await Promise.all([
          supabase
            .from('certifications')
            .select('*')
            .eq('intern_id', targetId)
            .order('date_earned', { ascending: false }),
          supabase
            .from('daily_tasks')
            .select('*')
            .eq('intern_id', targetId),
          supabase
            .from('attendance')
            .select('*')
            .eq('intern_name', internData.full_name)
            .order('attendance_date', { ascending: false }),
          supabase
            .from('weekly_tasks')
            .select('*')
            .eq('intern_id', targetId)
        ]);

        if (certRes.data) setCertifications(certRes.data);
        if (tasksRes.data) setTasks(tasksRes.data);
        if (attendanceRes.data) setAttendance(attendanceRes.data);
        if (weeklyRes.data) setWeeklyTasks(weeklyRes.data);
      } catch (err) {
        console.error('Error fetching profile data:', err);
      } finally {
        setLoading(false);
      }
  };

  return {
    intern,
    role,
    certifications,
    tasks,
    weeklyTasks,
    attendance,
    loading,
    refreshProfile,
  };
}
