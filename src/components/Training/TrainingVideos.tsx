import React, { useState } from 'react';
import { useTrainingVideos } from '../../hooks/useTrainingVideos';
import { useAuth } from '../../contexts/AuthContext';
import { useInterns } from '../../hooks/useInterns';
import { avatarURLs } from '../Dashboard/AvatarIcons';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { generateSlug } from '../../utils/slugify';

export const TrainingVideos: React.FC = () => {
  const { videoId } = useParams<{ videoId?: string }>();
  const navigate = useNavigate();
  const { videos, loading, hasCompleted, getVideoCompletions, markAsWatched, unmarkAsWatched, addVideo, deleteVideo } = useTrainingVideos();
  const { role } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [addingVideo, setAddingVideo] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [unmarkingId, setUnmarkingId] = useState<string | null>(null);

  // Derived state from URL parameter (match by exact UUID or by generated slug)
  const playingVideo = videos.find(v => v.id === videoId || generateSlug(v.title) === videoId) || null;

  // Helper to extract YouTube ID for embed
  const getEmbedUrl = (url: string) => {
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
    return url; // fallback
  };

  const handleAddVideo = async () => {
    if (!newTitle.trim() || !newUrl.trim()) return;
    setAddingVideo(true);
    await addVideo(newTitle.trim(), newUrl.trim());
    setNewTitle('');
    setNewUrl('');
    setShowAddModal(false);
    setAddingVideo(false);
  };

  const handleMarkWatched = async (videoId: string) => {
    setMarkingId(videoId);
    await markAsWatched(videoId);
    setMarkingId(null);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden animate-pulse bg-[#d9caa8] dark:bg-[#003946]/50">
            <div className="aspect-video bg-teal/10 dark:bg-white/10" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-teal/10 dark:bg-white/10 rounded w-3/4" />
              <div className="h-8 bg-teal/10 dark:bg-white/10 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-poppins font-bold text-teal dark:text-white">
            Videos
          </h2>
          <p className="text-sm text-teal/50 dark:text-white/40 mt-1">
            Watch and track your progress on training videos
          </p>
        </div>
        {role === 'admin' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal dark:bg-teal-light text-white text-sm font-semibold hover:bg-teal-light dark:hover:bg-teal-lighter transition-all duration-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Video
          </button>
        )}
      </div>

      {/* Video Grid */}
      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-teal/40 dark:text-white/30">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
          <p className="text-sm font-medium">No videos yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {videos.map((video) => {
            const completed = hasCompleted(video.id);
            const watchers = getVideoCompletions(video.id);
            const isMarking = markingId === video.id;

            return (
              <div
                key={video.id}
                className="group/card flex flex-col gap-3 relative"
              >
                {/* Thumbnail */}
                <button
                  onClick={() => navigate(`/videos/${generateSlug(video.title)}`)}
                  className="block w-full relative aspect-video overflow-hidden cursor-pointer rounded-xl group-hover/card:rounded-none transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <img
                    src={video.thumbnail_url || 'https://img.youtube.com/vi/default/hqdefault.jpg'}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                  />
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/10 group-hover/card:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/90 dark:bg-white/80 flex items-center justify-center shadow-lg scale-90 group-hover/card:scale-100 opacity-0 group-hover/card:opacity-100 transition-all duration-300">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="#003946" className="ml-1">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                  </div>
                  {/* Completed badge */}
                  {completed && (
                    <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-lg">
                      Watched
                    </div>
                  )}
                </button>

                {/* Info Row */}
                <div className="flex gap-3 px-1">
                  {/* Left: Action Button (Replaces Channel Avatar) */}
                  <div className="shrink-0 mt-0.5">
                    {completed ? (
                      <button
                        onClick={async () => {
                          setUnmarkingId(video.id);
                          await unmarkAsWatched(video.id);
                          setUnmarkingId(null);
                        }}
                        disabled={unmarkingId === video.id}
                        title="Undo Watched"
                        className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:bg-red-500/20 hover:text-red-500 transition-colors group/undo"
                      >
                        {unmarkingId === video.id ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <svg className="group-hover/undo:hidden" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            <svg className="hidden group-hover/undo:block" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleMarkWatched(video.id)}
                        disabled={isMarking}
                        title="Mark as Watched"
                        className="w-9 h-9 rounded-full bg-teal/10 dark:bg-white/10 text-teal dark:text-white flex items-center justify-center hover:bg-teal hover:text-white dark:hover:bg-gold dark:hover:text-teal transition-colors"
                      >
                        {isMarking ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 16 16 12 12 8" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Right: Title & Watchers */}
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-teal dark:text-white leading-tight line-clamp-2 pr-2">
                        {video.title}
                      </h3>
                      {role === 'admin' && (
                        <button
                          onClick={() => deleteVideo(video.id)}
                          className="shrink-0 text-teal/30 dark:text-white/20 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          title="Delete video"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="15" y1="9" x2="9" y2="15"/>
                            <line x1="9" y1="9" x2="15" y2="15"/>
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Watchers Avatars */}
                    <div className="mt-1.5 flex flex-wrap gap-[3px]">
                      <AnimatePresence mode="popLayout">
                        {watchers.length > 0 ? watchers.map((w, index) => (
                          <motion.div
                            key={w.user_id}
                            initial={{ scale: 0.2, opacity: 0, y: 10, rotate: -20 }}
                            animate={{ scale: 1, opacity: 1, y: 0, rotate: 0 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 20,
                              delay: index * 0.05
                            }}
                            className="relative group/avatar"
                            title={w.full_name}
                          >
                            <div className="w-5 h-5 rounded-full overflow-hidden bg-teal/10 dark:bg-white/10 ring-1 ring-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.15)] group-hover/avatar:ring-emerald-400 group-hover/avatar:ring-2 transition-all duration-300 group-hover/avatar:scale-110 cursor-pointer">
                              {w.avatar_url ? (
                                <img src={w.avatar_url} alt={w.full_name} className="w-full h-full object-cover" />
                              ) : (
                                <img src={avatarURLs[Math.abs(w.avatar_index ?? 0) % avatarURLs.length]} alt={w.full_name} className="w-full h-full object-cover" />
                              )}
                            </div>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-teal dark:bg-[#001a22] text-white text-[10px] font-bold rounded whitespace-nowrap opacity-0 group-hover/avatar:opacity-100 group-hover/avatar:-translate-y-1 transition-all pointer-events-none shadow-lg z-20">
                              {w.full_name}
                            </div>
                          </motion.div>
                        )) : (
                          <motion.span 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-[11px] text-teal/50 dark:text-white/40 font-semibold uppercase tracking-wider"
                          >
                            Not watched yet
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Video Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-[#e8dcc4] dark:bg-[#002a36] rounded-2xl p-6 w-full max-w-md shadow-2xl border border-teal/10 dark:border-white/10">
            <h3 className="text-lg font-poppins font-bold text-teal dark:text-white mb-4">Add Video</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-teal/60 dark:text-white/50 uppercase tracking-wider mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Video title..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/50 dark:bg-white/5 border border-teal/10 dark:border-white/10 text-teal dark:text-white text-sm placeholder-teal/30 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-teal/30 dark:focus:ring-gold/30"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-teal/60 dark:text-white/50 uppercase tracking-wider mb-1.5">
                  YouTube URL
                </label>
                <input
                  type="text"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/50 dark:bg-white/5 border border-teal/10 dark:border-white/10 text-teal dark:text-white text-sm placeholder-teal/30 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-teal/30 dark:focus:ring-gold/30"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-teal/60 dark:text-white/50 hover:bg-teal/5 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddVideo}
                disabled={addingVideo || !newTitle.trim() || !newUrl.trim()}
                className="px-5 py-2 rounded-xl bg-teal dark:bg-gold text-white dark:text-teal text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingVideo ? 'Adding...' : 'Add Video'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* In-App Video Player Modal */}
      {playingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => navigate('/videos')} />
          <div className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => navigate('/videos')}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white/70 hover:bg-black/70 hover:text-white transition-all backdrop-blur-md"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <iframe
              src={getEmbedUrl(playingVideo.url)}
              title={playingVideo.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
};
