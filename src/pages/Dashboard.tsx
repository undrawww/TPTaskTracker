import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
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
import { TrainingVideos } from '../components/Training/TrainingVideos';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useInterns } from '../hooks/useInterns';
import { useDailyTasks } from '../hooks/useDailyTasks';
import { TaskComments } from '../components/Dashboard/TaskComments';

import { useAnalytics } from '../hooks/useAnalytics';
import { ProfilePage } from '../components/Profile/ProfilePage';
import { isPoolId, type TaskStatus } from '../types';
import { generateSlug } from '../utils/slugify';

type ActiveView = 'tracker' | 'attendance' | 'interns' | 'profile' | 'videos';

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
    videos: '/videos',
  };

  const pathToView: Record<string, ActiveView> = {
    '/': 'tracker',
    '/tasktracker': 'tracker',
    '/attendance': 'attendance',
    '/interns': 'interns',
    '/profile': 'profile',
    '/videos': 'videos',
  };

  const { internId } = useParams<{ internId?: string; videoId?: string }>();

  // Data hooks (moved up because they are used in routing state logic)
  const { interns, loading: internsLoading, addIntern, removeIntern, reorderInterns } = useInterns();

  // View & sidebar state
  const [activeView, setActiveView] = useState<ActiveView>(() => {
    const basePath = '/' + location.pathname.split('/')[1];
    return pathToView[basePath] || 'tracker';
  });
  
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Chart visibility settings (persisted, but false by default)
  const [showCharts, setShowCharts] = useState(() => {
    const saved = localStorage.getItem('padua_show_charts');
    return saved !== null ? saved === 'true' : false;
  });

  const toggleCharts = () => {
    setShowCharts(prev => {
      const next = !prev;
      localStorage.setItem('padua_show_charts', String(next));
      return next;
    });
  };

  const handleViewChange = (view: ActiveView) => {
    setActiveView(view);
    navigate(viewToPath[view] || '/tasktracker');
    setViewingProfileId(null);
  };

  const handleViewProfile = (id: string) => {
    const intern = interns.find(i => i.id === id);
    if (intern) {
      const slug = generateSlug(intern.full_name);
      setActiveView('profile');
      navigate(`/profile/${slug || id}`);
    } else {
      setActiveView('profile');
      navigate(`/profile/${id}`);
    }
  };

  // Sync state if URL changes directly (e.g. back button or header menu)
  useEffect(() => {
    const basePath = '/' + location.pathname.split('/')[1];
    const currentView = pathToView[basePath] || 'tracker';
    if (activeView !== currentView) {
      setActiveView(currentView);
    }
    
    // Sync profile ID from URL parameter (resolve slug to UUID)
    if (currentView === 'profile') {
      if (!internId) {
        setViewingProfileId(null);
      } else {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(internId);
        if (isUuid) {
          setViewingProfileId(internId);
        } else if (interns.length > 0) {
          const matched = interns.find(i => generateSlug(i.full_name) === internId);
          if (matched) setViewingProfileId(matched.id);
        }
      }
    }
  }, [location.pathname, internId, interns]);

  // Modal state
  const [showAddIntern, setShowAddIntern] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const [showWeekly, setShowWeekly] = useState(() => {
    const saved = localStorage.getItem('padua_show_weekly');
    return saved !== null ? saved === 'true' : false;
  });

  const toggleWeeklyArchive = () => {
    setShowWeekly(prev => {
      const next = !prev;
      localStorage.setItem('padua_show_weekly', String(next));
      return next;
    });
  };

  const [activeCommentTaskId, setActiveCommentTaskId] = useState<string | null>(null);
  const [attendanceInitialDate, setAttendanceInitialDate] = useState<string | undefined>(undefined);

  // Data hooks
  const { tasks: dailyTasks, loading: tasksLoading, addTask: addDailyTask, updateStatus: updateDailyStatus, toggleVerify: toggleDailyVerify, editTask: editDailyTask, removeTask: removeDailyTask, reorderTasks } = useDailyTasks();

  const isLoading = internsLoading || tasksLoading;

  // Filter data based on role
  const displayInterns = (() => {
    if (role === 'admin') return interns;
    if (role === 'intern' && currentInternId) return interns;
    return []; // intern but not added yet sees nothing
  })().filter(i => {
    if ((i.department as string) === 'Administrator') return false;
    return true;
  });

  const validInternIds = new Set(interns.map(i => i.id));

  const displayDailyTasks = (() => {
    if (role === 'admin') return dailyTasks;
    if (role === 'intern' && currentInternId) return dailyTasks;
    return [];
  })().filter(t => validInternIds.has(t.intern_id) || isPoolId(t.intern_id));

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
      <header className="bg-[#d9caa8] dark:bg-gradient-to-r dark:from-[#00151a] dark:via-[#001a22] dark:to-[#001f2e] border-b border-teal/10 dark:border-white/5 transition-colors duration-300 relative z-50">
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
              <a 
                href="https://us06web.zoom.us/j/5410171152?pwd=v8fBiNgqRfig0jaqJr26LPpf51cxUn.1#success"
                target="_blank"
                rel="noopener noreferrer"
                className="relative flex items-center justify-center w-8 h-8 rounded-xl hover:bg-blue-500/10 dark:hover:bg-blue-500/20 transition-all duration-200 group"
                title="Join Zoom Meeting"
              >
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className="transition-transform group-hover:scale-110"
                >
                  <circle cx="12" cy="12" r="12" fill="#2D8CFF" />
                  <path d="M17.5 9.5V14.5C17.5 15.3 16.6 15.8 15.9 15.4L13 13.8V10.2L15.9 8.6C16.6 8.2 17.5 8.7 17.5 9.5Z" fill="white"/>
                  <rect x="6.5" y="8" width="7" height="8" rx="1.5" fill="white"/>
                </svg>
              </a>
              <a 
                href="https://meet.google.com/htr-ryrn-tkp"
                target="_blank"
                rel="noopener noreferrer"
                className="relative flex items-center justify-center w-8 h-8 rounded-xl hover:bg-green-500/10 dark:hover:bg-green-500/20 transition-all duration-200 group"
                title="Join Google Meet"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 87.5 72" 
                  width="24" 
                  height="24" 
                  className="transition-transform group-hover:scale-110"
                >
                  <path fill="#00832d" d="M49.5 36l8.53 9.75 11.47 7.33 2-17.02-2-16.64-11.69 6.44z"/>
                  <path fill="#0066da" d="M0 51.5V66c0 3.315 2.685 6 6 6h14.5l3-10.96-3-9.54-9.95-3z"/>
                  <path fill="#e94235" d="M20.5 0L0 20.5l10.55 3 9.95-3 2.95-9.41z"/>
                  <path fill="#2684fc" d="M20.5 20.5H0v31h20.5z"/>
                  <path fill="#00ac47" d="M82.6 8.68L69.5 19.42v33.66l13.16 10.79c1.97 1.54 4.85.135 4.85-2.37V11c0-2.535-2.945-3.925-4.91-2.32zM49.5 36v15.5h-29V72h43c3.315 0 6-2.685 6-6V53.08z"/>
                  <path fill="#ffba00" d="M63.5 0h-43v20.5h29V36l20-16.57V6c0-3.315-2.685-6-6-6z"/>
                </svg>
              </a>
              <NotificationBell 
                onNotificationClick={(notif) => {
                  const scrollTarget = (targetId: string) => {
                    let attempts = 0;
                    const tryScroll = () => {
                      const el = document.getElementById(targetId);
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.classList.add('ring-2', 'ring-gold', 'ring-offset-2');
                        setTimeout(() => el.classList.remove('ring-2', 'ring-gold', 'ring-offset-2'), 3000);
                      } else if (attempts < 20) {
                        attempts++;
                        setTimeout(tryScroll, 100);
                      }
                    };
                    tryScroll();
                  };

                  if (notif.type === 'feedback') {
                    if (notif.metadata?.date) {
                      setAttendanceInitialDate(notif.metadata.date as string);
                    }
                    handleViewChange('attendance');
                    const internName = notif.metadata?.intern_name as string | undefined;
                    if (internName) {
                      scrollTarget(`attendance-${internName.replace(/\s+/g, '-')}`);
                    }
                    return;
                  }

                  const taskId = notif.metadata?.task_id as string | undefined;
                  // Navigate to task tracker view
                  handleViewChange('tracker');
                  if (taskId) {
                    // If it's a comment notification, open the comment thread
                    if (notif.type === 'comment') {
                      setActiveCommentTaskId(taskId);
                    }
                    // Scroll to the task
                    scrollTarget(`task-${taskId}`);
                  }
                }}
              />
              <HeaderProfileMenu 
                onLogout={handleLogout} 
                onViewMyProfile={() => handleViewChange('profile')}
                currentUser={currentUser}
                showCharts={showCharts}
                onToggleCharts={toggleCharts}
                showWeeklyArchive={showWeekly}
                onToggleWeeklyArchive={toggleWeeklyArchive}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full mx-auto px-4 sm:px-6 md:px-8 py-6 space-y-8">
        {activeView === 'attendance' ? (
          <ErrorBoundary>
            <AttendanceView initialDate={attendanceInitialDate} />
          </ErrorBoundary>
        ) : (
          <>
            {isLoading ? (
              activeView === 'interns' ? <InternsSkeleton /> : <DashboardSkeleton />
            ) : (
              <>
                {activeView === 'tracker' && (
                  <>
                    <AnalyticsDashboard analytics={analytics} showCharts={showCharts} />

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


                    {showWeekly && (
                      <WeeklyArchive 
                        interns={displayInterns} 
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

                {activeView === 'videos' && (
                  <TrainingVideos />
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
