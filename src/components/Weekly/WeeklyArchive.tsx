import React, { useState } from 'react';
import { DepartmentPanel } from '../Dashboard/DepartmentPanel';
import { useWeeklyTasks } from '../../hooks/useWeeklyTasks';
import { DEPARTMENTS, type Intern, type TaskStatus } from '../../types';

interface Props {
  interns: Intern[];
  activeCommentTaskId?: string | null;
  setActiveCommentTaskId?: (id: string | null) => void;
}

export const WeeklyArchive: React.FC<Props> = ({ interns, activeCommentTaskId, setActiveCommentTaskId }) => {
  const [selectedWeek, setSelectedWeek] = useState(1);
  const { tasks, loading, updateStatus, toggleVerify } = useWeeklyTasks(selectedWeek);

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    await updateStatus(taskId, status);
  };

  const handleVerifyChange = async (taskId: string, isVerified: boolean) => {
    await toggleVerify(taskId, isVerified);
  };

  return (
    <section id="weekly-archive">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
          <h2 className="text-lg font-bold text-teal dark:text-cream">Weekly Assigned Tasks</h2>
          <div className="flex-1 h-px bg-teal/10 hidden sm:block" />

          {/* Week selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="week-select" className="text-xs font-semibold text-teal/50 dark:text-cream/50 uppercase tracking-wider">
              Select Week
            </label>
            <select
              id="week-select"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl border border-cream-dark dark:border-teal-light bg-white dark:bg-[#003946] text-teal dark:text-cream text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all appearance-none cursor-pointer"
            >
              {Array.from({ length: 16 }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w}>
                  Week {w}
                </option>
              ))}
            </select>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-teal/40 dark:text-cream/40">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm font-medium">Loading week {selectedWeek} tasks…</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {DEPARTMENTS.map((dept) => (
            <DepartmentPanel
              key={dept}
              department={dept}
              interns={interns}
              tasks={tasks}
              onStatusChange={handleStatusChange}
              onVerifyChange={handleVerifyChange}
              activeCommentTaskId={activeCommentTaskId}
              setActiveCommentTaskId={setActiveCommentTaskId}
            />
          ))}
        </div>
      )}
    </section>
  );
};
