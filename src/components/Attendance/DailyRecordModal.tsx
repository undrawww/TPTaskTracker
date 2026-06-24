import React, { useState } from 'react';
import type { AttendanceWithIntern } from '../../types';

interface DailyRecordModalProps {
  record: AttendanceWithIntern;
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: string) => void;
  isOwner: boolean;
}

export const DailyRecordModal: React.FC<DailyRecordModalProps> = ({
  record,
  isOpen,
  onClose,
  onSave,
  isOwner,
}) => {
  const [newEntry, setNewEntry] = useState('');

  if (!isOpen) return null;

  const recordsList = record.accomplishments 
    ? record.accomplishments.split('\n').filter(r => r.trim() !== '') 
    : [];

  const handleAddEntry = () => {
    if (!newEntry.trim()) return;
    
    const updatedAccomplishments = record.accomplishments
      ? `${record.accomplishments}\n${newEntry.trim()}`
      : newEntry.trim();
      
    onSave(updatedAccomplishments);
    setNewEntry('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEntry();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-dark/60 dark:bg-[#000a0f]/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#001a22] rounded-3xl border border-teal/10 dark:border-white/10 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-teal/10 dark:border-white/10 flex items-center justify-between bg-teal/5 dark:bg-white/5">
          <div>
            <h2 className="text-xl font-bold text-teal dark:text-cream">Daily Records</h2>
            <p className="text-sm text-teal/60 dark:text-cream/50 mt-1">
              {record.intern_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-teal/10 dark:bg-white/10 text-teal/70 dark:text-cream/70 hover:bg-teal/20 dark:hover:bg-white/20 transition-all duration-200"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Records List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {recordsList.length === 0 ? (
            <div className="text-center py-8 text-teal/50 dark:text-cream/40 text-sm">
              No daily records added yet.
            </div>
          ) : (
            recordsList.map((entry, idx) => (
              <div key={idx} className="bg-teal/5 dark:bg-white/5 rounded-xl p-4 border border-teal/10 dark:border-white/5 animate-fade-in">
                <p className="text-sm text-teal-dark dark:text-cream whitespace-pre-wrap">{entry}</p>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        {(isOwner) && (
          <div className="p-4 border-t border-teal/10 dark:border-white/10 bg-teal/5 dark:bg-white/5">
            <div className="flex gap-3">
              <input
                type="text"
                value={newEntry}
                onChange={(e) => setNewEntry(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What did you work on?"
                className="
                  flex-1 px-4 py-3 text-sm rounded-xl
                  bg-white dark:bg-[#00151a] border border-teal/10 dark:border-white/10
                  text-teal dark:text-cream placeholder:text-teal/40 dark:placeholder:text-cream/30
                  focus:outline-none focus:ring-2 focus:ring-teal/30 dark:focus:ring-gold/30 focus:border-teal/50 dark:focus:border-gold/50
                  transition-all duration-200
                "
              />
              <button
                onClick={handleAddEntry}
                disabled={!newEntry.trim()}
                className="
                  px-5 py-3 rounded-xl font-bold text-sm
                  bg-teal dark:bg-gold text-white dark:text-[#001a22]
                  hover:bg-teal-light dark:hover:bg-gold-light
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200
                "
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
