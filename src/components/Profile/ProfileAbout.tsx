import React from 'react';
import type { Intern } from '../../types';

interface ProfileAboutProps {
  intern: Intern;
  role: string | null;
}

export const ProfileAbout: React.FC<ProfileAboutProps> = ({ intern, role }) => {
  return (
    <div className="bg-[#d9caa8]/30 dark:bg-[#001a22] rounded-3xl border border-teal/10 dark:border-white/5 shadow-sm p-8 animate-fade-in flex flex-col h-full">
      
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
        <div className="mt-8 pt-8 border-t border-teal/10 dark:border-white/5 flex flex-col gap-8">
          
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gold">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <h2 className="text-lg font-bold text-teal dark:text-cream">Interests & Favorites</h2>
          </div>
          
          {/* Favorite Quote */}
          {intern.favorite_quote && (
            <div className="relative py-4 px-6 md:px-12 flex justify-center">
              <blockquote className="relative z-10 text-base md:text-lg italic font-medium text-teal-dark dark:text-cream/90 text-center max-w-2xl">
                "{intern.favorite_quote}"
              </blockquote>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Color & Food */}
            <div className="flex flex-col gap-6">
              {(intern.favorite_color || (intern.favorite_foods && intern.favorite_foods.length > 0)) && (
                <div className="grid grid-cols-2 gap-4">
                  {intern.favorite_color && (
                    <div className="bg-teal/5 dark:bg-white/5 p-4 rounded-xl border border-teal/10 dark:border-white/5">
                      <p className="text-[10px] font-bold text-teal/50 dark:text-cream/40 uppercase tracking-wider mb-1">Favorite Color</p>
                      <p className="text-sm font-semibold text-teal dark:text-cream">{intern.favorite_color}</p>
                    </div>
                  )}
                  {intern.favorite_foods && intern.favorite_foods.length > 0 && (
                    <div className="bg-teal/5 dark:bg-white/5 p-4 rounded-xl border border-teal/10 dark:border-white/5">
                      <p className="text-[10px] font-bold text-teal/50 dark:text-cream/40 uppercase tracking-wider mb-1">Favorite Food</p>
                      <p className="text-sm font-semibold text-teal dark:text-cream">{intern.favorite_foods.join(', ')}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Career Aspirations */}
              {intern.career_aspirations && intern.career_aspirations.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-teal/70 dark:text-cream/60 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal/40 dark:text-cream/40">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                    </svg>
                    Career Aspirations
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {intern.career_aspirations.map((item, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded-lg bg-teal/10 dark:bg-teal-lighter/20 text-xs font-semibold text-teal dark:text-cream border border-teal/15 dark:border-teal-light/30">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Business Interests */}
              {intern.business_interests && intern.business_interests.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-teal/70 dark:text-cream/60 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal/40 dark:text-cream/40">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    </svg>
                    Business Interests
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {intern.business_interests.map((item, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded-lg bg-teal/5 dark:bg-[#002b36] text-xs font-semibold text-teal dark:text-cream border border-teal/10 dark:border-[#003946]">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Movies & Skills to Learn */}
            <div className="flex flex-col gap-6">
              {/* Favorite Movies */}
              {intern.favorite_movies && intern.favorite_movies.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-teal/70 dark:text-cream/60 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal/40 dark:text-cream/40">
                      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                      <line x1="7" y1="2" x2="7" y2="22"></line>
                      <line x1="17" y1="2" x2="17" y2="22"></line>
                      <line x1="2" y1="12" x2="22" y2="12"></line>
                      <line x1="2" y1="7" x2="7" y2="7"></line>
                      <line x1="2" y1="17" x2="7" y2="17"></line>
                      <line x1="17" y1="7" x2="22" y2="7"></line>
                      <line x1="17" y1="17" x2="22" y2="17"></line>
                    </svg>
                    Favorite Movies
                  </h3>
                  <div className="space-y-2">
                    {intern.favorite_movies.map((movie, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg bg-teal/5 dark:bg-white/5 border border-transparent hover:border-teal/10 dark:hover:border-white/10 transition-colors">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-teal/10 dark:bg-white/10 text-[11px] font-bold text-teal dark:text-cream">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-semibold text-teal-dark dark:text-cream/90">{movie}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills to Improve or Learn */}
              {intern.skills_to_learn && intern.skills_to_learn.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-teal/70 dark:text-cream/60 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gold">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                    </svg>
                    Skills to Improve or Learn
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {intern.skills_to_learn.map((item, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded-lg bg-gold/15 dark:bg-gold/10 text-xs font-bold text-teal dark:text-gold border border-gold/30 dark:border-gold/20 shadow-sm shadow-gold/5">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
