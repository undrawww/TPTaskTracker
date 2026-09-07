import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface PageLink {
  id: string;
  title: string;
  url: string;
  description: string | null;
  category: string | null;
  sort_order: number;
  created_at: string;
  created_by: string | null;
}

export const PagesToFollow: React.FC = () => {
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  const [pages, setPages] = useState<PageLink[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingPage, setEditingPage] = useState<PageLink | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPages = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('pages_to_follow')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (!error && data) {
      setPages(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const openAddModal = () => {
    setEditingPage(null);
    setFormTitle('');
    setFormUrl('');
    setFormDescription('');
    setFormCategory('');
    setShowModal(true);
  };

  const openEditModal = (page: PageLink) => {
    setEditingPage(page);
    setFormTitle(page.title);
    setFormUrl(page.url);
    setFormDescription(page.description || '');
    setFormCategory(page.category || '');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formUrl.trim()) return;
    setSaving(true);

    let url = formUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    const payload = {
      title: formTitle.trim(),
      url,
      description: formDescription.trim() || null,
      category: formCategory.trim() || null,
    };

    if (editingPage) {
      await supabase
        .from('pages_to_follow')
        .update(payload)
        .eq('id', editingPage.id);
    } else {
      const maxOrder = pages.length > 0 ? Math.max(...pages.map(p => p.sort_order)) + 1 : 0;
      await supabase
        .from('pages_to_follow')
        .insert({ ...payload, sort_order: maxOrder });
    }

    setSaving(false);
    setShowModal(false);
    fetchPages();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('pages_to_follow').delete().eq('id', id);
    setDeletingId(null);
    fetchPages();
  };

  // Extract domain for favicon
  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };

  // Group pages by category
  const grouped = pages.reduce<Record<string, PageLink[]>>((acc, page) => {
    const cat = page.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(page);
    return acc;
  }, {});

  const categories = Object.keys(grouped).sort((a, b) => {
    if (a === 'General') return 1;
    if (b === 'General') return -1;
    return a.localeCompare(b);
  });

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto w-full animate-fade-in">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-teal/5 dark:bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto w-full animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-teal dark:text-cream">Pages to Follow</h1>
          <p className="text-sm text-teal/50 dark:text-cream/40 mt-0.5">Important pages and links for all team members</p>
        </div>
        {isAdmin && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal dark:bg-teal-light text-white text-sm font-semibold hover:bg-teal-light dark:hover:bg-teal-lighter transition-all duration-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Page
          </button>
        )}
      </div>

      {/* Empty State */}
      {pages.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-teal/5 dark:bg-[#002833]/50 rounded-2xl border border-teal/10 dark:border-white/5">
          <div className="w-16 h-16 rounded-2xl bg-teal/10 dark:bg-white/5 flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal/40 dark:text-cream/30">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-teal dark:text-cream mb-1">No pages yet</h3>
          <p className="text-sm text-teal/50 dark:text-cream/40 max-w-md text-center">
            {isAdmin ? 'Click "Add Page" to add links for the team to follow.' : 'No pages have been added yet. Check back later!'}
          </p>
        </div>
      )}

      {/* Pages List */}
      {categories.map(category => (
        <div key={category} className="mb-6">
          {categories.length > 1 && (
            <h2 className="text-xs font-bold text-teal/50 dark:text-cream/40 uppercase tracking-wider mb-3">{category}</h2>
          )}
          <div className="space-y-2">
            {grouped[category].map(page => (
              <div
                key={page.id}
                className="group flex items-center gap-4 bg-[#d9caa8]/30 dark:bg-[#001a22] rounded-xl border border-teal/10 dark:border-white/5 p-4 hover:border-teal/20 dark:hover:border-white/10 transition-all duration-200"
              >
                {/* Favicon */}
                <div className="w-10 h-10 rounded-lg bg-teal/5 dark:bg-white/5 flex items-center justify-center shrink-0">
                  {getFaviconUrl(page.url) ? (
                    <img
                      src={getFaviconUrl(page.url)!}
                      alt=""
                      className="w-5 h-5"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal/40 dark:text-cream/40">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <a
                    href={page.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-teal dark:text-cream hover:text-teal-light dark:hover:text-gold transition-colors"
                  >
                    {page.title}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block ml-1.5 opacity-40">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                  {page.description && (
                    <p className="text-xs text-teal/50 dark:text-cream/40 mt-0.5 truncate">{page.description}</p>
                  )}
                  <p className="text-[10px] text-teal/30 dark:text-cream/20 mt-0.5 truncate">{page.url}</p>
                </div>

                {/* Admin Actions */}
                {isAdmin && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => openEditModal(page)}
                      className="p-2 rounded-lg hover:bg-teal/10 dark:hover:bg-white/10 text-teal/40 dark:text-cream/40 hover:text-teal dark:hover:text-cream transition-colors"
                      title="Edit"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    {deletingId === page.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(page.id)}
                          className="px-2 py-1 text-[10px] font-bold text-red-500 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="px-2 py-1 text-[10px] font-bold text-teal/50 dark:text-cream/50 bg-teal/5 dark:bg-white/5 rounded-lg hover:bg-teal/10 dark:hover:bg-white/10 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingId(page.id)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-teal/40 dark:text-cream/40 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-[#001f26] rounded-2xl shadow-2xl border border-teal/10 dark:border-white/10 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-teal dark:text-cream">
                {editingPage ? 'Edit Page' : 'Add Page'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-full hover:bg-teal/10 dark:hover:bg-white/10 text-teal/50 dark:text-cream/50 hover:text-teal dark:hover:text-cream transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-teal/70 dark:text-cream/70 uppercase tracking-wider mb-1.5">Title *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Team Padua Facebook Page"
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-dark dark:border-teal-light bg-cream/40 dark:bg-[#003946] text-teal dark:text-cream placeholder:text-teal/30 dark:placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-teal/70 dark:text-cream/70 uppercase tracking-wider mb-1.5">URL *</label>
                <input
                  type="text"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="e.g. https://facebook.com/teampadua"
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-dark dark:border-teal-light bg-cream/40 dark:bg-[#003946] text-teal dark:text-cream placeholder:text-teal/30 dark:placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-teal/70 dark:text-cream/70 uppercase tracking-wider mb-1.5">Description</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Short description (optional)"
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-dark dark:border-teal-light bg-cream/40 dark:bg-[#003946] text-teal dark:text-cream placeholder:text-teal/30 dark:placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-teal/70 dark:text-cream/70 uppercase tracking-wider mb-1.5">Category</label>
                <input
                  type="text"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="e.g. Social Media, Website (optional)"
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-dark dark:border-teal-light bg-cream/40 dark:bg-[#003946] text-teal dark:text-cream placeholder:text-teal/30 dark:placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-teal/70 dark:text-cream/70 hover:bg-teal/5 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formTitle.trim() || !formUrl.trim() || saving}
                className="px-5 py-2.5 rounded-xl bg-gold text-teal text-sm font-bold hover:bg-gold/90 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : editingPage ? 'Save Changes' : 'Add Page'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
