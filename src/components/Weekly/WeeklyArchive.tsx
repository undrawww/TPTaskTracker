import React, { useState } from 'react';
import { useTaskHistory } from '../../hooks/useTaskHistory';
import { type Intern } from '../../types';
import { CustomDropdown } from '../common/CustomDropdown';

interface Props {
  interns: Intern[];
}

export const WeeklyArchive: React.FC<Props> = ({ interns }) => {
  const [selectedInternId, setSelectedInternId] = useState<string | null>(interns.length > 0 ? interns[0].id : null);
  const [selectedWeek, setSelectedWeek] = useState<number | 'all'>('all');
  
  const { tasks, loading } = useTaskHistory(selectedInternId, selectedWeek);

  const sortedInterns = [...interns].sort((a, b) => a.full_name.localeCompare(b.full_name));

  const studentOptions = sortedInterns.map(i => ({ label: i.full_name, value: i.id }));
  const weekOptions = [
    { label: 'All Weeks', value: 'all' },
    ...Array.from({ length: 16 }, (_, i) => ({ label: `Week ${i + 1}`, value: i + 1 }))
  ];

  return (
    <section id="weekly-archive" className="bg-white/50 dark:bg-[#002b36]/50 rounded-2xl p-6 border border-teal/10 dark:border-white/5 shadow-sm">
      {/* Section header & filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-teal dark:text-cream">Task History</h2>
          <p className="text-sm text-teal/60 dark:text-cream/50 mt-1">Centralized archive of all completed tasks</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Student selector */}
          <div className="flex items-center gap-2">
            <CustomDropdown
              value={selectedInternId}
              onChange={setSelectedInternId}
              options={studentOptions}
              placeholder="Select Member"
            />
          </div>

          {/* Week selector */}
          <div className="flex items-center gap-2">
            <CustomDropdown
              value={selectedWeek}
              onChange={setSelectedWeek}
              options={weekOptions}
              placeholder="Select Week"
            />
          </div>
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
            <span className="text-sm font-medium">Loading history...</span>
          </div>
        </div>
      ) : !selectedInternId ? (
        <div className="text-center py-12 text-teal/50 dark:text-cream/50">
          <p>Please select a student to view their task history.</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 text-teal/50 dark:text-cream/50">
          <p>No completed tasks found for this selection.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-cream-dark/50 dark:border-teal-light/30">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-cream-dark/20 dark:bg-[#003946]/50 text-teal dark:text-cream/80 text-sm border-b border-cream-dark/50 dark:border-teal-light/30">
                <th className="py-3 px-4 font-semibold w-1/3">Task Name</th>
                <th className="py-3 px-4 font-semibold w-1/5">Week</th>
                <th className="py-3 px-4 font-semibold w-1/5">Date Assigned</th>
                <th className="py-3 px-4 font-semibold w-1/5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-dark/30 dark:divide-teal-light/20">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-teal/5 dark:hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-teal dark:text-white">
                    {task.task_name}
                  </td>
                  <td className="py-3 px-4 text-sm text-teal/70 dark:text-cream/70">
                    {task.week_number ? `Week ${task.week_number}` : '-'}
                  </td>
                  <td className="py-3 px-4 text-sm text-teal/70 dark:text-cream/70">
                    {task.task_date 
                      ? new Date(task.task_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '-'}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#dcfce7] text-[#166534] dark:bg-[#064e3b] dark:text-[#34d399] border border-[#bbf7d0] dark:border-[#059669]">
                      <div className="w-1.5 h-1.5 rounded-full bg-current" />
                      <span className="font-semibold text-xs tracking-wide">Done</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
