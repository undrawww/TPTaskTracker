import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import { ProfileHeader } from './ProfileHeader';
import { ProfileAbout } from './ProfileAbout';
import { ProfileCertifications } from './ProfileCertifications';
import { ProfileActivity } from './ProfileActivity';
import { ProfilePerformance } from './ProfilePerformance';
import { ProfileAdminFeedback } from './ProfileAdminFeedback';
import { ProfileModal } from './ProfileModal';
import { supabase } from '../../lib/supabaseClient';

export const ProfilePage: React.FC<{ internId?: string }> = ({ internId }) => {
  const { intern, role, certifications, tasks, weeklyTasks, attendance, loading, refreshProfile } = useProfile(internId);
  const [isEditingProfile, setIsEditingProfile] = React.useState(false);
  const { currentInternId, user } = useAuth();
  const isOwnProfile = !internId || internId === currentInternId || internId === user?.id;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col gap-6 animate-pulse p-4 md:p-8">
        <div className="h-40 bg-teal/5 dark:bg-white/5 rounded-3xl w-full"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-1 lg:col-span-2 h-64 bg-teal/5 dark:bg-white/5 rounded-3xl"></div>
          <div className="col-span-1 h-64 bg-teal/5 dark:bg-white/5 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  if (!intern) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-status-hold-bg flex items-center justify-center mx-auto mb-4 text-status-hold">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <h2 className="text-xl font-bold text-teal dark:text-cream mb-2">Profile Not Found</h2>
          <p className="text-sm text-teal/60 dark:text-cream/60">We couldn't load your profile information. Please check if you are fully registered or contact your administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col gap-6 p-4 md:p-6 lg:p-8 overflow-y-auto scrollbar-hide max-w-[1400px] mx-auto">
      
      {/* 1. Header Section */}
      <ProfileHeader 
        intern={intern} 
        tasks={tasks} 
        weeklyTasks={weeklyTasks}
        onEditClick={() => setIsEditingProfile(true)}
        isOwnProfile={isOwnProfile}
      />

      {/* 2. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (About & Certs) */}
        <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">
          <ProfileAbout intern={intern} role={role} />
          
          <div className={`grid grid-cols-1 ${(intern.department as string) !== 'Administrator' ? 'md:grid-cols-2' : ''} gap-6 h-full`}>
            {(intern.department as string) !== 'Administrator' && <ProfileCertifications certifications={certifications} internId={intern?.id || null} onRefresh={refreshProfile} isOwnProfile={isOwnProfile} />}
            {(intern.department as string) !== 'Administrator' && <ProfilePerformance tasks={tasks} attendance={attendance} />}
          </div>
        </div>

        {/* Right Column (Activity Timeline) */}
        {(intern.department as string) !== 'Administrator' && (
          <div className="col-span-1 h-full">
            <ProfileActivity tasks={tasks} attendance={attendance} />
          </div>
        )}
      </div>

      {/* 3. Bottom Full Width Section */}
      {(intern.department as string) !== 'Administrator' && <ProfileAdminFeedback attendance={attendance} />}

      <ProfileModal
        isOpen={isEditingProfile}
        onClose={() => setIsEditingProfile(false)}
        onLogout={handleLogout}
      />

    </div>
  );
};
