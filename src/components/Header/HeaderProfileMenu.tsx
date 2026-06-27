import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { renderAvatar } from '../Dashboard/AvatarIcons';

import { useNavigate } from 'react-router-dom';

interface Props {
  onLogout: () => void;
  onViewMyProfile?: () => void;
}

export const HeaderProfileMenu: React.FC<Props> = ({ onLogout, onViewMyProfile }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [avatarIdx, setAvatarIdx] = useState(() => {
    const val = localStorage.getItem('tp_avatar');
    return val !== null ? parseInt(val, 10) : 0;
  });
  
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(() => {
    return localStorage.getItem('tp_avatar_url') || user?.user_metadata?.avatar_url || undefined;
  });

  const [displayName, setDisplayName] = useState(() => {
    const rawName = localStorage.getItem('tp_avatar_name') || user?.user_metadata?.full_name;
    if (rawName) return rawName;
    return user?.email?.split('@')[0] || 'User';
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update when user loads
  useEffect(() => {
    if (user) {
      if (!localStorage.getItem('tp_avatar_url') && user.user_metadata?.avatar_url) {
        setAvatarUrl(user.user_metadata.avatar_url);
      }
      if (!localStorage.getItem('tp_avatar_name') && user.user_metadata?.full_name) {
        setDisplayName(user.user_metadata.full_name);
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full flex items-center justify-center hover:ring-2 hover:ring-white/30 transition-all shadow-md shadow-black/10 hover:shadow-lg hover:shadow-black/20 focus:outline-none active:scale-95"
      >
        <div className="w-10 h-10 rounded-full border-2 border-white/20 overflow-hidden flex items-center justify-center shrink-0">
          {renderAvatar(avatarIdx, avatarUrl)}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#082026] rounded-2xl shadow-xl border border-cream-dark dark:border-teal-light py-2 z-50 animate-slide-up">
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
        </div>
      )}
    </div>
  );
};
