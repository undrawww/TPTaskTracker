import React from 'react';
import { useInterns } from '../../hooks/useInterns';

export const InternsDirectory: React.FC = () => {
  const { interns, loading, error } = useInterns();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-teal dark:text-cream leading-tight">Interns</h2>
          <p className="text-sm text-teal/50 dark:text-cream/40 mt-0.5">
            Manage and view detailed profiles for all your interns.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-teal/20 border-t-teal dark:border-white/10 dark:border-t-gold animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-status-hold-bg border border-status-hold/20 rounded-xl p-4 text-status-hold text-sm">
          {error}
        </div>
      ) : interns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-teal/5 dark:bg-[#002833]/50 rounded-2xl border border-teal/10 dark:border-white/5">
          <div className="w-16 h-16 rounded-2xl bg-teal/10 dark:bg-white/5 flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal/40 dark:text-cream/30">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="17" y1="8" x2="23" y2="14" />
              <line x1="23" y1="8" x2="17" y2="14" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-teal dark:text-cream mb-1">No interns found</h3>
          <p className="text-sm text-teal/50 dark:text-cream/40">You don't have any interns assigned to your workspace.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#001a22] rounded-2xl border border-teal/8 dark:border-white/5 shadow-sm overflow-x-auto w-full animate-fade-in">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1000px]">
            <thead>
              <tr className="bg-teal/5 dark:bg-white/5 border-b border-teal/10 dark:border-white/5">
                <th className="px-5 py-4 text-[10px] font-bold text-teal/40 dark:text-cream/30 uppercase tracking-[0.2em] w-[250px]">Intern</th>
                <th className="px-5 py-4 text-[10px] font-bold text-teal/40 dark:text-cream/30 uppercase tracking-[0.2em]">Team Email</th>
                <th className="px-5 py-4 text-[10px] font-bold text-teal/40 dark:text-cream/30 uppercase tracking-[0.2em]">Personal Email</th>
                <th className="px-5 py-4 text-[10px] font-bold text-teal/40 dark:text-cream/30 uppercase tracking-[0.2em]">Contact Number</th>
                <th className="px-5 py-4 text-[10px] font-bold text-teal/40 dark:text-cream/30 uppercase tracking-[0.2em]">School</th>
                <th className="px-5 py-4 text-[10px] font-bold text-teal/40 dark:text-cream/30 uppercase tracking-[0.2em]">Program</th>
                <th className="px-5 py-4 text-[10px] font-bold text-teal/40 dark:text-cream/30 uppercase tracking-[0.2em]">Graduation</th>
                <th className="px-5 py-4 text-[10px] font-bold text-teal/40 dark:text-cream/30 uppercase tracking-[0.2em]">Req. Hours</th>
                <th className="px-5 py-4 text-[10px] font-bold text-teal/40 dark:text-cream/30 uppercase tracking-[0.2em]">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-teal/5 dark:divide-white/5">
              {interns.map((intern) => (
                <tr key={intern.id} className="hover:bg-teal/5 dark:hover:bg-white/5 transition-colors duration-200">
                  <td className="px-5 py-4 align-middle">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-teal dark:text-cream">{intern.full_name}</span>
                      <span className="text-[11px] text-teal/60 dark:text-cream/50 mt-0.5">{intern.department}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 align-middle">
                    <span className="text-[13px] text-teal/80 dark:text-cream/80">{intern.email || '—'}</span>
                  </td>
                  <td className="px-5 py-4 align-middle">
                    {intern.personal_email ? (
                      <span className="text-[13px] text-teal/80 dark:text-cream/80">{intern.personal_email}</span>
                    ) : (
                      <span className="text-xs text-teal/30 dark:text-cream/20 italic">Not provided</span>
                    )}
                  </td>
                  <td className="px-5 py-4 align-middle">
                    <div className="flex flex-col gap-1">
                      {intern.contact_number ? (
                        <span className="text-[12px] text-teal/60 dark:text-cream/60">{intern.contact_number}</span>
                      ) : (
                        <span className="text-xs text-teal/30 dark:text-cream/20 italic">Not provided</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 align-middle">
                    <span className="text-[13px] text-teal dark:text-cream">{intern.school || <span className="text-teal/30 dark:text-cream/20 italic text-xs">Not provided</span>}</span>
                  </td>
                  <td className="px-5 py-4 align-middle">
                    <div className="flex flex-col">
                      <span className="text-[13px] text-teal dark:text-cream">{intern.program || <span className="text-teal/30 dark:text-cream/20 italic text-xs">Not provided</span>}</span>
                      {intern.current_year && <span className="text-[11px] text-teal/60 dark:text-cream/50 mt-0.5">{intern.current_year}</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4 align-middle">
                    <span className="text-[13px] text-teal dark:text-cream">{intern.expected_graduation_date || '—'}</span>
                  </td>
                  <td className="px-5 py-4 align-middle">
                    <span className="text-[13px] font-semibold text-teal dark:text-cream">{intern.required_hours ? `${intern.required_hours} hrs` : '—'}</span>
                  </td>
                  <td className="px-5 py-4 align-middle">
                    <span className="text-[13px] text-teal dark:text-cream">{intern.location || '—'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
