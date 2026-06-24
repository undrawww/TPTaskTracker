import React from 'react';
import type { AttendanceRecord } from '../../types';

interface ProfileAdminFeedbackProps {
  attendance: AttendanceRecord[];
}

export const ProfileAdminFeedback: React.FC<ProfileAdminFeedbackProps> = ({ attendance }) => {
  const feedbacks = attendance
    .filter(a => a.admin_feedback && a.admin_feedback.trim().length > 0)
    .sort((a, b) => new Date(b.attendance_date).getTime() - new Date(a.attendance_date).getTime());

  return (
    <div className="bg-[#d9caa8]/30 dark:bg-[#001a22] rounded-3xl border border-teal/10 dark:border-white/5 shadow-sm p-8 animate-fade-in flex flex-col h-full col-span-1 md:col-span-2 lg:col-span-3">
      <div className="flex items-center gap-2 mb-6">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal/40 dark:text-cream/40">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <h2 className="text-lg font-bold text-teal dark:text-cream">Admin Feedback</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {feedbacks.length === 0 ? (
          <p className="text-sm text-teal/50 dark:text-cream/40 col-span-full">No feedback received yet.</p>
        ) : (
          feedbacks.map(f => (
            <div key={f.id} className="bg-white dark:bg-white/5 rounded-2xl p-5 border border-teal/10 dark:border-white/5 shadow-sm">
              <div className="flex items-center justify-between mb-3 border-b border-teal/5 dark:border-white/5 pb-2">
                <span className="text-[11px] font-bold text-teal/60 dark:text-cream/50 uppercase tracking-wider">
                  {new Date(f.attendance_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <p className="text-sm text-teal-dark dark:text-cream whitespace-pre-wrap leading-relaxed">
                {f.admin_feedback}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
