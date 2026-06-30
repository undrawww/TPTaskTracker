import React, { useState, useEffect } from 'react';
import type { AttendanceAction } from '../../types';

interface EditTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (isoString: string | null) => void;
  action: AttendanceAction;
  date: string; // YYYY-MM-DD
  currentValue: string | null;
  internName: string;
}

export const EditTimeModal: React.FC<EditTimeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  action,
  date,
  currentValue,
  internName,
}) => {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (currentValue) {
        const d = new Date(currentValue);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        setTimeStr(`${hh}:${mm}`);
      } else {
        setTimeStr('');
      }
    }
  }, [isOpen, currentValue]);

  if (!isOpen) return null;

  const actionLabels: Record<AttendanceAction, string> = {
    time_in: 'Time In',
    break_out: 'Break Out',
    break_in: 'Break In',
    time_out: 'Time Out',
  };

  const handleSave = () => {
    if (!timeStr) {
      onSave(null);
      return;
    }
    // Combine date and time to create a local Date, then get ISO string
    const [hh, mm] = timeStr.split(':');
    const localDate = new Date(`${date}T00:00:00`);
    localDate.setHours(parseInt(hh, 10));
    localDate.setMinutes(parseInt(mm, 10));
    localDate.setSeconds(0);
    localDate.setMilliseconds(0);
    onSave(localDate.toISOString());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-dark/60 dark:bg-[#000a0f]/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#001a22] rounded-3xl border border-teal/10 dark:border-white/10 shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in">
        <div className="px-6 py-5 border-b border-teal/10 dark:border-white/10">
          <h2 className="text-xl font-bold text-teal dark:text-cream">Edit {actionLabels[action]}</h2>
          <p className="text-sm text-teal/60 dark:text-cream/50 mt-1">{internName} • {date}</p>
        </div>
        
        <div className="p-6">
          <label className="block text-sm font-semibold text-teal dark:text-cream mb-2">
            Time
          </label>
          <input
            type="time"
            value={timeStr}
            onChange={(e) => setTimeStr(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-teal/5 dark:bg-white/5 border border-teal/10 dark:border-white/10 text-teal dark:text-cream focus:outline-none focus:ring-2 focus:ring-teal/30 dark:focus:ring-white/20 font-mono"
          />
          <p className="text-xs text-teal/50 dark:text-cream/40 mt-3">
            Leave blank to clear the timestamp.
          </p>
        </div>

        <div className="px-6 py-4 bg-teal/5 dark:bg-white/5 border-t border-teal/10 dark:border-white/10 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-bold text-teal/70 dark:text-cream/70 hover:bg-teal/10 dark:hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-xl text-sm font-bold bg-teal dark:bg-cream text-white dark:text-teal hover:opacity-90 transition-opacity"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
