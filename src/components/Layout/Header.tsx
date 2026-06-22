import React from 'react';

export const Header: React.FC = () => {
  const today = new Date();
  const formatted = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="bg-teal text-white shadow-lg">
      <div className="max-w-[1440px] mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Logo mark */}
          <div className="w-10 h-10 rounded-xl bg-gold flex items-center justify-center shadow-md">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#003946" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-tight">
              Team Padua <span className="text-gold">Tracker</span>
            </h1>
            <p className="text-xs text-white/60 font-medium tracking-wide uppercase">
              Internship Dashboard
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-sm text-white/70">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>{formatted}</span>
        </div>
      </div>
    </header>
  );
};
