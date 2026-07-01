import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { AnalyticsDashboard } from '../components/Analytics/AnalyticsDashboard';
import { AddInternModal } from '../components/Admin/AddInternModal';
import { CreateTaskModal } from '../components/Admin/CreateTaskModal';
import { DailyTracker } from '../components/Dashboard/DailyTracker';
import { WeeklyArchive } from '../components/Weekly/WeeklyArchive';
import { ProfileModal } from '../components/Profile/ProfileModal';
import { DashboardSkeleton, InternsSkeleton } from '../components/Skeleton/DashboardSkeleton';
import { HeaderProfileMenu } from '../components/Header/HeaderProfileMenu';
import { NotificationBell } from '../components/Header/NotificationBell';
import { Sidebar } from '../components/Layout/Sidebar';
import { AttendanceView } from '../components/Attendance/AttendanceView';
import { InternsDirectory } from '../components/Admin/InternsDirectory';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useInterns } from '../hooks/useInterns';
import { useDailyTasks } from '../hooks/useDailyTasks';
import { TaskComments } from '../components/Dashboard/TaskComments';

import { useAnalytics } from '../hooks/useAnalytics';
import { ProfilePage } from '../components/Profile/ProfilePage';
import type { TaskStatus } from '../types';

type ActiveView = 'tracker' | 'attendance' | 'interns' | 'profile';

export const Dashboard: React.FC = () => {
  const { role, currentInternId } = useAuth();
  const navigate = useNavigate();

  const location = useLocation();

  // Map paths to views
  const viewToPath: Record<ActiveView, string> = {
    tracker: '/tasktracker',
    attendance: '/attendance',
    interns: '/interns',
    profile: '/profile',
  };

  const pathToView: Record<string, ActiveView> = {
    '/': 'tracker',
    '/tasktracker': 'tracker',
    '/attendance': 'attendance',
    '/interns': 'interns',
    '/profile': 'profile',
  };

  // View & sidebar state
  const [activeView, setActiveView] = useState<ActiveView>(() => {
    return pathToView[location.pathname] || 'tracker';
  });
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(() => {
    return localStorage.getItem('tp_viewing_profile_id') || null;
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleViewChange = (view: ActiveView) => {
    setActiveView(view);
    navigate(viewToPath[view] || '/tasktracker');
    // Always clear viewingProfileId on manual navigation (sidebar/header)
    setViewingProfileId(null);
    localStorage.removeItem('tp_viewing_profile_id');
  };

  const handleViewProfile = (id: string) => {
    setViewingProfileId(id);
    localStorage.setItem('tp_viewing_profile_id', id);
    setActiveView('profile');
    navigate('/profile');
  };

  // Sync state if URL changes directly (e.g. back button or header menu)
  useEffect(() => {
    const currentView = pathToView[location.pathname] || 'tracker';
    if (activeView !== currentView) {
      setActiveView(currentView);
    }
  }, [location.pathname]);

  // Modal state



  // Modal state
  const [showAddIntern, setShowAddIntern] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showWeekly, setShowWeekly] = useState(false);

  // Data hooks
  const { interns, loading: internsLoading, addIntern, removeIntern, reorderInterns } = useInterns();
  const { tasks: dailyTasks, loading: tasksLoading, addTask: addDailyTask, updateStatus: updateDailyStatus, toggleVerify: toggleDailyVerify, editTask: editDailyTask, removeTask: removeDailyTask, reorderTasks } = useDailyTasks();

  const [activeCommentTaskId, setActiveCommentTaskId] = useState<string | null>(null);

  const isLoading = internsLoading || tasksLoading;

  // Filter data based on role
  const displayInterns = (() => {
    if (role === 'admin') return interns;
    if (role === 'intern' && currentInternId) return interns;
    return []; // intern but not added yet sees nothing
  })().filter(i => (i.department as string) !== 'Administrator');

  const validInternIds = new Set(interns.map(i => i.id));

  const displayDailyTasks = (() => {
    if (role === 'admin') return dailyTasks;
    if (role === 'intern' && currentInternId) return dailyTasks;
    return [];
  })().filter(t => validInternIds.has(t.intern_id));

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

  const handleRemoveIntern = async (id: string) => {
    await removeIntern(id);
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
    <div className="min-h-screen flex bg-cream dark:bg-[#001f26] transition-colors duration-300">
      {/* Sidebar Navigation */}
      <Sidebar
        activeView={activeView}
        onViewChange={handleViewChange}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
        todayTotal={analytics.todayTotal}
        completedTotal={analytics.completedTotal}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <header className="bg-[#d9caa8] dark:bg-gradient-to-r dark:from-[#00151a] dark:via-[#001a22] dark:to-[#001f2e] border-b border-teal/10 dark:border-white/5 transition-colors duration-300 relative z-10">
        <div className="w-full px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="min-[769px]:hidden flex items-center gap-3 active:scale-95 transition-transform"
            >
              <img src="https://res.cloudinary.com/dqmmfgbf1/image/upload/v1782145581/ICOZ_aatvaa.png" alt="Logo" className="w-8 h-8 object-contain" />
              <div className="flex flex-col items-start justify-center text-left">
                <h1 className="font-poppins text-lg font-bold tracking-tight leading-tight text-teal dark:text-white">
                  Team Padua <span className="text-gold">Tracker</span>
                </h1>
                <p className="text-[9px] text-teal/50 dark:text-white/50 font-bold tracking-[0.15em] uppercase whitespace-nowrap mt-0.5">
                  Internship Dashboard
                </p>
              </div>
            </button>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2.5 text-sm text-teal/70 dark:text-white/60 bg-teal/5 dark:bg-white/5 px-4 py-2 rounded-xl">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span className="font-medium text-teal dark:text-white">{formattedDate}</span>
            </div>
            {/* Header Right */}
            <div className="flex items-center gap-3 pr-2">
              <NotificationBell />
              <HeaderProfileMenu 
                onLogout={handleLogout} 
                onViewMyProfile={() => handleViewChange('profile')}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full mx-auto px-4 sm:px-6 md:px-8 py-6 space-y-8">
        {activeView === 'attendance' ? (
          <ErrorBoundary>
            <AttendanceView />
          </ErrorBoundary>
        ) : (
          <>
            {isLoading ? (
              activeView === 'interns' ? <InternsSkeleton /> : <DashboardSkeleton />
            ) : (
              <>
                {activeView === 'tracker' && (
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
                      Add Member
                    </button>

                  </div>
                )}

                <DailyTracker
                  interns={displayInterns}
                  tasks={displayDailyTasks}
                  onStatusChange={handleDailyStatusChange}
                  onVerifyChange={handleVerifyChange}
                  onEditTask={handleEditDailyTask}
                  onDeleteIntern={role === 'admin' ? handleRemoveIntern : undefined}
                  onDeleteTask={removeDailyTask}
                  isAdmin={role === 'admin'}
                  onViewProfile={handleViewProfile}
                  onAddTask={addDailyTask}
                  reorderTasks={reorderTasks}
                  reorderInterns={reorderInterns}
                  activeCommentTaskId={activeCommentTaskId}
                  setActiveCommentTaskId={setActiveCommentTaskId}
                />

                <div className="flex items-center gap-5 mt-12 mb-2">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-teal/15 to-transparent" />
                  <button
                    onClick={() => setShowWeekly(!showWeekly)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-teal/10 dark:border-white/10 hover:bg-teal/5 dark:hover:bg-white/5 transition-colors group"
                  >
                    <span className="text-[11px] text-teal/50 dark:text-cream/50 font-bold uppercase tracking-[0.2em] group-hover:text-teal dark:group-hover:text-cream transition-colors">
                      {showWeekly ? 'Hide' : 'Show'} Weekly Archive
                    </span>
                    <svg 
                      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className={`text-teal/50 dark:text-cream/50 group-hover:text-teal dark:group-hover:text-cream transition-transform duration-300 ${showWeekly ? 'rotate-180' : ''}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-teal/15 to-transparent" />
                </div>
                    {showWeekly && (
                      <WeeklyArchive 
                        interns={displayInterns} 
                        activeCommentTaskId={activeCommentTaskId}
                        setActiveCommentTaskId={setActiveCommentTaskId}
                      />
                    )}
                  </>
                )}
                
                {activeView === 'interns' && (
                  <InternsDirectory onViewProfile={handleViewProfile} />
                )}

                {activeView === 'profile' && (
                  <ProfilePage internId={viewingProfileId || undefined} />
                )}
              </>
            )}
          </>
        )}
      </main>

      <footer className="bg-[#d9caa8] dark:bg-gradient-to-r dark:from-[#00151a] dark:to-[#001f2e] text-teal dark:text-white/30 text-center text-[11px] py-5 mt-10 font-medium tracking-wide border-t border-teal/10 dark:border-transparent">
        <p>© {new Date().getFullYear()} Team Padua Tracker · Internship Dashboard</p>
      </footer>

      <ProfileModal
        isOpen={showProfile}
        onClose={() => {
          setShowProfile(false);
          setViewingProfileId(null);
        }}
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
      
      {/* Comments Modal Overlay */}
      <AnimatePresence>
        {activeCommentTaskId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 dark:bg-black/60"
              onClick={() => setActiveCommentTaskId(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-3xl h-[80vh] max-h-[800px] bg-white dark:bg-[#001f26] rounded-2xl shadow-2xl border border-teal/10 dark:border-white/10 flex flex-col overflow-hidden"
            >
               <div className="px-5 py-4 border-b border-teal/10 dark:border-white/5 flex items-center justify-between bg-teal/5 dark:bg-white/5">
                  <h3 className="font-bold text-teal dark:text-cream text-lg">Task Comments</h3>
                  <button onClick={() => setActiveCommentTaskId(null)} className="p-1.5 rounded-full hover:bg-teal/10 dark:hover:bg-white/10 text-teal/50 dark:text-cream/50 hover:text-teal dark:hover:text-cream transition-colors">
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                       <line x1="18" y1="6" x2="6" y2="18" />
                       <line x1="6" y1="6" x2="18" y2="18" />
                     </svg>
                  </button>
               </div>
               <div className="flex-1 overflow-hidden relative">
                 <TaskComments taskId={activeCommentTaskId} />
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      </div>
    </div>
  );
};
