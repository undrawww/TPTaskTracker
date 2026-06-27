import React from 'react';
import type { Intern, DailyTask } from '../../types';
import { renderAvatar } from '../Dashboard/AvatarIcons';

interface ProfileHeaderProps {
  intern: Intern;
  tasks: DailyTask[];
  weeklyTasks?: any[];
  onEditClick: () => void;
  isOwnProfile?: boolean;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ intern, tasks, weeklyTasks = [], onEditClick, isOwnProfile = true }) => {
  // Tasks marked as 'is_verified' are considered verified completed by the admin
  const completedDaily = tasks.filter(t => t.is_verified).length;
  const completedWeekly = weeklyTasks.filter(t => t.is_verified).length;
  const completedTasks = completedDaily + completedWeekly;
  const formattedStartDate = intern.created_at 
    ? new Date(intern.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Not Set';

  const getLocationNameFromLink = (url: string) => {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      // Try to parse long google maps link: /place/Location+Name/...
      if (urlObj.hostname.includes('google') && urlObj.pathname.includes('/place/')) {
        const parts = urlObj.pathname.split('/place/');
        if (parts.length > 1) {
          const placePart = parts[1].split('/')[0];
          return decodeURIComponent(placePart.replace(/\+/g, ' '));
        }
      }
      return urlObj.hostname + urlObj.pathname;
    } catch (e) {
      return url;
    }
  };

  return (
    <div className="bg-white dark:bg-[#001a22] rounded-3xl border border-teal/10 dark:border-white/5 shadow-sm p-8 flex flex-col md:flex-row gap-8 items-start relative animate-fade-in">
      
      {/* Left side: Avatar & Info */}
      <div className="flex items-start gap-6 flex-1">
        <div className="w-28 h-28 shrink-0 rounded-full bg-teal/5 dark:bg-white/5 border-[3px] border-white dark:border-[#001f26] shadow-xl flex items-center justify-center overflow-hidden">
          {renderAvatar(intern.avatar_index, intern.avatar_url)}
        </div>
        
        <div className="flex flex-col pt-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-teal dark:text-cream tracking-tight">
              {intern.full_name}
            </h1>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-gold mt-1">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-teal/70 dark:text-cream/70 mb-4">
            {intern.department}
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-xs text-teal/60 dark:text-cream/50">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              <span>{intern.email}</span>
            </div>
            {intern.contact_number && (
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                <span>{intern.contact_number}</span>
              </div>
            )}
            {intern.location && (
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <span>{intern.location}</span>
              </div>
            )}
            {intern.pin_location && (
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                  <line x1="8" y1="2" x2="8" y2="18"></line>
                  <line x1="16" y1="6" x2="16" y2="22"></line>
                </svg>
                <a href={intern.pin_location.startsWith('http') ? intern.pin_location : `https://${intern.pin_location}`} target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors hover:underline truncate max-w-[200px]" title={intern.pin_location}>
                  {intern.pin_location_name || (intern.pin_location.includes('maps.app.goo.gl') ? 'Open in Google Maps' : getLocationNameFromLink(intern.pin_location))}
                </a>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center gap-4">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              intern.status === 'Active' 
                ? 'bg-status-done-bg text-status-done border border-status-done/20' 
                : intern.status === 'Completed'
                ? 'bg-gold/10 text-gold border border-gold/20'
                : 'bg-status-hold-bg text-status-hold border border-status-hold/20'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${intern.status === 'Active' ? 'bg-status-done' : intern.status === 'Completed' ? 'bg-gold' : 'bg-status-hold'}`} />
              {intern.status || 'Active'}
            </span>

            {isOwnProfile && (
              <button
                onClick={onEditClick}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal/5 hover:bg-teal/10 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-bold text-teal dark:text-cream border border-teal/10 dark:border-white/10 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Stats */}
      {(intern.department as string) !== 'Administrator' && (
        <div className="flex flex-col gap-6 md:w-[350px] shrink-0 border-t md:border-t-0 md:border-l border-teal/10 dark:border-white/5 pt-6 md:pt-0 md:pl-8 justify-center">
          <div className="grid grid-cols-2 gap-y-6 gap-x-4">
            <div>
              <p className="text-[11px] font-bold text-teal/50 dark:text-cream/50 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-gold">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Verified Tasks
              </p>
              <p className="text-4xl font-bold text-teal dark:text-cream">{completedTasks}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-teal/50 dark:text-cream/50 uppercase tracking-wider mb-1">Member Since</p>
              <p className="text-sm font-bold text-teal dark:text-cream mt-3">{formattedStartDate}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
