import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { AVATAR_COUNT, AVATAR_LABELS, getAvatarByIndex } from '../Dashboard/AvatarIcons';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

/** Read saved avatar index from localStorage */
function getSavedAvatar(): number {
  const val = localStorage.getItem('tp_avatar');
  return val !== null ? parseInt(val, 10) : 0;
}

const formatPHMobileNumber = (value: string) => {
  const cleaned = value.replace(/\D/g, '');
  const truncated = cleaned.slice(0, 11);
  if (truncated.length <= 4) {
    return truncated;
  } else if (truncated.length <= 7) {
    return `${truncated.slice(0, 4)} ${truncated.slice(4)}`;
  } else {
    return `${truncated.slice(0, 4)} ${truncated.slice(4, 7)} ${truncated.slice(7)}`;
  }
};

export const ProfileModal: React.FC<Props> = ({ isOpen, onClose, onLogout }) => {
  const { user, role } = useAuth();
  
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Intern Specific Fields
  const [location, setLocation] = useState('');
  const [program, setProgram] = useState('');
  const [currentYear, setCurrentYear] = useState('');
  const [school, setSchool] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [expectedGraduationDate, setExpectedGraduationDate] = useState('');
  const [requiredHours, setRequiredHours] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [currentName, setCurrentName] = useState<string>('');
  const [avatarIndex, setAvatarIndex] = useState<number>(getSavedAvatar);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'academic' | 'security'>('profile');

  // Fetch current profile name on open
  React.useEffect(() => {
    if (isOpen && user?.email && isSupabaseConfigured) {
      supabase
        .from('profiles')
        .select('full_name, avatar_index, location, program, current_year, school, contact_number, personal_email, expected_graduation_date, required_hours')
        .eq('email', user.email)
        .single()
        .then(({ data }) => {
          if (data) {
            if (data.full_name) {
              setCurrentName(data.full_name);
              setFullName(data.full_name);
            }
            if (data.avatar_index !== null && data.avatar_index !== undefined) {
              setAvatarIndex(data.avatar_index);
              localStorage.setItem('tp_avatar', String(data.avatar_index));
            }
            if (data.location) setLocation(data.location);
            if (data.program) setProgram(data.program);
            if (data.current_year) setCurrentYear(data.current_year);
            if (data.school) setSchool(data.school);
            if (data.contact_number) setContactNumber(formatPHMobileNumber(data.contact_number));
            if (data.personal_email) setPersonalEmail(data.personal_email);
              setExpectedGraduationDate(data.expected_graduation_date);
            if (data.required_hours) setRequiredHours(String(data.required_hours));
          }
        });

      if (role === 'intern') {
        supabase
          .from('interns')
          .select('bio, skills')
          .eq('email', user.email)
          .single()
          .then(({ data }) => {
            if (data) {
              if (data.bio) setBio(data.bio);
              if (data.skills && Array.isArray(data.skills)) setSkills(data.skills.join(', '));
            }
          });
      }
    } else if (!isSupabaseConfigured) {
      setCurrentName('Demo User');
      setFullName('Demo User');
    }
    setAvatarIndex(getSavedAvatar());
  }, [isOpen, user]);

  const handleSelectAvatar = async (idx: number) => {
    setAvatarIndex(idx);
    localStorage.setItem('tp_avatar', String(idx));
    if (currentName) {
      localStorage.setItem('tp_avatar_name', currentName);
    }
    setShowAvatarPicker(false);
    
    // Save to backend
    if (isSupabaseConfigured && user?.email) {
      await supabase
        .from('profiles')
        .update({ avatar_index: idx })
        .eq('email', user.email);
    }

    // Dispatch a storage event so the header and dashboard update live
    window.dispatchEvent(new Event('avatar-change'));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!isSupabaseConfigured) {
      setError('Cannot update profile in demo mode');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (password) {
        const { error: passError } = await supabase.auth.updateUser({ password });
        if (passError) throw passError;
      }

      if (user?.email) {
        const updateData = {
          full_name: fullName,
          location,
          program,
          current_year: currentYear,
          school,
          contact_number: contactNumber,
          personal_email: personalEmail,
          expected_graduation_date: expectedGraduationDate,
          required_hours: requiredHours ? Number(requiredHours) : null,
        };

        const { error: profileError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('email', user.email);
          
        if (profileError) throw profileError;

        if (role === 'intern') {
          const skillsArray = skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : [];
          const { error: internError } = await supabase
            .from('interns')
            .update({ 
              ...updateData,
              bio, 
              skills: skillsArray
            })
            .eq('email', user.email);
          if (internError) throw internError;
        }
        
        setCurrentName(fullName);
      }

      setSuccess('Profile updated successfully!');
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setIsEditing(false);
        setSuccess(null);
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-[#002b36] rounded-2xl shadow-xl w-full ${!isEditing ? 'max-w-md' : 'max-w-2xl'} mx-auto animate-slide-up overflow-hidden flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-teal to-[#004d5e] dark:from-[#00151a] dark:to-[#001f2e] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="font-poppins text-lg font-semibold">{!isEditing ? 'Profile Settings' : 'Edit Profile'}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {isEditing && !showAvatarPicker && (
          <div className="flex px-8 pt-6 border-b border-teal/10 dark:border-white/10 gap-8 shrink-0 overflow-x-auto scrollbar-hide">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'profile' ? 'border-gold text-teal dark:text-cream' : 'border-transparent text-teal/50 dark:text-cream/50 hover:text-teal dark:hover:text-cream'}`}
            >
              Profile Info
            </button>
            {role === 'intern' && (
              <button
                type="button"
                onClick={() => setActiveTab('academic')}
                className={`pb-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'academic' ? 'border-gold text-teal dark:text-cream' : 'border-transparent text-teal/50 dark:text-cream/50 hover:text-teal dark:hover:text-cream'}`}
              >
                Academic Details
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'security' ? 'border-gold text-teal dark:text-cream' : 'border-transparent text-teal/50 dark:text-cream/50 hover:text-teal dark:hover:text-cream'}`}
            >
              Contact & Security
            </button>
          </div>
        )}

        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
          {/* Avatar Picker Overlay */}
          {showAvatarPicker ? (
            <div className="space-y-4 animate-scale-in">
              <div className="text-center">
                <h3 className="font-poppins text-base font-bold text-teal dark:text-cream">Select Your Avatar</h3>
                <p className="text-xs text-teal/50 dark:text-cream/50 mt-1">Tap to choose an icon</p>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {Array.from({ length: AVATAR_COUNT }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectAvatar(idx)}
                    className={`
                      w-full aspect-square rounded-full flex items-center justify-center transition-all duration-200
                      ${avatarIndex === idx
                        ? 'ring-2 ring-gold ring-offset-2 ring-offset-white dark:ring-offset-[#002b36] scale-105 shadow-lg shadow-gold/30'
                        : 'hover:scale-105 opacity-80 hover:opacity-100'
                      }
                    `}
                    title={AVATAR_LABELS[idx]}
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      {getAvatarByIndex(idx)}
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowAvatarPicker(false)}
                className="w-full py-2 text-sm font-semibold text-teal/50 dark:text-cream/50 hover:text-teal dark:hover:text-cream transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : !isEditing ? (
            <div className="space-y-6">
              <div className="text-center">
                <button
                  onClick={() => setShowAvatarPicker(true)}
                  className="group relative w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-black/10 mb-4 transition-all hover:shadow-xl hover:shadow-black/20 hover:scale-105"
                  title="Change avatar"
                >
                  <div className="w-full h-full flex items-center justify-center">
                    {getAvatarByIndex(avatarIndex)}
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </div>
                </button>
                <h3 className="text-xl font-bold text-teal dark:text-cream">{currentName || 'User'}</h3>
                <p className="text-sm text-teal/60 dark:text-cream/60 font-medium mt-1">{user?.email}</p>
                <div className="inline-flex mt-3 px-3 py-1 rounded-full bg-teal/10 dark:bg-cream/10 text-teal dark:text-cream text-xs font-semibold capitalize">
                  {role || 'Role'}
                </div>
              </div>
              <button
                onClick={() => { setIsEditing(true); setActiveTab('profile'); }}
                className="w-full py-2.5 rounded-xl border border-cream-dark dark:border-teal-light text-teal dark:text-cream font-semibold text-sm hover:bg-cream/50 dark:hover:bg-[#003946] transition-colors flex items-center justify-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit Profile & Password
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="flex flex-col">
              <div className="space-y-6 pb-4">
                
                {/* PROFILE TAB */}
                {activeTab === 'profile' && (
                  <div className="space-y-5 animate-fade-in">
                    <div>
                      <label className="block text-xs font-bold text-teal/70 dark:text-cream/70 uppercase tracking-wider mb-1.5">Full Name</label>
                      <input
                        type="text"
                        placeholder="Your Full Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-cream-dark dark:border-teal-light bg-cream/40 dark:bg-[#003946] text-teal dark:text-cream placeholder:text-teal/30 dark:placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-gold"
                      />
                    </div>
                    {role === 'intern' && (
                      <>
                        <div>
                          <label className="block text-xs font-bold text-teal/70 dark:text-cream/70 uppercase tracking-wider mb-1.5">Bio / About Me</label>
                          <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us a little about yourself..."
                            rows={4}
                            className="w-full px-4 py-2.5 rounded-xl border border-cream-dark dark:border-teal-light bg-cream/40 dark:bg-[#003946] text-teal dark:text-cream placeholder:text-teal/30 dark:placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-gold resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-teal/70 dark:text-cream/70 uppercase tracking-wider mb-1.5">Skills</label>
                          <input
                            type="text"
                            value={skills}
                            onChange={(e) => setSkills(e.target.value)}
                            placeholder="e.g., React, TypeScript, Communication (comma separated)"
                            className="w-full px-4 py-2.5 rounded-xl border border-cream-dark dark:border-teal-light bg-cream/40 dark:bg-[#003946] text-teal dark:text-cream placeholder:text-teal/30 dark:placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-gold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-teal/70 dark:text-cream/70 uppercase tracking-wider mb-1.5">Location</label>
                          <input 
                            type="text" 
                            placeholder="City, Country"
                            value={location} 
                            onChange={(e) => setLocation(e.target.value)} 
                            className="w-full px-4 py-2.5 rounded-xl border border-cream-dark dark:border-teal-light bg-cream/40 dark:bg-[#003946] text-teal dark:text-cream placeholder:text-teal/30 dark:placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-gold" 
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ACADEMIC TAB */}
                {activeTab === 'academic' && role === 'intern' && (
                  <div className="space-y-5 animate-fade-in">
                    <div>
                      <label className="block text-xs font-bold text-teal/70 dark:text-cream/70 uppercase tracking-wider mb-1.5">School / University</label>
                      <input 
                        type="text" 
                        value={school} 
                        onChange={(e) => setSchool(e.target.value)} 
                        className="w-full px-4 py-2.5 rounded-xl border border-cream-dark dark:border-teal-light bg-cream/40 dark:bg-[#003946] text-teal dark:text-cream placeholder:text-teal/30 dark:placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-gold" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-teal/70 dark:text-cream/70 uppercase tracking-wider mb-1.5">Course / Program</label>
                      <input 
                        type="text" 
                        value={program} 
                        onChange={(e) => setProgram(e.target.value)} 
                        className="w-full px-4 py-2.5 rounded-xl border border-cream-dark dark:border-teal-light bg-cream/40 dark:bg-[#003946] text-teal dark:text-cream placeholder:text-teal/30 dark:placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-gold" 
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-teal/70 dark:text-cream/70 uppercase tracking-wider mb-1.5">Current Year</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 3rd Year"
                          value={currentYear} 
                          onChange={(e) => setCurrentYear(e.target.value)} 
                          className="w-full px-4 py-2.5 rounded-xl border border-cream-dark dark:border-teal-light bg-cream/40 dark:bg-[#003946] text-teal dark:text-cream placeholder:text-teal/30 dark:placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-gold" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-teal/70 dark:text-cream/70 uppercase tracking-wider mb-1.5">Graduation Date</label>
                        <input 
                          type="text" 
                          placeholder="e.g. May 2027" 
                          value={expectedGraduationDate} 
                          onChange={(e) => setExpectedGraduationDate(e.target.value)} 
                          className="w-full px-4 py-2.5 rounded-xl border border-cream-dark dark:border-teal-light bg-cream/40 dark:bg-[#003946] text-teal dark:text-cream placeholder:text-teal/30 dark:placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-gold" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-teal/70 dark:text-cream/70 uppercase tracking-wider mb-1.5">Required Internship Hours</label>
                      <input 
                        type="number" 
                        value={requiredHours} 
                        onChange={(e) => setRequiredHours(e.target.value)} 
                        className="w-full px-4 py-2.5 rounded-xl border border-cream-dark dark:border-teal-light bg-cream/40 dark:bg-[#003946] text-teal dark:text-cream placeholder:text-teal/30 dark:placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-gold" 
                      />
                    </div>
                  </div>
                )}

                {/* SECURITY TAB */}
                {activeTab === 'security' && (
                  <div className="space-y-5 animate-fade-in">
                    {role === 'intern' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-4 border-b border-teal/10 dark:border-white/10">
                        <div>
                          <label className="block text-xs font-bold text-teal/70 dark:text-cream/70 uppercase tracking-wider mb-1.5">Contact Number</label>
                          <input 
                            type="text" 
                            placeholder="0912 345 6789"
                            value={contactNumber} 
                            onChange={(e) => setContactNumber(formatPHMobileNumber(e.target.value))} 
                            className="w-full px-4 py-2.5 rounded-xl border border-cream-dark dark:border-teal-light bg-cream/40 dark:bg-[#003946] text-teal dark:text-cream placeholder:text-teal/30 dark:placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-gold" 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-teal/70 dark:text-cream/70 uppercase tracking-wider mb-1.5">Personal Email</label>
                          <input 
                            type="email" 
                            value={personalEmail} 
                            onChange={(e) => setPersonalEmail(e.target.value)} 
                            className="w-full px-4 py-2.5 rounded-xl border border-cream-dark dark:border-teal-light bg-cream/40 dark:bg-[#003946] text-teal dark:text-cream placeholder:text-teal/30 dark:placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-gold" 
                          />
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-bold text-teal/70 dark:text-cream/70 uppercase tracking-wider mb-1.5">Change Password</label>
                      <input
                        type="password"
                        placeholder="Leave blank to keep current"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-cream-dark dark:border-teal-light bg-cream/40 dark:bg-[#003946] text-teal dark:text-cream placeholder:text-teal/30 dark:placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-gold"
                      />
                    </div>
                    {password && (
                      <div>
                        <label className="block text-xs font-bold text-teal/70 dark:text-cream/70 uppercase tracking-wider mb-1.5">Confirm Password</label>
                        <input
                          type="password"
                          placeholder="Re-enter new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-cream-dark dark:border-teal-light bg-cream/40 dark:bg-[#003946] text-teal dark:text-cream placeholder:text-teal/30 dark:placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-gold"
                        />
                      </div>
                    )}
                  </div>
                )}

                {error && <p className="text-sm text-status-hold bg-status-hold-bg px-4 py-3 rounded-xl border border-status-hold/20">{error}</p>}
                {success && <p className="text-sm text-status-done bg-status-done-bg px-4 py-3 rounded-xl border border-status-done/20">{success}</p>}
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-teal/10 dark:border-white/10 shrink-0 mt-auto">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setError(null);
                    setSuccess(null);
                    setPassword('');
                    setConfirmPassword('');
                  }}
                  className="px-6 py-2.5 rounded-xl border border-cream-dark dark:border-teal-light text-cream-dark dark:text-teal-light font-semibold text-sm hover:bg-cream/50 dark:hover:bg-[#003946] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-2.5 rounded-xl bg-gold text-teal font-semibold text-sm hover:bg-gold-light transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {!isEditing && (
            <div className="mt-8 pt-6 border-t border-cream-dark dark:border-teal-light">
              <button
                onClick={() => {
                  localStorage.removeItem('tp_avatar');
                  localStorage.removeItem('tp_avatar_name');
                  onLogout();
                }}
                className="w-full py-2.5 rounded-xl border border-status-hold/30 text-status-hold font-semibold text-sm hover:bg-status-hold/10 transition-colors flex items-center justify-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

