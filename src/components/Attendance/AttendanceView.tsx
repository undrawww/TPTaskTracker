import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAttendance } from '../../hooks/useAttendance';
import { AttendanceInternCard } from './AttendanceInternCard';

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
    updateText,
  } = useAttendance();

  const isAdmin = role === 'admin';

  // Filter: interns see only their own card, and hide Administrator invites
  let displayRecords = !isAdmin && currentInternId
    ? records.filter((r) => r.intern?.id === currentInternId)
    : records;
    
  displayRecords = displayRecords.filter(r => r.intern?.full_name !== 'Administrator (Invite)');

  /** Format date for the header display */
  const displayDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
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
                <th className="px-5 py-4 text-[11px] font-bold text-teal/70 dark:text-cream/60 uppercase tracking-wider min-w-[250px]">
                  Accomplishments
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
                  onTextChange={updateText}
                  isAdmin={isAdmin}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
