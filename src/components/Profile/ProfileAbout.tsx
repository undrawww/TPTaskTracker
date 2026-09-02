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
        <div>
          <p className="text-[11px] font-bold text-teal/50 dark:text-cream/40 uppercase tracking-wider mb-1">Businesses</p>
          <p className="text-sm font-semibold text-teal dark:text-cream">{intern.businesses?.join(', ') || '-'}</p>
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

      {/* ── Interests & Favorites ──────────────────────── */}
      {(intern.favorite_quote || intern.favorite_color || (intern.favorite_foods && intern.favorite_foods.length > 0) || (intern.favorite_movies && intern.favorite_movies.length > 0) || (intern.career_aspirations && intern.career_aspirations.length > 0) || (intern.business_interests && intern.business_interests.length > 0) || (intern.skills_to_learn && intern.skills_to_learn.length > 0)) && (
        <div className="mt-6 pt-6 border-t border-teal/10 dark:border-white/5 space-y-6">
          
          {/* Favorite Quote */}
          {intern.favorite_quote && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal/40 dark:text-cream/40">
                  <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21"></path>
                  <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3"></path>
                </svg>
                <h3 className="text-sm font-bold text-teal dark:text-cream">Favorite Quote</h3>
              </div>
              <blockquote className="pl-4 border-l-2 border-gold/40 dark:border-gold/30 italic text-sm text-teal-dark/80 dark:text-cream/70 leading-relaxed">
                "{intern.favorite_quote}"
              </blockquote>
            </div>
          )}

          {/* Favorite Color & Food */}
          {(intern.favorite_color || (intern.favorite_foods && intern.favorite_foods.length > 0)) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {intern.favorite_color && (
                <div>
                  <p className="text-[11px] font-bold text-teal/50 dark:text-cream/40 uppercase tracking-wider mb-1">Favorite Color</p>
                  <p className="text-sm font-semibold text-teal dark:text-cream">{intern.favorite_color}</p>
                </div>
              )}
              {intern.favorite_foods && intern.favorite_foods.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-teal/50 dark:text-cream/40 uppercase tracking-wider mb-1">Favorite Food</p>
                  <p className="text-sm font-semibold text-teal dark:text-cream">{intern.favorite_foods.join(', ')}</p>
                </div>
              )}
            </div>
          )}

          {/* Favorite Movies */}
          {intern.favorite_movies && intern.favorite_movies.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal/40 dark:text-cream/40">
                  <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                  <line x1="7" y1="2" x2="7" y2="22"></line>
                  <line x1="17" y1="2" x2="17" y2="22"></line>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <line x1="2" y1="7" x2="7" y2="7"></line>
                  <line x1="2" y1="17" x2="7" y2="17"></line>
                  <line x1="17" y1="7" x2="22" y2="7"></line>
                  <line x1="17" y1="17" x2="22" y2="17"></line>
                </svg>
                <h3 className="text-sm font-bold text-teal dark:text-cream">Favorite Movies of All Time</h3>
              </div>
              <ol className="list-decimal list-inside space-y-1 pl-1">
                {intern.favorite_movies.map((movie, idx) => (
                  <li key={idx} className="text-sm text-teal-dark/80 dark:text-cream/80">{movie}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Career Aspirations */}
          {intern.career_aspirations && intern.career_aspirations.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal/40 dark:text-cream/40">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                <h3 className="text-sm font-bold text-teal dark:text-cream">Career Aspirations</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {intern.career_aspirations.map((item, idx) => (
                  <span key={idx} className="px-3 py-1.5 rounded-lg bg-teal/5 dark:bg-white/5 text-xs font-semibold text-teal dark:text-cream border border-teal/10 dark:border-white/5">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Business Interests */}
          {intern.business_interests && intern.business_interests.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal/40 dark:text-cream/40">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
                <h3 className="text-sm font-bold text-teal dark:text-cream">Business Interests</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {intern.business_interests.map((item, idx) => (
                  <span key={idx} className="px-3 py-1.5 rounded-lg bg-teal/5 dark:bg-white/5 text-xs font-semibold text-teal dark:text-cream border border-teal/10 dark:border-white/5">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Skills to Improve or Learn */}
          {intern.skills_to_learn && intern.skills_to_learn.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal/40 dark:text-cream/40">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
                <h3 className="text-sm font-bold text-teal dark:text-cream">Skills to Improve or Learn</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {intern.skills_to_learn.map((item, idx) => (
                  <span key={idx} className="px-3 py-1.5 rounded-lg bg-gold/10 dark:bg-gold/10 text-xs font-semibold text-teal dark:text-cream border border-gold/20 dark:border-gold/15">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
