import React, { useMemo, useState } from 'react';
import type { DailyTask, AttendanceRecord } from '../../types';

interface ProfileActivityProps {
  tasks: DailyTask[];
  attendance: AttendanceRecord[];
}

type ActivityItem = {
  id: string;
  type: 'task' | 'record' | 'feedback';
  title: string;
  date: string;
  icon: React.ReactNode;
  colorClass: string;
};

export const ProfileActivity: React.FC<ProfileActivityProps> = ({ tasks, attendance }) => {
  const [showAll, setShowAll] = useState(false);

  const allActivities = useMemo(() => {
    const items: ActivityItem[] = [];

    // Parse Tasks
    tasks.forEach(t => {
      if (t.is_verified) {
        items.push({
          id: `task-${t.id}`,
          type: 'task',
          title: `Completed task: ${t.task_name}`,
          date: t.task_date,
          icon: <polyline points="20 6 9 17 4 12"></polyline>,
          colorClass: 'bg-status-done text-white',
        });
      }
    });

    // Parse Attendance Records & Feedback
    attendance.forEach(a => {
      if (a.accomplishments) {
        items.push({
          id: `record-${a.id}`,
          type: 'record',
          title: 'Submitted a daily record',
          date: a.attendance_date,
          icon: <><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></>,
          colorClass: 'bg-teal-light dark:bg-gold text-white dark:text-[#001a22]',
        });
      }
      if (a.admin_feedback) {
        items.push({
          id: `feedback-${a.id}`,
          type: 'feedback',
          title: 'Received admin feedback',
          date: a.attendance_date,
          icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>,
          colorClass: 'bg-[#e28743] text-white',
        });
      }
    });

    // Sort descending
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [tasks, attendance]);

  const displayedActivities = showAll ? allActivities : allActivities.slice(0, 5);

  return (
    <div className="bg-white dark:bg-[#001a22] rounded-3xl border border-teal/10 dark:border-white/5 shadow-sm p-8 animate-fade-in flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal/40 dark:text-cream/40">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <h2 className="text-lg font-bold text-teal dark:text-cream">Recent Activity</h2>
        </div>
        {allActivities.length > 5 && (
          <button 
            onClick={() => setShowAll(!showAll)}
            className="text-xs font-bold text-teal/60 dark:text-gold hover:text-teal dark:hover:text-gold-light transition-colors flex items-center gap-1"
          >
            {showAll ? 'View Less' : 'View All'}
            <svg 
              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              className={`transition-transform duration-200 ${showAll ? 'rotate-180' : ''}`}
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        )}
      </div>

      <div className={`flex flex-col gap-4 relative ${showAll ? 'overflow-y-auto pr-2 scrollbar-hide' : ''}`}>
        {displayedActivities.length === 0 ? (
          <p className="text-sm text-teal/50 dark:text-cream/40 py-4 text-center">No recent activity</p>
        ) : (
          <>
            <div className="absolute left-[19px] top-4 bottom-4 w-px bg-teal/10 dark:bg-white/10" />
            {displayedActivities.map((activity) => (
              <div key={activity.id} className="flex gap-4 relative z-10 group">
                <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center shadow-sm ${activity.colorClass}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    {activity.icon}
                  </svg>
                </div>
                <div className="pt-1.5 pb-2">
                  <p className="text-sm font-bold text-teal dark:text-cream group-hover:text-teal-light dark:group-hover:text-gold transition-colors">
                    {activity.title}
                  </p>
                  <p className="text-[11px] font-semibold text-teal/50 dark:text-cream/40 mt-0.5">
                    {new Date(activity.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};
