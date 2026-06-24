import React from 'react';

interface SidebarProps {
  activeView: 'tracker' | 'attendance' | 'interns';
  onViewChange: (view: 'tracker' | 'attendance' | 'interns') => void;
  collapsed: boolean;
  onToggle: () => void;
  isAdmin: boolean;
  isMobileMenuOpen?: boolean;
  onMobileClose?: () => void;
  todayTotal?: number;
  completedTotal?: number;
}

const NAV_ITEMS: { key: 'tracker' | 'attendance' | 'interns'; label: string; icon: React.ReactNode }[] = [
  {
    key: 'tracker',
    label: 'Task Tracker',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="2" />
        <path d="M9 14l2 2 4-4" />
      </svg>
    ),
  },
  {
    key: 'attendance',
    label: 'Attendance',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    key: 'interns',
    label: 'Interns',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, collapsed, onToggle, isAdmin, isMobileMenuOpen = false, onMobileClose, todayTotal = 0, completedTotal = 0 }) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 min-[769px]:hidden"
          onClick={onMobileClose}
        />
      )}
      
      <aside
        className={`
          flex flex-col shrink-0
          bg-[#d9caa8] dark:bg-[#00151a]
          border-r border-teal/10 dark:border-white/5
          transition-all duration-300 ease-in-out
          h-screen overflow-y-auto scrollbar-hide
          
          /* Mobile behavior: fixed drawer */
          max-[768px]:fixed max-[768px]:inset-y-0 max-[768px]:left-0 max-[768px]:z-50 max-[768px]:transform max-[768px]:w-64
          ${isMobileMenuOpen ? 'max-[768px]:translate-x-0' : 'max-[768px]:-translate-x-full'}
          
          /* Desktop behavior: sticky column */
          min-[769px]:relative min-[769px]:translate-x-0 min-[769px]:sticky min-[769px]:top-0
          ${collapsed ? 'min-[769px]:w-16' : 'min-[769px]:w-56'}
        `}
      >
      {/* Branding Logo & Toggle */}
      <div 
        onClick={() => {
          if (window.innerWidth > 768) {
            onToggle();
          }
        }}
        className={`w-full flex items-center pt-5 pb-4 border-b border-teal/10 dark:border-white/5 transition-all duration-300 min-[769px]:hover:bg-teal/5 min-[769px]:dark:hover:bg-white/5 min-[769px]:cursor-pointer text-left ${collapsed ? 'px-4 gap-0' : 'px-4 gap-3'}`}
        role="button"
        tabIndex={0}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <div className="w-8 h-8 shrink-0 flex items-center justify-center">
          <img src="https://res.cloudinary.com/dqmmfgbf1/image/upload/v1782145581/ICOZ_aatvaa.png" alt="Logo" className="w-8 h-8 object-contain" />
        </div>
        <div className={`transition-all duration-300 overflow-hidden flex flex-col justify-center ${collapsed ? 'max-w-0 opacity-0' : 'max-w-[150px] opacity-100'}`}>
          <h1 className="font-poppins text-sm font-bold tracking-tight leading-tight text-teal dark:text-white whitespace-nowrap">
            Team Padua <span className="text-gold">Tracker</span>
          </h1>
          <p className="text-[8px] text-teal/50 dark:text-white/50 font-bold tracking-[0.15em] uppercase whitespace-nowrap mt-0.5">
            Internship Dashboard
          </p>
        </div>
      </div>

      {/* Mini Stat Cards */}
      <div className={`flex flex-col gap-2 px-3 pt-4 transition-all duration-300 ${collapsed ? 'opacity-0 h-0 overflow-hidden pt-0' : 'opacity-100 h-auto'}`}>
        <div className="bg-teal/5 dark:bg-white/5 rounded-xl p-3 border border-teal/10 dark:border-white/5 relative overflow-hidden group">
          <div className="absolute right-2 top-2 text-teal/10 dark:text-white/10 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-300">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-teal/60 dark:text-white/60 uppercase tracking-wider mb-0.5">Today's Total Tasks</p>
            <p className="text-xl font-poppins font-bold text-teal dark:text-white">{todayTotal}</p>
          </div>
        </div>

        <div className="bg-teal/5 dark:bg-white/5 rounded-xl p-3 border border-teal/10 dark:border-white/5 relative overflow-hidden group mt-2">
          <div className="absolute right-2 top-2 text-gold/20 dark:text-gold/20 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-300">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-gold/80 dark:text-gold/80 uppercase tracking-wider mb-0.5">Verified Completed</p>
            <p className="text-xl font-poppins font-bold text-gold">{completedTotal}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 px-2 mt-4">
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.key;
          return (
            <button
              key={item.key}
              id={`nav-${item.key}`}
              onClick={() => {
                onViewChange(item.key);
                onMobileClose?.();
              }}
              className={`
                group relative flex items-center justify-start
                rounded-xl py-3
                transition-all duration-300 cursor-pointer overflow-hidden
                ${collapsed ? 'px-[14px] gap-0' : 'px-3 gap-3'}
                ${isActive
                  ? 'bg-teal/5 dark:bg-white/10 text-teal dark:text-gold shadow-sm'
                  : 'text-teal/50 dark:text-white/50 hover:text-teal/80 dark:hover:text-white/80 hover:bg-teal/5 dark:hover:bg-white/5'
                }
              `}
              title={collapsed ? item.label : undefined}
            >
              {/* Active indicator bar */}
              <div
                className={`
                  absolute left-0 top-1/2 -translate-y-1/2
                  w-[3px] rounded-r-full
                  transition-all duration-300
                  ${isActive ? 'h-6 bg-teal dark:bg-gold' : 'h-0 bg-transparent'}
                `}
              />

              {/* Icon */}
              <span className={`shrink-0 transition-colors duration-200 ${isActive ? 'text-teal dark:text-gold' : ''}`}>
                {item.icon}
              </span>

              {/* Label */}
              <span
                className={`
                  text-sm font-medium whitespace-nowrap
                  transition-all duration-300
                  ${collapsed ? 'max-w-0 opacity-0' : 'max-w-[150px] opacity-100'}
                `}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom branding */}
      <div className={`px-3 py-4 border-t border-teal/10 dark:border-white/5 ${collapsed ? 'hidden min-[769px]:hidden' : ''}`}>
        <p className="text-[10px] text-teal/30 dark:text-white/20 font-medium tracking-wider uppercase">
          TeamPadua v2
        </p>
      </div>
    </aside>
    </>
  );
};
