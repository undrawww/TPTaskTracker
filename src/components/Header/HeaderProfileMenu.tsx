import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { renderAvatar } from '../Dashboard/AvatarIcons';

import { useNavigate } from 'react-router-dom';

import type { Intern } from '../../types';



interface Props {
  onLogout: () => void;
  onViewMyProfile?: () => void;
  currentUser?: Intern;
  showCharts?: boolean;
  onToggleCharts?: () => void;
  showWeeklyArchive?: boolean;
  onToggleWeeklyArchive?: () => void;
}

export const HeaderProfileMenu: React.FC<Props> = ({ onLogout, onViewMyProfile, currentUser, showCharts, onToggleCharts, showWeeklyArchive, onToggleWeeklyArchive }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [avatarIdx, setAvatarIdx] = useState(() => {
    if (currentUser?.avatar_index !== undefined) return currentUser.avatar_index;
    const val = localStorage.getItem('tp_avatar');
    return val !== null ? parseInt(val, 10) : 0;
  });
  
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(() => {
    if (currentUser?.avatar_url) return currentUser.avatar_url;
    return user?.user_metadata?.avatar_url || localStorage.getItem('tp_avatar_url') || undefined;
  });

  const [displayName, setDisplayName] = useState(() => {
    if (currentUser?.full_name) return currentUser.full_name;
    const rawName = localStorage.getItem('tp_avatar_name') || user?.user_metadata?.full_name;
    if (rawName) return rawName;
    return user?.email?.split('@')[0] || 'User';
  });

  // Keep synced with currentUser if it updates from the database
  useEffect(() => {
    if (currentUser) {
      if (currentUser.avatar_index !== undefined) setAvatarIdx(currentUser.avatar_index);
      if (currentUser.avatar_url) setAvatarUrl(currentUser.avatar_url);
      if (currentUser.full_name) setDisplayName(currentUser.full_name);
    }
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update when user loads or metadata changes
  useEffect(() => {
    if (user) {
      if (user.user_metadata?.avatar_url) {
        setAvatarUrl(user.user_metadata.avatar_url);
        localStorage.setItem('tp_avatar_url', user.user_metadata.avatar_url);
      } else if (localStorage.getItem('tp_avatar_url')) {
        setAvatarUrl(localStorage.getItem('tp_avatar_url') || undefined);
      }
      
      if (user.user_metadata?.full_name) {
        setDisplayName(user.user_metadata.full_name);
        localStorage.setItem('tp_avatar_name', user.user_metadata.full_name);
      }
    }
  }, [user]);

  // Listen for avatar changes from the ProfileModal
  useEffect(() => {
    const handler = () => {
      const val = localStorage.getItem('tp_avatar');
      setAvatarIdx(val !== null ? parseInt(val, 10) : 0);
      
      setAvatarUrl(localStorage.getItem('tp_avatar_url') || undefined);
      
      const rawName = localStorage.getItem('tp_avatar_name');
      if (rawName) {
        setDisplayName(rawName);
      }
    };
    window.addEventListener('avatar-change', handler);
    return () => window.removeEventListener('avatar-change', handler);
  }, []);

  // Toggle component for reuse
  const Toggle = ({ enabled }: { enabled: boolean }) => (
    <div className="shrink-0 pointer-events-none">
      <div className={`w-8 h-[18px] rounded-full transition-colors duration-200 relative ${
        enabled ? 'bg-teal dark:bg-gold' : 'bg-teal/20 dark:bg-white/15'
      }`}>
        <div className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform duration-200 ${
          enabled ? 'translate-x-[16px]' : 'translate-x-[2px]'
        }`} />
      </div>
    </div>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => { setIsOpen(!isOpen); setShowSettings(false); }}
        className="w-10 h-10 rounded-full flex items-center justify-center hover:ring-2 hover:ring-white/30 transition-all shadow-md shadow-black/10 hover:shadow-lg hover:shadow-black/20 focus:outline-none active:scale-95"
      >
        <div className="w-10 h-10 rounded-full border-2 border-white/20 overflow-hidden flex items-center justify-center shrink-0">
          {renderAvatar(avatarIdx, avatarUrl)}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#082026] rounded-2xl shadow-xl border border-cream-dark dark:border-teal-light py-2 z-50 animate-slide-up overflow-hidden">
          
          {/* Settings Sub-panel */}
          {showSettings ? (
            <>
              {/* Back button header */}
              <div className="px-4 py-3 border-b border-cream-dark dark:border-teal-light flex items-center gap-3">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex items-center justify-center w-6 h-6 rounded-lg hover:bg-cream/50 dark:hover:bg-[#003946] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal dark:text-cream">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <p className="text-sm font-semibold text-teal dark:text-cream">Settings</p>
              </div>

              {/* Visibility toggles */}
              <div className="py-1">
                <div className="px-4 py-2">
                  <p className="text-[10px] font-bold text-teal/40 dark:text-cream/40 uppercase tracking-[0.15em]">Visibility</p>
                </div>

                {onToggleCharts && (
                  <div
                    className="w-full px-4 py-2 text-sm font-medium text-teal dark:text-cream/90 hover:bg-cream/50 dark:hover:bg-[#003946] transition-colors flex items-center justify-between gap-3 cursor-pointer"
                    onClick={onToggleCharts}
                  >
                    <span className="flex items-center gap-3">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                      </svg>
                      Charts
                    </span>
                    <Toggle enabled={!!showCharts} />
                  </div>
                )}

                {onToggleWeeklyArchive && (
                  <div
                    className="w-full px-4 py-2 text-sm font-medium text-teal dark:text-cream/90 hover:bg-cream/50 dark:hover:bg-[#003946] transition-colors flex items-center justify-between gap-3 cursor-pointer"
                    onClick={onToggleWeeklyArchive}
                  >
                    <span className="flex items-center gap-3">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      Weekly Archive
                    </span>
                    <Toggle enabled={!!showWeeklyArchive} />
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Main menu */
            <>
              <div className="px-4 py-3 border-b border-cream-dark dark:border-teal-light">
                <p className="text-sm font-semibold text-teal dark:text-cream truncate">
                  {displayName}
                </p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    if (onViewMyProfile) {
                      onViewMyProfile();
                    } else {
                      navigate('/profile');
                    }
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-teal dark:text-cream/90 hover:bg-cream/50 dark:hover:bg-[#003946] transition-colors flex items-center gap-3"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Profile
                </button>
                <button
                  onClick={toggleTheme}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-teal dark:text-cream/90 hover:bg-cream/50 dark:hover:bg-[#003946] transition-colors flex items-center gap-3"
                >
                  {theme === 'light' ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="5"></circle>
                      <line x1="12" y1="1" x2="12" y2="3"></line>
                      <line x1="12" y1="21" x2="12" y2="23"></line>
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                      <line x1="1" y1="12" x2="3" y2="12"></line>
                      <line x1="21" y1="12" x2="23" y2="12"></line>
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </svg>
                  )}
                  {theme === 'light' ? 'Dark Theme' : 'Light Theme'}
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-teal dark:text-cream/90 hover:bg-cream/50 dark:hover:bg-[#003946] transition-colors flex items-center gap-3"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                  </svg>
                  Settings
                </button>
              </div>

              <div className="pt-1 mt-1 border-t border-cream-dark dark:border-teal-light">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    localStorage.removeItem('tp_avatar');
                    localStorage.removeItem('tp_avatar_name');
                    onLogout();
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-semibold text-status-hold dark:text-status-hold hover:bg-status-hold-bg dark:hover:bg-status-hold/10 transition-colors flex items-center gap-3"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
