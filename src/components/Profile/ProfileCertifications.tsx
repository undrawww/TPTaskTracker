import React, { useState } from 'react';
import type { Certification } from '../../types';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';

interface ProfileCertificationsProps {
  certifications: Certification[];
  internId: string | null;
  onRefresh: () => void;
}

export const ProfileCertifications: React.FC<ProfileCertificationsProps> = ({ certifications, internId, onRefresh }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [dateEarned, setDateEarned] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewImage, setViewImage] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compress as JPEG
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        setUrl(compressedBase64);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !issuer || !dateEarned || !internId) return;

    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        // Save to localStorage in Demo Mode
        const storedCerts = JSON.parse(localStorage.getItem('padua_certifications') || '[]');
        storedCerts.push({
          id: `cert-${Date.now()}`,
          intern_id: internId,
          name,
          issuer,
          date_earned: dateEarned,
          link: url || null
        });
        localStorage.setItem('padua_certifications', JSON.stringify(storedCerts));
      } else {
        const { error } = await supabase
          .from('certifications')
          .insert([{
            intern_id: internId,
            name,
            issuer,
            date_earned: dateEarned,
            link: url || null
          }]);

        if (error) throw error;
      }
      
      setIsAdding(false);
      setName('');
      setIssuer('');
      setDateEarned('');
      setUrl('');
      onRefresh();
    } catch (err: any) {
      console.error('Error adding certification:', err);
      // Ensure we display the error message properly
      alert(`Failed to add certification: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (certId: string) => {
    if (!confirm('Are you sure you want to delete this certification?')) return;
    try {
      if (!isSupabaseConfigured) {
        const storedCerts = JSON.parse(localStorage.getItem('padua_certifications') || '[]');
        const updated = storedCerts.filter((c: any) => c.id !== certId);
        localStorage.setItem('padua_certifications', JSON.stringify(updated));
      } else {
        const { error } = await supabase
          .from('certifications')
          .delete()
          .eq('id', certId);
        if (error) throw error;
      }
      onRefresh();
    } catch (err: any) {
      console.error('Error deleting certification:', err);
      alert(`Failed to delete: ${err?.message || err}`);
    }
  };
  return (
    <div className="bg-[#d9caa8]/30 dark:bg-[#001a22] rounded-3xl border border-teal/10 dark:border-white/5 shadow-sm p-8 animate-fade-in flex flex-col h-full">
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gold">
            <circle cx="12" cy="8" r="7"></circle>
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
          </svg>
          <h2 className="text-lg font-bold text-teal dark:text-cream">Certifications</h2>
        </div>
        {internId && (
          <button 
            onClick={() => setIsAdding(true)}
            className="text-xs font-bold text-teal/60 dark:text-gold hover:text-teal dark:hover:text-gold-light transition-colors flex items-center gap-1 bg-teal/5 dark:bg-gold/10 px-3 py-1.5 rounded-lg"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add New
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-2 scrollbar-hide">
        {certifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-12 h-12 rounded-full bg-teal/5 dark:bg-white/5 flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal/40 dark:text-cream/30">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <p className="text-sm text-teal/50 dark:text-cream/40">No certifications uploaded yet</p>
          </div>
        ) : (
          certifications.map((cert) => (
            <div key={cert.id} className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-white/5 border border-teal/10 dark:border-white/5 hover:border-teal/30 dark:hover:border-gold/30 transition-all duration-200 group">
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="text-sm font-bold text-teal dark:text-cream group-hover:text-teal-light dark:group-hover:text-gold transition-colors">{cert.name}</h3>
                  <p className="text-xs text-teal/60 dark:text-cream/50 mt-0.5">{cert.issuer}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-[11px] font-semibold text-teal/50 dark:text-cream/40">
                  {new Date(cert.date_earned).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <div className="flex items-center gap-3 mt-1">
                  {cert.link && (
                    <button 
                      onClick={() => setViewImage(cert.link!)} 
                      className="text-[10px] font-bold text-teal hover:text-teal-light dark:text-gold dark:hover:text-gold-light uppercase tracking-wider"
                    >
                      View
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(cert.id)}
                    className="text-[10px] font-bold text-red-500/70 hover:text-red-500 uppercase tracking-wider"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#002b36] rounded-2xl shadow-xl w-full max-w-md mx-auto animate-slide-up overflow-hidden">
            <div className="px-6 py-4 border-b border-teal/10 dark:border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-teal dark:text-cream">Add Certification</h3>
              <button onClick={() => setIsAdding(false)} className="text-teal/50 hover:text-teal dark:text-cream/50 dark:hover:text-cream">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-teal/70 dark:text-cream/70 uppercase tracking-wider mb-1.5">Certification Name *</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-cream-dark dark:border-teal-light bg-cream/40 dark:bg-[#003946] text-teal dark:text-cream focus:outline-none focus:ring-2 focus:ring-gold" placeholder="e.g. Google Data Analytics" />
              </div>
              <div>
                <label className="block text-xs font-bold text-teal/70 dark:text-cream/70 uppercase tracking-wider mb-1.5">Issuer *</label>
                <input required type="text" value={issuer} onChange={e => setIssuer(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-cream-dark dark:border-teal-light bg-cream/40 dark:bg-[#003946] text-teal dark:text-cream focus:outline-none focus:ring-2 focus:ring-gold" placeholder="e.g. Coursera" />
              </div>
              <div>
                <label className="block text-xs font-bold text-teal/70 dark:text-cream/70 uppercase tracking-wider mb-1.5">Date Earned *</label>
                <input required type="date" value={dateEarned} onChange={e => setDateEarned(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-cream-dark dark:border-teal-light bg-cream/40 dark:bg-[#003946] text-teal dark:text-cream focus:outline-none focus:ring-2 focus:ring-gold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-teal/70 dark:text-cream/70 uppercase tracking-wider mb-1.5">Certificate Image (Optional)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload} 
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-dark dark:border-teal-light bg-cream/40 dark:bg-[#003946] text-teal dark:text-cream focus:outline-none focus:ring-2 focus:ring-gold text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal/10 file:text-teal hover:file:bg-teal/20 dark:file:bg-gold/10 dark:file:text-gold dark:hover:file:bg-gold/20" 
                />
                {url && (
                  <div className="mt-2 text-xs text-status-done font-bold flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Image attached
                  </div>
                )}
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-2.5 rounded-xl border border-cream-dark dark:border-teal-light text-teal dark:text-cream font-semibold">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-gold text-teal font-semibold hover:bg-gold-light disabled:opacity-50">{loading ? 'Adding...' : 'Add Certificate'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Viewing Modal */}
      {viewImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setViewImage(null)}>
          <div className="relative max-w-4xl w-full h-auto max-h-[90vh] flex flex-col items-center justify-center animate-scale-in" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setViewImage(null)}
              className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <img 
              src={viewImage} 
              alt="Certificate" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              onError={(e) => {
                // Fallback if the URL is not a valid image (e.g. they uploaded a link previously)
                (e.target as HTMLImageElement).style.display = 'none';
                alert('This certificate is not a valid image.');
                setViewImage(null);
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
};
