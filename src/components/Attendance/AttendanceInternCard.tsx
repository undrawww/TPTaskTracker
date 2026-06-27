import React from 'react';
import type { AttendanceWithIntern, AttendanceAction } from '../../types';
import { TimeStampButton } from './TimeStampButton';
import { useAuth } from '../../contexts/AuthContext';
import { getAvatarIcon, renderAvatar } from '../Dashboard/AvatarIcons';
import { DailyRecordModal } from './DailyRecordModal';
import { AdminFeedbackModal } from './AdminFeedbackModal';
import { useState } from 'react';

interface AttendanceInternCardProps {
  record: AttendanceWithIntern;
  onStamp: (internName: string, action: AttendanceAction) => void;
  onUndoStamp: (internName: string, action: AttendanceAction) => void;
  onTextChange: (internName: string, field: 'accomplishments' | 'admin_feedback', value: string) => void;
  isAdmin: boolean;
  showTimeColumns?: boolean;
}

/** Clock icons for each action */
const ICONS = {
  time_in: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  ),
  break_out: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 010 8h-1" />
      <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  ),
  break_in: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" />
      <line x1="15" y1="15" x2="21" y2="21" />
      <line x1="4" y1="4" x2="9" y2="9" />
    </svg>
  ),
  time_out: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};



/** Format total hours */
function formatHours(hours: number | null): string {
  if (hours === null || isNaN(hours)) return '—';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

function getItemCount(text: string | null): number {
  if (!text || text.trim() === '' || text.trim() === '[]') return 0;
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.length;
  } catch {}
  return text.split('\n').filter((r) => r.trim() !== '').length;
}

export const AttendanceInternCard: React.FC<AttendanceInternCardProps> = ({
  record,
  onStamp,
  onUndoStamp,
  onTextChange,
  isAdmin,
  showTimeColumns = true,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const { currentInternId, role } = useAuth();
  const { intern_name, time_in, break_out, break_in, time_out, total_hours } = record;

  const isOwner = role === 'intern' && currentInternId === record.intern?.id;

  // Sequential lock logic
  const canBreakOut = time_in !== null && break_out === null;
  const canBreakIn = break_out !== null && break_in === null;
  const canTimeOut = time_in !== null && time_out === null && (break_out === null || break_in !== null);

  return (
    <tr className="hover:bg-teal/5 dark:hover:bg-white/5 transition-colors duration-200 group">
      {/* Intern Info */}
      <td className="px-5 py-4 align-middle">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0">
            {record.intern?.avatar_index !== undefined 
              ? renderAvatar(record.intern.avatar_index, record.intern.avatar_url) 
              : getAvatarIcon(intern_name)}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-teal dark:text-cream leading-tight whitespace-nowrap">
              {intern_name}
            </span>
            {record.intern?.department && (
              <span className="text-[11px] text-teal/60 dark:text-cream/50 font-medium mt-0.5 whitespace-nowrap">
                {record.intern.department}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Time In */}
      {showTimeColumns && (
        <td className="px-5 py-4 align-middle text-center w-[120px]">
          <TimeStampButton
            label="Time In"
            timestamp={time_in}
            disabled={!isOwner || time_in !== null}
            onClick={() => onStamp(intern_name, 'time_in')}
            onUndo={(isOwner || isAdmin) ? () => onUndoStamp(intern_name, 'time_in') : undefined}
            icon={ICONS.time_in}
          />
        </td>
      )}

      {/* Break Out */}
      {showTimeColumns && (
        <td className="px-5 py-4 align-middle text-center w-[120px]">
          <TimeStampButton
            label="Break Out"
            timestamp={break_out}
            disabled={!isOwner || !canBreakOut}
            onClick={() => onStamp(intern_name, 'break_out')}
            onUndo={(isOwner || isAdmin) ? () => onUndoStamp(intern_name, 'break_out') : undefined}
            icon={ICONS.break_out}
          />
        </td>
      )}

      {/* Break In */}
      {showTimeColumns && (
        <td className="px-5 py-4 align-middle text-center w-[120px]">
          <TimeStampButton
            label="Break In"
            timestamp={break_in}
            disabled={!isOwner || !canBreakIn}
            onClick={() => onStamp(intern_name, 'break_in')}
            onUndo={(isOwner || isAdmin) ? () => onUndoStamp(intern_name, 'break_in') : undefined}
            icon={ICONS.break_in}
          />
        </td>
      )}

      {/* Time Out */}
      {showTimeColumns && (
        <td className="px-5 py-4 align-middle text-center w-[120px]">
          <TimeStampButton
            label="Time Out"
            timestamp={time_out}
            disabled={!isOwner || !canTimeOut}
            onClick={() => onStamp(intern_name, 'time_out')}
            onUndo={(isOwner || isAdmin) ? () => onUndoStamp(intern_name, 'time_out') : undefined}
            icon={ICONS.time_out}
          />
        </td>
      )}

      {/* Total Hours */}
      {showTimeColumns && (
        <td className="px-5 py-4 align-middle text-center w-[100px]">
          <div className={`
            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap
            ${total_hours !== null
              ? 'bg-status-done/10 text-status-done'
              : 'bg-teal/10 dark:bg-white/10 text-teal/60 dark:text-cream/40'
            }
          `}>
            {formatHours(total_hours)}
          </div>
        </td>
      )}

      {/* Daily Records */}
      <td className="px-5 py-4 align-middle min-w-[250px]">
        <button
          onClick={() => setIsModalOpen(true)}
          className={`
            w-full text-left px-4 py-3 text-[13px] rounded-xl min-h-[42px]
            bg-white dark:bg-[#00151a] border border-teal/10 dark:border-white/5
            text-teal dark:text-cream
            hover:border-teal/30 dark:hover:border-gold/30 hover:bg-teal/5 dark:hover:bg-white/5
            transition-all duration-200 group flex items-center justify-between
          `}
        >
          <span className="truncate opacity-80 group-hover:opacity-100">
            {getItemCount(record.accomplishments) > 0 
              ? `${getItemCount(record.accomplishments)} record(s) added` 
              : isOwner ? 'Add a daily record...' : 'No records yet'}
          </span>
          {isOwner ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal/40 dark:text-cream/30 group-hover:text-teal dark:group-hover:text-gold transition-colors ml-2 flex-shrink-0">
              <line x1="5" y1="12" x2="19" y2="12" />
              <line x1="12" y1="5" x2="12" y2="19" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal/40 dark:text-cream/30 group-hover:text-teal dark:group-hover:text-gold transition-colors ml-2 flex-shrink-0">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          )}
        </button>

        <DailyRecordModal
          record={record}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={(value) => onTextChange(intern_name, 'accomplishments', value)}
          isOwner={isOwner}
        />
      </td>

      {/* Admin Feedback */}
      <td className="px-5 py-4 align-middle min-w-[250px]">
        <button
          onClick={() => setIsFeedbackModalOpen(true)}
          className={`
            w-full text-left px-4 py-3 text-[13px] rounded-xl min-h-[42px]
            bg-white dark:bg-[#00151a] border border-teal/10 dark:border-white/5
            text-teal dark:text-cream
            hover:border-teal/30 dark:hover:border-gold/30 hover:bg-teal/5 dark:hover:bg-white/5
            transition-all duration-200 group flex items-center justify-between
          `}
        >
          <span className="truncate opacity-80 group-hover:opacity-100">
            {getItemCount(record.admin_feedback) > 0 
              ? `${getItemCount(record.admin_feedback)} feedback(s)` 
              : isAdmin ? 'Add feedback...' : 'No feedback yet'}
          </span>
          {isAdmin ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal/40 dark:text-cream/30 group-hover:text-teal dark:group-hover:text-gold transition-colors ml-2 flex-shrink-0">
              <line x1="5" y1="12" x2="19" y2="12" />
              <line x1="12" y1="5" x2="12" y2="19" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal/40 dark:text-cream/30 group-hover:text-teal dark:group-hover:text-gold transition-colors ml-2 flex-shrink-0">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          )}
        </button>

        <AdminFeedbackModal
          record={record}
          isOpen={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
          onSave={(value) => onTextChange(intern_name, 'admin_feedback', value)}
          isAdmin={isAdmin}
        />
      </td>
    </tr>
  );
};
