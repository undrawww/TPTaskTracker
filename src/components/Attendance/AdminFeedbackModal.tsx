import React, { useState } from 'react';
import type { AttendanceWithIntern } from '../../types';

interface AdminFeedbackModalProps {
  record: AttendanceWithIntern;
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: string) => void;
  isAdmin: boolean;
}

export const AdminFeedbackModal: React.FC<AdminFeedbackModalProps> = ({
  record,
  isOpen,
  onClose,
  onSave,
  isAdmin,
}) => {
  const [newEntry, setNewEntry] = useState('');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  if (!isOpen) return null;

  const recordsList = (() => {
    if (!record.admin_feedback) return [];
    try {
      const parsed = JSON.parse(record.admin_feedback);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return record.admin_feedback.split('\n').filter((r) => r.trim() !== '');
  })();

  const saveRecords = (newList: string[]) => {
    onSave(JSON.stringify(newList));
  };

  const handleAddEntry = () => {
    if (!newEntry.trim()) return;
    saveRecords([...recordsList, newEntry.trim()]);
    setNewEntry('');
  };

  const handleEditEntry = (idx: number, newVal: string) => {
    if (!newVal.trim()) return;
    const newList = [...recordsList];
    newList[idx] = newVal.trim();
    saveRecords(newList);
    setEditingIdx(null);
  };

  const handleDeleteEntry = (idx: number) => {
    const newList = recordsList.filter((_, i) => i !== idx);
    saveRecords(newList);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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
            <h2 className="text-xl font-bold text-teal dark:text-cream">Admin Feedback</h2>
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
              No feedback added yet.
            </div>
          ) : (
            recordsList.map((entry, idx) => (
              <div key={idx} className="bg-teal/5 dark:bg-white/5 rounded-xl p-4 border border-teal/10 dark:border-white/5 animate-fade-in group relative">
                {editingIdx === idx ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleEditEntry(idx, editValue);
                        } else if (e.key === 'Escape') {
                          setEditingIdx(null);
                        }
                      }}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-[#00151a] border border-teal/10 dark:border-white/10 text-teal dark:text-cream focus:outline-none focus:ring-2 focus:ring-teal/30 dark:focus:ring-gold/30 min-h-[80px] resize-none"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditingIdx(null)} className="px-3 py-1.5 text-xs text-teal/70 dark:text-cream/70 hover:bg-teal/10 dark:hover:bg-white/10 rounded-lg">Cancel</button>
                      <button onClick={() => handleEditEntry(idx, editValue)} className="px-3 py-1.5 text-xs bg-teal dark:bg-gold text-white dark:text-teal font-medium rounded-lg">Save</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-teal-dark dark:text-cream whitespace-pre-wrap pr-16">{entry}</p>
                    {isAdmin && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-teal/5 dark:bg-[#002b36] p-1 rounded-lg">
                        <button
                          onClick={() => { setEditingIdx(idx); setEditValue(entry); }}
                          className="p-1.5 text-teal/60 dark:text-cream/60 hover:text-teal dark:hover:text-gold hover:bg-teal/10 dark:hover:bg-white/10 rounded-md transition-colors"
                          title="Edit"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9"></path>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(idx)}
                          className="p-1.5 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                          title="Delete"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        {isAdmin && (
          <div className="p-4 border-t border-teal/10 dark:border-white/10 bg-teal/5 dark:bg-white/5">
            <div className="flex items-start gap-3">
              <textarea
                value={newEntry}
                onChange={(e) => setNewEntry(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write feedback... (Shift+Enter for new line)"
                className="
                  flex-1 px-4 py-3 text-sm rounded-xl min-h-[44px] max-h-[120px] resize-none
                  bg-white dark:bg-[#00151a] border border-teal/10 dark:border-white/10
                  text-teal dark:text-cream placeholder:text-teal/40 dark:placeholder:text-cream/30
                  focus:outline-none focus:ring-2 focus:ring-teal/30 dark:focus:ring-gold/30 focus:border-teal/50 dark:focus:border-gold/50
                  transition-all duration-200
                "
                rows={1}
                style={{ height: newEntry ? 'auto' : undefined }}
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
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
