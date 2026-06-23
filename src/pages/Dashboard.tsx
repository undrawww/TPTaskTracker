import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { AnalyticsDashboard } from '../components/Analytics/AnalyticsDashboard';
import { AddInternModal } from '../components/Admin/AddInternModal';
import { CreateTaskModal } from '../components/Admin/CreateTaskModal';
import { DailyTracker } from '../components/Dashboard/DailyTracker';
import { WeeklyArchive } from '../components/Weekly/WeeklyArchive';
import { ProfileModal } from '../components/Profile/ProfileModal';
import { DashboardSkeleton } from '../components/Skeleton/DashboardSkeleton';
import { HeaderProfileMenu } from '../components/Header/HeaderProfileMenu';
import { useInterns } from '../hooks/useInterns';
import { useDailyTasks } from '../hooks/useDailyTasks';

import { useAnalytics } from '../hooks/useAnalytics';
import type { TaskStatus } from '../types';

export const Dashboard: React.FC = () => {
  const { role, currentInternId } = useAuth();
  const navigate = useNavigate();

  // Modal state
  const [showAddIntern, setShowAddIntern] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Data hooks
  const { interns, loading: internsLoading, addIntern, removeIntern } = useInterns();
  const { tasks: dailyTasks, loading: tasksLoading, addTask: addDailyTask, updateStatus: updateDailyStatus, toggleVerify: toggleDailyVerify, editTask: editDailyTask, removeTask: removeDailyTask } = useDailyTasks();

  const isLoading = internsLoading || tasksLoading;

  // Filter data based on role
  const displayInterns = role === 'intern' && currentInternId 
    ? interns.filter(i => i.id === currentInternId) 
    : interns;

  const validInternIds = new Set(interns.map(i => i.id));

  const displayDailyTasks = (role === 'intern' && currentInternId
    ? dailyTasks.filter(t => t.intern_id === currentInternId)
    : dailyTasks).filter(t => validInternIds.has(t.intern_id));

  const analytics = useAnalytics(displayInterns, displayDailyTasks);

  // Handlers
  const handleDailyStatusChange = async (taskId: string, status: TaskStatus) => {
    await updateDailyStatus(taskId, status);
  };

  const handleVerifyChange = async (taskId: string, isVerified: boolean) => {
    await toggleDailyVerify(taskId, isVerified);
  };

  const handleEditDailyTask = async (taskId: string, newName: string) => {
    await editDailyTask(taskId, newName);
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    navigate('/login');
  };

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-cream dark:bg-[#001f26] transition-colors duration-300">
      {/* Header */}
      <header className="bg-gradient-to-r from-teal via-teal to-[#004d5e] dark:from-[#00151a] dark:via-[#001a22] dark:to-[#001f2e] text-white shadow-lg transition-colors duration-300">
        <div className="max-w-[1440px] mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gold flex items-center justify-center shadow-lg shadow-gold/20 hover:shadow-gold/40 transition-shadow duration-300">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#003946" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
            </div>
            <div>
              <h1 className="font-poppins text-xl font-bold tracking-tight leading-tight">
                Team Padua <span className="text-gold">Tracker</span>
              </h1>
              <p className="text-[11px] text-white/50 font-semibold tracking-[0.15em] uppercase">
                Internship Dashboard
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2.5 text-sm text-white/60 bg-white/5 px-4 py-2 rounded-xl">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span className="font-medium">{formattedDate}</span>
            </div>

            <div className="flex items-center gap-3 border-l border-white/10 pl-6">
              <HeaderProfileMenu
                onOpenProfile={() => setShowProfile(true)}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 space-y-8">
        {isLoading ? (
          <DashboardSkeleton />
        ) : (
        <>
        <AnalyticsDashboard analytics={analytics} />

        {/* Admin action buttons */}
        {role === 'admin' && (
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowAddIntern(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal dark:bg-teal-light text-white text-sm font-semibold hover:bg-teal-light dark:hover:bg-teal-lighter transition-all duration-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
              Add Intern
            </button>

            <button
              onClick={() => setShowCreateTask(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold text-teal text-sm font-semibold hover:bg-gold-light transition-all duration-200 shadow-sm shadow-gold/20 hover:shadow-lg hover:shadow-gold/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create New Task
            </button>
          </div>
        )}

        <DailyTracker
          interns={displayInterns}
          tasks={displayDailyTasks}
          onStatusChange={handleDailyStatusChange}
          onVerifyChange={handleVerifyChange}
          onEditTask={handleEditDailyTask}
          onDeleteIntern={role === 'admin' ? removeIntern : undefined}
          onDeleteTask={role === 'admin' ? removeDailyTask : undefined}
        />

        <div className="flex items-center gap-5">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-teal/15 to-transparent" />
          <span className="text-[11px] text-teal/40 dark:text-cream/40 font-bold uppercase tracking-[0.2em]">
            Weekly Archive
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-teal/15 to-transparent" />
        </div>

        <WeeklyArchive interns={displayInterns} />
        </>
        )}
      </main>

      <footer className="bg-gradient-to-r from-teal via-teal to-[#004d5e] dark:from-[#00151a] dark:to-[#001f2e] text-white/30 text-center text-[11px] py-5 mt-10 font-medium tracking-wide">
        <p>© {new Date().getFullYear()} Team Padua Tracker · Internship Dashboard</p>
      </footer>

      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        onLogout={handleLogout}
      />
      {role === 'admin' && (
        <>
          <AddInternModal
            isOpen={showAddIntern}
            onClose={() => setShowAddIntern(false)}
            interns={interns}
            onSubmit={addIntern}
          />
          <CreateTaskModal
            isOpen={showCreateTask}
            onClose={() => setShowCreateTask(false)}
            interns={interns}
            onSubmit={addDailyTask}
          />
        </>
      )}
    </div>
  );
};
