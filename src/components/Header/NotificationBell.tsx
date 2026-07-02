import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { motion, AnimatePresence } from 'framer-motion';

const TYPE_CONFIG = {
  comment: {
    icon: '💬',
    color: 'bg-blue-500/15 text-blue-500',
    label: 'Comment',
  },
  feedback: {
    icon: '📝',
    color: 'bg-amber-500/15 text-amber-500',
    label: 'Feedback',
  },
  task_done: {
    icon: '✅',
    color: 'bg-emerald-500/15 text-emerald-500',
    label: 'Task Done',
  },
  task_assigned: {
    icon: '📋',
    color: 'bg-purple-500/15 text-purple-500',
    label: 'Task Assigned',
  },
} as const;

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

interface NotificationBellProps {
  onNotificationClick?: (notif: { type: string; metadata: Record<string, unknown> }) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onNotificationClick }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-teal/10 dark:hover:bg-white/10 transition-all duration-200 group"
        title="Notifications"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-teal/70 dark:text-cream/70 group-hover:text-teal dark:group-hover:text-cream transition-colors"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Unread Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[20px] h-5 px-1 text-[11px] font-bold text-white bg-red-500 rounded-full shadow-lg shadow-red-500/30"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-96 max-h-[480px] bg-white dark:bg-[#082026] rounded-2xl shadow-2xl border border-cream-dark dark:border-teal-light z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-teal/10 dark:border-white/10 flex items-center justify-between flex-shrink-0">
              <h3 className="text-sm font-bold text-teal dark:text-cream tracking-tight">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-500/10 text-red-500 text-[11px] font-bold rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="text-[11px] font-bold text-teal/60 dark:text-cream/50 hover:text-teal dark:hover:text-cream transition-colors px-2 py-1 rounded-lg hover:bg-teal/5 dark:hover:bg-white/5"
                  >
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={() => {
                      clearAll();
                      setIsOpen(false);
                    }}
                    className="text-[11px] font-bold text-status-hold/70 hover:text-status-hold transition-colors px-2 py-1 rounded-lg hover:bg-status-hold/5"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto flex-1 overscroll-contain">
              {notifications.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <div className="text-3xl mb-3">🔔</div>
                  <p className="text-sm font-medium text-teal/50 dark:text-cream/40">
                    No notifications yet
                  </p>
                  <p className="text-xs text-teal/35 dark:text-cream/25 mt-1">
                    You'll see updates here when someone comments on a task or leaves feedback.
                  </p>
                </div>
              ) : (
                notifications.map((notif, idx) => {
                  const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.comment;
                  return (
                    <motion.button
                      key={notif.id}
                      initial={idx === 0 ? { x: 20, opacity: 0 } : false}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: idx === 0 ? 0.1 : 0 }}
                      onClick={() => {
                        if (!notif.is_read) markAsRead(notif.id);
                        if (onNotificationClick) {
                          onNotificationClick({ type: notif.type, metadata: notif.metadata });
                          setIsOpen(false);
                        }
                      }}
                      className={`
                        w-full text-left px-5 py-3.5 flex items-start gap-3.5 transition-all duration-200
                        hover:bg-teal/5 dark:hover:bg-white/5
                        ${!notif.is_read ? 'bg-teal/[0.03] dark:bg-white/[0.03]' : ''}
                        ${idx < notifications.length - 1 ? 'border-b border-teal/5 dark:border-white/5' : ''}
                      `}
                    >
                      {/* Type Icon */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${config.color}`}>
                        {config.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-[13px] font-semibold truncate ${!notif.is_read ? 'text-teal dark:text-cream' : 'text-teal/70 dark:text-cream/60'}`}>
                            {notif.title}
                          </p>
                          {!notif.is_read && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className={`text-xs mt-0.5 leading-relaxed line-clamp-2 ${!notif.is_read ? 'text-teal/60 dark:text-cream/50' : 'text-teal/40 dark:text-cream/35'}`}>
                          {notif.message}
                        </p>
                        <p className="text-[11px] text-teal/40 dark:text-cream/30 mt-1.5 font-medium">
                          {timeAgo(notif.created_at)}
                        </p>
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
