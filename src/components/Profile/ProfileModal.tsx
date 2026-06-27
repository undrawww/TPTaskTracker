import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { AVATAR_COUNT, AVATAR_LABELS, renderAvatar } from '../Dashboard/AvatarIcons';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/cropImage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onSave?: () => void;
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

export const ProfileModal: React.FC<Props> = ({ isOpen, onClose, onLogout, onSave }) => {
  const { user, role } = useAuth();
  
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Intern Specific Fields
  const [location, setLocation] = useState('');
  const [pinLocation, setPinLocation] = useState('');
  const [pinLocationName, setPinLocationName] = useState('');
  const [program, setProgram] = useState('');
  const [currentYear, setCurrentYear] = useState('');
  const [school, setSchool] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [birthday, setBirthday] = useState('');
  const [expectedGraduationDate, setExpectedGraduationDate] = useState('');
  const [requiredHours, setRequiredHours] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [currentName, setCurrentName] = useState<string>('');
  const [avatarIndex, setAvatarIndex] = useState<number>(getSavedAvatar);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [gcashQrUrl, setGcashQrUrl] = useState<string | undefined>(undefined);
  const [uploadingGcash, setUploadingGcash] = useState(false);
  
  // Crop state
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropGcashSrc, setCropGcashSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'academic' | 'security' | 'payment'>('profile');

  // Fetch current profile name on open
  React.useEffect(() => {
    if (isOpen && user?.email && isSupabaseConfigured) {
      supabase
        .from('profiles')
        .select('full_name, avatar_index, avatar_url, gcash_qr_url, location, pin_location, pin_location_name, program, current_year, school, contact_number, personal_email, birthday, expected_graduation_date, required_hours')
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
            if (data.avatar_url) {
              setAvatarUrl(data.avatar_url);
            }
            if (data.gcash_qr_url) {
              setGcashQrUrl(data.gcash_qr_url);
            }
            if (data.location) setLocation(data.location);
            if (data.pin_location) setPinLocation(data.pin_location);
            if (data.pin_location_name) setPinLocationName(data.pin_location_name);
            if (data.program) setProgram(data.program);
            if (data.current_year) setCurrentYear(data.current_year);
            if (data.school) setSchool(data.school);
            if (data.contact_number) setContactNumber(formatPHMobileNumber(data.contact_number));
            if (data.personal_email) setPersonalEmail(data.personal_email);
            if (data.birthday) setBirthday(data.birthday);
            if (data.expected_graduation_date) setExpectedGraduationDate(data.expected_graduation_date);
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
    setAvatarUrl(localStorage.getItem('tp_avatar_url') || undefined);
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

  React.useEffect(() => {
    return () => {
      if (cropImageSrc) {
        URL.revokeObjectURL(cropImageSrc);
      }
      if (cropGcashSrc) {
        URL.revokeObjectURL(cropGcashSrc);
      }
    };
  }, [cropImageSrc, cropGcashSrc]);

  const handleUploadPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener('load', () => setCropImageSrc(reader.result?.toString() || null));
    reader.readAsDataURL(file);
  };

  const handleUploadGcash = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setCropGcashSrc(reader.result?.toString() || null);
      // Reset crop params
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    });
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input so same file can be selected again
  };

  const confirmGcashCrop = async () => {
    if (!cropGcashSrc || !croppedAreaPixels || !user?.email || !isSupabaseConfigured) return;

    try {
      setUploadingGcash(true);
      setError(null);

      const croppedBlob = await getCroppedImg(cropGcashSrc, croppedAreaPixels);
      if (!croppedBlob) throw new Error('Failed to crop image');

      const fileName = `gcash-${user.id || user.email}-${Math.random()}.jpg`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, croppedBlob, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;

      // Update backend
      await supabase
        .from('profiles')
        .update({ gcash_qr_url: publicUrl })
        .eq('email', user.email);
        
      if (role === 'intern') {
        await supabase
          .from('interns')
          .update({ gcash_qr_url: publicUrl })
          .eq('email', user.email);
      }

      setGcashQrUrl(publicUrl);
      setSuccess('GCash QR uploaded successfully!');
      
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
      
    } catch (err: any) {
      setError(err.message || 'Failed to crop/upload GCash QR');
    } finally {
      setUploadingGcash(false);
      setCropGcashSrc(null);
    }
  };

  const handleRemoveGcash = async () => {
    if (!user?.email || !isSupabaseConfigured) return;
    
    try {
      setUploadingGcash(true);
      setError(null);
      
      // Update backend to null
      await supabase
        .from('profiles')
        .update({ gcash_qr_url: null })
        .eq('email', user.email);
        
      if (role === 'intern') {
        await supabase
          .from('interns')
          .update({ gcash_qr_url: null })
          .eq('email', user.email);
      }
      
      setGcashQrUrl(undefined);
      setSuccess('GCash QR removed successfully!');
      
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to remove GCash QR');
    } finally {
      setUploadingGcash(false);
    }
  };

  const confirmCrop = async () => {
    if (!cropImageSrc || !croppedAreaPixels || !user?.email || !isSupabaseConfigured) return;

    try {
      setUploadingAvatar(true);
      setError(null);

      const croppedBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      if (!croppedBlob) throw new Error('Failed to crop image');

      const fileName = `${user.id || user.email}-${Math.random()}.jpg`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, croppedBlob, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;

      // Update backend
      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('email', user.email);
        
      if (role === 'intern') {
        await supabase
          .from('interns')
          .update({ avatar_url: publicUrl })
          .eq('email', user.email);
      }

      // Crucial: Update the auth user's metadata so that AuthContext updates globally in realtime
      await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      setAvatarUrl(publicUrl);
      localStorage.setItem('tp_avatar_url', publicUrl);
      setCropImageSrc(null);
      setShowAvatarPicker(false);
      setSuccess('Profile photo uploaded successfully!');
      
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
      
      // Dispatch a storage event so the header and dashboard update live
      window.dispatchEvent(new Event('avatar-change'));
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo');
    } finally {
      setUploadingAvatar(false);
    }
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
          pin_location: pinLocation,
          pin_location_name: pinLocationName,
          program,
          current_year: currentYear,
          school,
          contact_number: contactNumber,
          personal_email: personalEmail,
          birthday: birthday || null,
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
      if (onSave) onSave();
      
      setIsEditing(false);
      
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
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
            <button
              type="button"
              onClick={() => setActiveTab('payment')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'payment' ? 'border-gold text-teal dark:text-cream' : 'border-transparent text-teal/50 dark:text-cream/50 hover:text-teal dark:hover:text-cream'}`}
            >
              Payment
            </button>
          </div>
        )}

        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
          {/* Avatar Crop Overlay */}
          {cropImageSrc ? (
            <div className="space-y-4 animate-scale-in">
              <div className="text-center">
                <h3 className="font-poppins text-base font-bold text-teal dark:text-cream">Crop Your Photo</h3>
                <p className="text-xs text-teal/50 dark:text-cream/50 mt-1 mb-4">Pinch or scroll to zoom, drag to pan</p>
              </div>
              <div className="relative w-full h-64 bg-black/10 rounded-2xl overflow-hidden">
                <Cropper
                  image={cropImageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
                  onZoomChange={setZoom}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCropImageSrc(null)}
                  className="flex-1 py-2 rounded-xl border border-cream-dark dark:border-teal-light text-cream-dark dark:text-teal-light font-semibold text-sm hover:bg-cream/50 dark:hover:bg-[#003946] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmCrop}
                  disabled={uploadingAvatar}
                  className="flex-1 py-2.5 rounded-xl bg-gold text-teal font-semibold text-sm hover:bg-gold-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploadingAvatar && <div className="w-4 h-4 rounded-full border-2 border-teal/20 border-t-teal animate-spin" />}
                  {uploadingAvatar ? 'Saving...' : 'Save Photo'}
                </button>
              </div>
            </div>
          ) : cropGcashSrc ? (
            /* GCash Crop Overlay */
            <div className="space-y-4 animate-scale-in">
              <div className="text-center">
                <h3 className="font-poppins text-base font-bold text-teal dark:text-cream">Crop Your GCash QR</h3>
                <p className="text-xs text-teal/50 dark:text-cream/50 mt-1 mb-4">Pinch or scroll to zoom, drag to pan</p>
              </div>
              <div className="relative w-full h-[400px] bg-black/10 rounded-2xl overflow-hidden">
                <Cropper
                  image={cropGcashSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="rect"
                  showGrid={true}
                  onCropChange={setCrop}
                  onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
                  onZoomChange={setZoom}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCropGcashSrc(null)}
                  disabled={uploadingGcash}
                  className="flex-1 py-3 rounded-xl border border-cream-dark dark:border-teal-light text-cream-dark dark:text-teal-light font-semibold text-sm hover:bg-cream/50 dark:hover:bg-[#003946] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmGcashCrop}
                  disabled={uploadingGcash}
                  className="flex-1 py-3 rounded-xl bg-gold text-teal font-semibold text-sm hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploadingGcash && <div className="w-4 h-4 rounded-full border-2 border-teal/20 border-t-teal animate-spin" />}
                  {uploadingGcash ? 'Uploading...' : 'Upload QR Code'}
                </button>
              </div>
            </div>
          ) : showAvatarPicker ? (
            <div className="space-y-4 animate-scale-in">
              <div className="text-center">
                <h3 className="font-poppins text-base font-bold text-teal dark:text-cream">Select Your Avatar</h3>
                <p className="text-xs text-teal/50 dark:text-cream/50 mt-1 mb-4">Tap to choose an icon or upload a custom photo</p>
                <div className="flex justify-center mb-6">
                  <label className="cursor-pointer relative overflow-hidden group">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleUploadPhoto}
                      disabled={uploadingAvatar}
                      className="hidden" 
                    />
                    <div className={`px-4 py-2 rounded-xl border border-teal/10 dark:border-white/10 bg-teal/5 dark:bg-white/5 flex items-center gap-2 hover:bg-teal/10 dark:hover:bg-white/10 transition-colors ${uploadingAvatar ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {uploadingAvatar ? (
                        <div className="w-4 h-4 rounded-full border-2 border-teal/20 border-t-teal dark:border-white/10 dark:border-t-gold animate-spin" />
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal dark:text-cream"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                      )}
                      <span className="text-sm font-semibold text-teal dark:text-cream">
                        {uploadingAvatar ? 'Uploading...' : 'Upload Photo'}
                      </span>
                    </div>
                  </label>
                </div>
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
                      {renderAvatar(idx)}
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
                  <div className="w-full h-full flex items-center justify-center rounded-full overflow-hidden">
                    {renderAvatar(avatarIndex, avatarUrl)}
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
                    <div>
                      <label className="block text-xs font-bold text-teal/70 dark:text-cream/70 uppercase tracking-wider mb-1.5">Birthday</label>
                      <input
                        type="date"
                        value={birthday}
                        onChange={(e) => setBirthday(e.target.value)}
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
                          <label className="block text-xs font-bold text-teal/70 dark:text-cream/70 uppercase tracking-wider mb-1.5">Location (Text)</label>
                          <input 
                            type="text" 
                            placeholder="City, Country"
                            value={location} 
                            onChange={(e) => setLocation(e.target.value)} 
                            className="w-full px-4 py-2.5 rounded-xl border border-cream-dark dark:border-teal-light bg-cream/40 dark:bg-[#003946] text-teal dark:text-cream placeholder:text-teal/30 dark:placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-gold" 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-teal/70 dark:text-cream/70 uppercase tracking-wider mb-1.5">Pin Location Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g., Pinalagad Covered Court"
                            value={pinLocationName} 
                            onChange={(e) => setPinLocationName(e.target.value)} 
                            className="w-full px-4 py-2.5 rounded-xl border border-cream-dark dark:border-teal-light bg-cream/40 dark:bg-[#003946] text-teal dark:text-cream placeholder:text-teal/30 dark:placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-gold" 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-teal/70 dark:text-cream/70 uppercase tracking-wider mb-1.5">Pin Location Link (Google Maps URL)</label>
                          <input 
                            type="text" 
                            placeholder="https://maps.app.goo.gl/..."
                            value={pinLocation} 
                            onChange={(e) => setPinLocation(e.target.value)} 
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

                {/* PAYMENT TAB */}
                {activeTab === 'payment' && (
                  <div className="space-y-5 animate-fade-in">
                    <div>
                      <label className="block text-xs font-bold text-teal/70 dark:text-cream/70 uppercase tracking-wider mb-3">GCash QR Code</label>
                      {gcashQrUrl ? (
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-64 h-64 rounded-xl border-2 border-teal/20 dark:border-white/10 overflow-hidden shadow-md">
                            <img src={gcashQrUrl} alt="GCash QR" className="w-full h-full object-contain" />
                          </div>
                          <div className="flex gap-3 w-full max-w-xs">
                            <label className="flex-1 cursor-pointer py-2 px-4 bg-teal/10 dark:bg-white/5 text-teal dark:text-cream rounded-xl text-sm font-semibold text-center hover:bg-teal/20 dark:hover:bg-white/10 transition-colors">
                              {uploadingGcash ? 'Uploading...' : 'Change QR'}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleUploadGcash}
                                className="hidden"
                                disabled={uploadingGcash}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={handleRemoveGcash}
                              disabled={uploadingGcash}
                              className="flex-1 py-2 px-4 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-sm font-semibold hover:bg-red-500/20 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-teal/20 dark:border-white/10 rounded-2xl bg-teal/5 dark:bg-white/5">
                          <svg className="w-12 h-12 text-teal/40 dark:text-white/20 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                          <p className="text-sm font-medium text-teal/60 dark:text-white/40 mb-4 text-center">
                            Upload your GCash QR code to easily receive payments or allowances.
                          </p>
                          <label className="cursor-pointer py-2.5 px-6 bg-teal text-white dark:bg-teal-light rounded-xl text-sm font-semibold hover:bg-teal-light transition-colors shadow-md shadow-teal/20">
                            Select Image
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleUploadGcash}
                              className="hidden"
                              disabled={uploadingGcash}
                            />
                          </label>
                        </div>
                      )}
                    </div>
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
                  Save Changes
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
      
      {/* Bottom Right Toast Notification */}
      {success && (
        <div className="fixed bottom-6 right-6 z-[60] animate-slide-up">
          <div className="bg-status-done-bg border border-status-done/20 px-6 py-4 rounded-xl shadow-lg shadow-black/10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-status-done/10 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-status-done">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-status-done">{success}</p>
          </div>
        </div>
      )}
    </div>
  );
};

