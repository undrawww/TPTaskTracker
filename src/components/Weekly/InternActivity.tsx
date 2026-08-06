import React, { useState, useEffect, useMemo } from 'react';
import { useTaskHistory } from '../../hooks/useTaskHistory';
import { type Intern, type AttendanceRecord } from '../../types';
import { CustomDropdown } from '../common/CustomDropdown';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { TaskUpdates } from '../Dashboard/TaskUpdates';

interface Props {
  interns: Intern[];
}

export const InternActivity: React.FC<Props> = ({ interns }) => {
  const [selectedInternId, setSelectedInternId] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | 'all'>('all');
  const [activeCommentTaskId, setActiveCommentTaskId] = useState<string | null>(null);
  const [activeCommentTaskName, setActiveCommentTaskName] = useState<string>('');
  
  const { tasks, loading: tasksLoading } = useTaskHistory(selectedInternId, selectedWeek);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [updates, setUpdates] = useState<any[]>([]);
  const [extraLoading, setExtraLoading] = useState(false);

  // Filter out the admins and sort alphabetically
  const adminNames = ['Daniel Padua', 'Nerizza', 'Wyn', 'Princess Isabel'];
  const sortedInterns = [...interns]
    .filter(i => !adminNames.some(admin => i.full_name.includes(admin)) && !i.email.includes('admin'))
    .sort((a, b) => a.full_name.localeCompare(b.full_name));

  const studentOptions = sortedInterns.map(i => ({ label: i.full_name, value: i.id }));
  const weekOptions = [
    { label: 'All Time', value: 'all' },
    ...Array.from({ length: 16 }, (_, i) => ({ label: `Week ${i + 1}`, value: i + 1 }))
  ];

  const selectedIntern = sortedInterns.find(i => i.id === selectedInternId);

  useEffect(() => {
    if (!selectedInternId || !selectedIntern) return;
    
    const fetchExtraData = async () => {
      setExtraLoading(true);
      try {
        if (isSupabaseConfigured) {
          // Fetch attendance
          const { data: attData } = await supabase
            .from('attendance')
            .select('*')
            .eq('intern_name', selectedIntern.full_name)
            .order('attendance_date', { ascending: false });
            
          if (attData) setAttendances(attData);

          // Fetch updates for the tasks we have
          if (tasks.length > 0) {
            const taskIds = tasks.map(t => t.id);
            const { data: upData, error } = await supabase
              .from('task_comments')
              .select('*')
              .in('task_id', taskIds)
              .order('created_at', { ascending: true });
            
            if (error) console.error('Error fetching updates:', error);
              
            if (upData) setUpdates(upData);
          } else {
            setUpdates([]);
          }
        } else {
          // LocalStorage fallback
          try {
            const allAtt: any[] = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith('padua_attendance_')) {
                const stored = JSON.parse(localStorage.getItem(key) || '[]');
                allAtt.push(...stored);
              }
            }
            const internAtt = allAtt.filter((a: any) => a.intern_name === selectedIntern.full_name);
            setAttendances(internAtt);

            if (tasks.length > 0) {
              const allComms = JSON.parse(localStorage.getItem('padua_task_comments') || '[]');
              const taskIds = tasks.map(t => t.id);
              const internComms = allComms.filter((c: any) => taskIds.includes(c.task_id));
              setUpdates(internComms);
            } else {
              setUpdates([]);
            }
          } catch (e) {
            console.error('Error parsing local storage data', e);
          }
        }
      } catch (err) {
        console.error('Error fetching activity data:', err);
      } finally {
        setExtraLoading(false);
      }
    };
    
    fetchExtraData();
  }, [selectedInternId, selectedIntern, tasks]);

  const loading = tasksLoading || extraLoading;

  // Group everything by Date
  const groupedData = useMemo(() => {
    const groups: Record<string, {
      dateStr: string,
      attendance?: AttendanceRecord,
      tasks: any[],
      updates: any[]
    }> = {};

    // 1. Process Attendance
    attendances.forEach(att => {
      if (!groups[att.attendance_date]) {
        groups[att.attendance_date] = { dateStr: att.attendance_date, tasks: [], updates: [] };
      }
      groups[att.attendance_date].attendance = att;
    });

    // 2. Process Tasks
    tasks.forEach(task => {
      // Use task_date if available, else created_at/updated_at, else today
      let dateKey = '';
      if (task.task_date) {
        dateKey = task.task_date;
      } else {
        const fallback = (task as any).updated_at || (task as any).created_at;
        if (fallback) {
          dateKey = fallback.split('T')[0];
        } else {
          dateKey = new Date().toISOString().split('T')[0];
        }
      }

      if (!groups[dateKey]) {
        groups[dateKey] = { dateStr: dateKey, tasks: [], updates: [] };
      }
      groups[dateKey].tasks.push(task);
    });

    // Map updates to tasks
    const updatesByTask: Record<string, any[]> = {};
    updates.forEach(up => {
      if (!updatesByTask[up.task_id]) updatesByTask[up.task_id] = [];
      
      const authorData = up.profiles || up.interns;
      updatesByTask[up.task_id].push({
        ...up,
        avatar_index: authorData?.avatar_index,
        avatar_url: authorData?.avatar_url
      });
    });

    // Attach updates to tasks
    Object.values(groups).forEach(group => {
      group.tasks.forEach(task => {
        task.updates = updatesByTask[task.id] || [];
      });
    });

    // Sort groups by date descending
    return Object.values(groups).sort((a, b) => b.dateStr.localeCompare(a.dateStr));
  }, [tasks, attendances, updates]);




  return (
    <section id="intern-activity" className="bg-white/50 dark:bg-[#002b36]/50 rounded-2xl p-6 border border-teal/10 dark:border-white/5 shadow-sm">
      {/* Section header & filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-teal dark:text-cream">Weekly Archive</h2>
          <p className="text-sm text-teal/60 dark:text-cream/50 mt-1">Unified view of legacy records and task updates</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <CustomDropdown
              value={selectedInternId}
              onChange={setSelectedInternId}
              options={studentOptions}
              placeholder="Select an intern first"
            />
          </div>

          <div className="flex items-center gap-2">
            <CustomDropdown
              value={selectedWeek}
              onChange={setSelectedWeek}
              options={weekOptions}
              placeholder="Date Range"
            />
          </div>
        </div>
      </div>

      {/* Comments Modal Overlay */}
      <AnimatePresence>
        {activeCommentTaskId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
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
                  <h3 className="font-bold text-teal dark:text-cream text-lg flex items-center gap-2">
                    <span className="truncate max-w-[400px]" title={activeCommentTaskName}>
                      {activeCommentTaskName}
                    </span>
                  </h3>
                  <button onClick={() => setActiveCommentTaskId(null)} className="p-1.5 rounded-full hover:bg-teal/10 dark:hover:bg-white/10 text-teal/50 dark:text-cream/50 hover:text-teal dark:hover:text-cream transition-colors">
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                       <line x1="18" y1="6" x2="6" y2="18" />
                       <line x1="6" y1="6" x2="18" y2="18" />
                     </svg>
                  </button>
               </div>
               
               <div className="flex border-b border-teal/10 dark:border-white/10 px-5">
                 <div className="py-3 px-1 border-b-2 border-teal dark:border-gold text-teal dark:text-cream font-bold text-sm">
                   Updates
                 </div>
               </div>

               <div className="flex-1 overflow-hidden relative">
                 <TaskUpdates 
                   taskId={activeCommentTaskId} 
                   taskName={activeCommentTaskName}
                   readOnly={true}
                 />
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-teal/40 dark:text-cream/40">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm font-medium">Loading timeline...</span>
          </div>
        </div>
      ) : !selectedInternId ? (
        <div className="text-center py-12 text-teal/50 dark:text-cream/50">
          <p>Please select an intern to view their activity timeline.</p>
        </div>
      ) : groupedData.length === 0 ? (
        <div className="text-center py-12 text-teal/50 dark:text-cream/50">
          <p>No activity found for this selection.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedData.map((day) => {
            // Parse legacy accomplishments
            let legacyRecords: string[] = [];
            if (day.attendance?.accomplishments) {
              try {
                const parsed = JSON.parse(day.attendance.accomplishments);
                if (Array.isArray(parsed)) legacyRecords = parsed;
              } catch {
                legacyRecords = day.attendance.accomplishments.split('\n').filter(r => r.trim() !== '');
              }
            }

            return (
              <div key={day.dateStr} className="bg-white dark:bg-[#001f26] rounded-xl border border-teal/10 dark:border-white/5 overflow-hidden shadow-sm">
                {/* Date Header */}
                <div className="bg-teal/5 dark:bg-white/5 px-5 py-3 border-b border-teal/10 dark:border-white/5 flex items-center justify-between">
                  <h3 className="font-bold text-teal dark:text-cream flex items-center gap-2">
                    {new Date(day.dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </h3>
                </div>

                <div className="p-5 space-y-5">
                  {/* Time Logs Removed */}

                  {/* Legacy Daily Records */}
                  {legacyRecords.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-teal/70 dark:text-cream/70 mb-2 flex items-center gap-1.5">
                        Daily Records
                      </h4>
                      <div className="space-y-1 text-sm text-[#003946]/80 dark:text-cream/80 ml-1">
                        {legacyRecords.map((rec, i) => (
                          <div key={i}>{day.dateStr >= '2026-08-06' ? `${i + 1}. ` : ''}{rec}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tasks & Updates */}
                  {day.tasks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-teal/70 dark:text-cream/70 mb-3 flex items-center gap-1.5">
                        Tasks & Updates
                      </h4>
                      <div className="space-y-3">
                        {day.tasks.map(task => (
                          <div key={task.id} className="bg-teal/5 dark:bg-white/5 rounded-lg border border-teal/10 dark:border-white/5 p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 font-medium text-teal dark:text-cream text-sm">
                                <span className="flex items-center justify-center w-5 h-5 rounded bg-green-500/20 text-green-600 dark:text-green-400">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </span>
                                {task.task_name}
                              </div>
                              <button 
                                onClick={() => {
                                  setActiveCommentTaskId(task.id);
                                  setActiveCommentTaskName(task.task_name);
                                }}
                                className="text-[10px] uppercase font-bold text-teal dark:text-cream px-3 py-1 rounded-full border border-teal/20 dark:border-white/20 hover:bg-teal/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                              >
                                Updates
                              </button>
                            </div>
                            
                            {/* Task Updates */}
                            {task.updates && task.updates.length > 0 ? (
                              <div className="mt-2 pl-3 ml-2.5 text-[11px] text-[#003946]/80 dark:text-cream/70 italic font-medium">
                                {task.updates.length} {task.updates.length === 1 ? 'update' : 'updates'} recorded
                              </div>
                            ) : (
                              <div className="mt-2 pl-3 ml-2.5 text-[11px] text-teal/40 dark:text-cream/30 italic">
                                No updates recorded
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Admin Feedback */}
                  {day.attendance?.admin_feedback && (
                    <div className="mt-4 pt-4 border-t border-teal/10 dark:border-white/5">
                      <h4 className="text-xs font-bold text-[#8a6d00] dark:text-gold mb-1 flex items-center gap-1.5 uppercase tracking-wider">
                        Admin Feedback
                      </h4>
                      <div className="bg-[#ebbc0f]/10 dark:bg-gold/5 p-3 rounded-lg text-sm text-[#003946]/90 dark:text-cream/90 italic border border-[#ebbc0f]/20 dark:border-gold/10">
                        "{day.attendance.admin_feedback}"
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
