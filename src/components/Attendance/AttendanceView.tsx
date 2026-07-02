import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAttendance } from '../../hooks/useAttendance';
import { AttendanceInternCard } from './AttendanceInternCard';
import { DashboardSkeleton } from '../Skeleton/DashboardSkeleton';

export type SortOption = 'department' | 'name' | 'time_in';

export const AttendanceView: React.FC = () => {
  const { role, currentInternId } = useAuth();
  const {
    records,
    loading,
    error,
    selectedDate,
    setSelectedDate,
    stampAction,
    undoStampAction,
    editTimeAction,
    updateText,
  } = useAttendance();

  const [showTimeColumns, setShowTimeColumns] = useState<boolean>(() => {
    const saved = localStorage.getItem('padua_attendance_show_times');
    return saved !== null ? saved === 'true' : true;
  });
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    const saved = localStorage.getItem('padua_attendance_sort_by');
    return (saved as SortOption) || 'department';
  });

  React.useEffect(() => {
    localStorage.setItem('padua_attendance_show_times', String(showTimeColumns));
  }, [showTimeColumns]);

  React.useEffect(() => {
    localStorage.setItem('padua_attendance_sort_by', sortBy);
  }, [sortBy]);

  const isAdmin = role === 'admin';

  // Filter: Interns not added yet see nothing. Added interns and admins see everyone.
  let displayRecords = records;
  if (role === 'intern' && !currentInternId) {
    displayRecords = [];
  }
    
  displayRecords = displayRecords.filter(r => 
    r.intern?.full_name !== 'Administrator (Invite)' && 
    r.intern?.department !== 'BizDev Leadership Team' &&
    (r.intern?.department as string) !== 'BizDev Team'
  );

  displayRecords.sort((a, b) => {
    if (sortBy === 'department') {
      const deptA = a.intern?.department || '';
      const deptB = b.intern?.department || '';
      if (deptA === deptB) {
        return (a.intern?.full_name || '').localeCompare(b.intern?.full_name || '');
      }
      return deptA.localeCompare(deptB);
    } else if (sortBy === 'name') {
      return (a.intern?.full_name || '').localeCompare(b.intern?.full_name || '');
    } else if (sortBy === 'time_in') {
      const timeA = a.time_in ? new Date(a.time_in).getTime() : Infinity;
      const timeB = b.time_in ? new Date(b.time_in).getTime() : Infinity;
      return timeA - timeB;
    }
    return 0;
  });

  const [csvDataUri, setCsvDataUri] = useState<string>('');

  React.useEffect(() => {
    if (!isAdmin) return;

    try {
      const headers = ['Name', 'Department', 'Daily Records'];

      const rows = displayRecords.map(a => {
        const name = a.intern?.username || a.intern?.full_name || 'Unknown';
        const dept = a.intern?.department || 'Unknown';

        let recordsStr = '';
        if (a.accomplishments) {
          try {
            const parsed = JSON.parse(a.accomplishments);
            if (Array.isArray(parsed)) recordsStr = parsed.join('; ');
            else recordsStr = String(a.accomplishments).replace(/\n/g, '; ');
          } catch {
            recordsStr = String(a.accomplishments).replace(/\n/g, '; ');
          }
        }
        const escapedRecords = recordsStr.replace(/"/g, '""');
        
        return `"${name}","${dept}","${escapedRecords}"`;
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      
      // Use data URI instead of Blob to try to bypass strict localhost download blocks
      const dataUri = `data:text/csv;charset=utf-8,\ufeff${encodeURIComponent(csvContent)}`;
      setCsvDataUri(dataUri);
    } catch (error) {
      console.error("Failed to generate CSV Data URI:", error);
    }
  }, [displayRecords, isAdmin]);

  /** Format date for the header display */
  const displayDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* ── Main Content ─────────────────────────────────────── */}
      {role === 'intern' && !currentInternId ? (
        <div className="flex flex-col items-center justify-center py-20 bg-teal/5 dark:bg-[#002833]/50 rounded-2xl border border-teal/10 dark:border-white/5">
          <div className="w-16 h-16 rounded-2xl bg-teal/10 dark:bg-white/5 flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal/40 dark:text-cream/30">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="17" y1="8" x2="23" y2="14" />
              <line x1="23" y1="8" x2="17" y2="14" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-teal dark:text-cream mb-1">
            Not added to system
          </h3>
          <p className="text-sm text-teal/50 dark:text-cream/40">
            You have not been added as an intern by an administrator yet.
          </p>
        </div>
      ) : (
        <>
          {/* ── Date Header + Picker ────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-teal dark:text-cream leading-tight">
                Attendance
              </h2>
              <p className="text-sm text-teal/50 dark:text-cream/40 mt-0.5">
                {displayDate}
              </p>
            </div>

            {/* Date picker */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setUTCDate(d.getUTCDate() - 1);
                  setSelectedDate(d.toISOString().split('T')[0]);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-teal/5 dark:bg-white/5 text-teal/50 dark:text-cream/50 hover:bg-teal/10 dark:hover:bg-white/10 hover:text-teal dark:hover:text-cream transition-all duration-200 cursor-pointer"
                aria-label="Previous day"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="
                  px-3 py-2 text-sm rounded-xl
                  bg-white dark:bg-[#001a22] border border-teal/10 dark:border-white/10
                  text-teal dark:text-cream
                  focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50
                  transition-all duration-200 cursor-pointer
                  [color-scheme:light] dark:[color-scheme:dark]
                "
              />

              <button
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setUTCDate(d.getUTCDate() + 1);
                  setSelectedDate(d.toISOString().split('T')[0]);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-teal/5 dark:bg-white/5 text-teal/50 dark:text-cream/50 hover:bg-teal/10 dark:hover:bg-white/10 hover:text-teal dark:hover:text-cream transition-all duration-200 cursor-pointer"
                aria-label="Next day"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>

              <button
                onClick={() => setShowTimeColumns(!showTimeColumns)}
                className={`ml-2 px-3 py-2 text-xs font-bold rounded-xl transition-all duration-200 border ${
                  showTimeColumns 
                    ? 'bg-teal/10 dark:bg-white/10 text-teal dark:text-cream border-teal/20 dark:border-white/20' 
                    : 'bg-transparent text-teal/50 dark:text-cream/50 border-teal/10 dark:border-white/10 hover:bg-teal/5 dark:hover:bg-white/5'
                }`}
                title={showTimeColumns ? "Hide time columns" : "Show time columns"}
              >
                {showTimeColumns ? 'Hide Times' : 'Show Times'}
              </button>

              {csvDataUri && (
                <a
                  href={csvDataUri}
                  download={`daily_records_${selectedDate}.csv`}
                  className="ml-2 flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl transition-all duration-200 border bg-teal/5 dark:bg-white/5 text-teal dark:text-cream border-teal/10 dark:border-white/10 hover:bg-teal/10 dark:hover:bg-white/10"
                  title="Download records as CSV"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Export CSV
                </a>
              )}

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="ml-2 px-3 py-2 text-xs font-bold rounded-xl transition-all duration-200 border bg-white dark:bg-[#001a22] text-teal dark:text-cream border-teal/10 dark:border-white/10 hover:border-teal/20 dark:hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-gold/30 cursor-pointer"
                title="Sort records"
              >
                <option value="department">Sort by Dept</option>
                <option value="name">Sort by Name</option>
                <option value="time_in">Sort by Time In</option>
              </select>
            </div>
          </div>

          {/* ── Error Banner ────────────────────────────────────── */}
          {error && (
            <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl text-sm text-red-700 dark:text-red-300 animate-fade-in">
              <span className="font-semibold">Error:</span> {error}
            </div>
          )}

          {/* ── Loading Skeletons ───────────────────────────────── */}
          {loading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-56 rounded-2xl border border-teal/5 dark:border-white/5 bg-white dark:bg-[#001a22]"
                  style={{
                    background: 'linear-gradient(90deg, transparent 25%, rgba(0,57,70,0.03) 50%, transparent 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite',
                  }}
                />
              ))}
            </div>
          )}

          {/* ── Empty State ─────────────────────────────────────── */}
          {!loading && displayRecords.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-teal/5 dark:bg-white/5 flex items-center justify-center mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal/30 dark:text-cream/20">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-teal dark:text-cream mb-1">No attendance records</h3>
              <p className="text-sm text-teal/40 dark:text-cream/30">No interns found for this date.</p>
            </div>
          )}

          {/* ── Intern Cards Table ──────────────────────────────── */}
          {!loading && displayRecords.length > 0 && (
            <div className="bg-white dark:bg-[#001a22] rounded-2xl border border-teal/8 dark:border-white/5 shadow-sm overflow-x-auto w-full animate-fade-in">
              <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1000px]">
                <thead>
                  <tr className="bg-teal/5 dark:bg-white/5 border-b border-teal/10 dark:border-white/5">
                    <th className="px-5 py-4 text-[11px] font-bold text-teal/70 dark:text-cream/60 uppercase tracking-wider">
                      Intern
                    </th>
                    {showTimeColumns && (
                      <>
                        <th className="px-5 py-4 text-[11px] font-bold text-teal/70 dark:text-cream/60 uppercase tracking-wider text-center w-[120px]">
                          Time In
                        </th>
                        <th className="px-5 py-4 text-[11px] font-bold text-teal/70 dark:text-cream/60 uppercase tracking-wider text-center w-[120px]">
                          Break Out
                        </th>
                        <th className="px-5 py-4 text-[11px] font-bold text-teal/70 dark:text-cream/60 uppercase tracking-wider text-center w-[120px]">
                          Break In
                        </th>
                        <th className="px-5 py-4 text-[11px] font-bold text-teal/70 dark:text-cream/60 uppercase tracking-wider text-center w-[120px]">
                          Time Out
                        </th>
                        <th className="px-5 py-4 text-[11px] font-bold text-teal/70 dark:text-cream/60 uppercase tracking-wider text-center w-[100px]">
                          Total Hrs
                        </th>
                      </>
                    )}
                    <th className="px-5 py-4 text-[11px] font-bold text-teal/70 dark:text-cream/60 uppercase tracking-wider min-w-[250px]">
                      Daily Record
                    </th>
                    <th className="px-5 py-4 text-[11px] font-bold text-teal/70 dark:text-cream/60 uppercase tracking-wider min-w-[250px]">
                      Admin Feedback
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-teal/5 dark:divide-white/5">
                  {displayRecords.map((record) => (
                    <AttendanceInternCard
                      key={record.intern_name}
                      record={record}
                      onStamp={stampAction}
                      onUndoStamp={undoStampAction}
                      onEditTime={editTimeAction}
                      onTextChange={updateText}
                      isAdmin={isAdmin}
                      showTimeColumns={showTimeColumns}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};
