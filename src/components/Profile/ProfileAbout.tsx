import React from 'react';
import type { Intern } from '../../types';

interface ProfileAboutProps {
  intern: Intern;
  role: string | null;
}

export const ProfileAbout: React.FC<ProfileAboutProps> = ({ intern, role }) => {
  return (
    <div className="bg-[#d9caa8]/30 dark:bg-[#001a22] rounded-3xl border border-teal/10 dark:border-white/5 shadow-sm p-8 animate-fade-in flex flex-col h-full">
      
      <div className="flex items-center gap-2 mb-4">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal/40 dark:text-cream/40">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <h2 className="text-lg font-bold text-teal dark:text-cream">About Me</h2>
      </div>
      
      <p className="text-sm text-teal-dark dark:text-cream/80 leading-relaxed mb-8">
        {intern.bio || "No bio provided."}
      </p>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div>
          <p className="text-[11px] font-bold text-teal/50 dark:text-cream/40 uppercase tracking-wider mb-1">Department</p>
          <p className="text-sm font-semibold text-teal dark:text-cream">{intern.department}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold text-teal/50 dark:text-cream/40 uppercase tracking-wider mb-1">Role</p>
          <p className="text-sm font-semibold text-teal dark:text-cream">
            {role === 'admin' ? 'Administrator' : 'Intern'}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-bold text-teal/50 dark:text-cream/40 uppercase tracking-wider mb-1">School</p>
          <p className="text-sm font-semibold text-teal dark:text-cream">{intern.school || '-'}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold text-teal/50 dark:text-cream/40 uppercase tracking-wider mb-1">Course / Year</p>
          <p className="text-sm font-semibold text-teal dark:text-cream">
            {intern.program || '-'} {intern.current_year ? `(${intern.current_year})` : ''}
          </p>
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-teal/10 dark:border-white/5">
        <div className="flex items-center gap-2 mb-4">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal/40 dark:text-cream/40">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
          <h3 className="text-sm font-bold text-teal dark:text-cream">Skills</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {intern.skills && intern.skills.length > 0 ? (
            intern.skills.map((skill, idx) => (
              <span key={idx} className="px-3 py-1.5 rounded-lg bg-teal/5 dark:bg-white/5 text-xs font-semibold text-teal dark:text-cream border border-teal/10 dark:border-white/5">
                {skill}
              </span>
            ))
          ) : (
            <span className="text-xs text-teal/50 dark:text-cream/40">No skills added</span>
          )}
        </div>
      </div>

    </div>
  );
};
