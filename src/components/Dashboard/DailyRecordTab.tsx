import React, { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  internId: string;
  internName: string;
  date: string; // YYYY-MM-DD
}

export const DailyRecordTab: React.FC<Props> = ({ internId, internName, date }) => {
  const { role, currentInternId } = useAuth();
  const isAdmin = role === 'admin';
  const isOwner = currentInternId === internId;
  const canEdit = isAdmin || isOwner;

  const [recordsList, setRecordsList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEntry, setNewEntry] = useState('');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [newEntry]);

  useEffect(() => {
    const fetchRecord = async () => {
      setLoading(true);
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await supabase
          .from('attendance')
          .select('accomplishments')
          .eq('intern_name', internName)
          .eq('attendance_date', date)
          .single();

        if (data && data.accomplishments) {
          try {
            const parsed = JSON.parse(data.accomplishments);
            if (Array.isArray(parsed)) {
              setRecordsList(parsed);
            } else {
              setRecordsList(data.accomplishments.split('\n').filter((r: string) => r.trim() !== ''));
            }
          } catch {
            setRecordsList(data.accomplishments.split('\n').filter((r: string) => r.trim() !== ''));
          }
        } else {
          setRecordsList([]);
        }
      } catch (err) {
        // Record might not exist yet
      } finally {
        setLoading(false);
      }
    };
    fetchRecord();
  }, [internName, date]);

  const saveToDb = async (newList: string[]) => {
    if (!isSupabaseConfigured) return;
    try {
      const accomplishmentsStr = JSON.stringify(newList);
      
      // Check if record exists
      const { data: existing } = await supabase
        .from('attendance')
        .select('id')
        .eq('intern_name', internName)
        .eq('attendance_date', date)
        .single();
        
      if (existing) {
        await supabase
          .from('attendance')
          .update({ accomplishments: accomplishmentsStr })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('attendance')
          .insert({
            intern_name: internName,
            attendance_date: date,
            accomplishments: accomplishmentsStr
          });
      }
    } catch (err) {
      console.error('Error saving daily record', err);
    }
  };

  const handleAddEntry = () => {
    if (!newEntry.trim()) return;
    const newList = [...recordsList, newEntry.trim()];
    setRecordsList(newList);
    setNewEntry('');
    saveToDb(newList);
  };

  const handleEditEntry = (idx: number, newVal: string) => {
    if (!newVal.trim()) return;
    const newList = [...recordsList];
    newList[idx] = newVal.trim();
    setRecordsList(newList);
    setEditingIdx(null);
    saveToDb(newList);
  };

  const handleDeleteEntry = (idx: number) => {
    const newList = recordsList.filter((_, i) => i !== idx);
    setRecordsList(newList);
    saveToDb(newList);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddEntry();
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-8 h-8 rounded-full border-2 border-teal/20 border-t-teal dark:border-white/20 dark:border-t-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      {/* Records List */}
      <div className="p-6 overflow-y-auto flex-1 space-y-3 scrollbar-thin">
        {recordsList.length === 0 ? (
          <div className="text-center py-8 text-teal/50 dark:text-cream/40 text-sm">
            No daily records added yet.
          </div>
        ) : (
          recordsList.map((entry, idx) => (
            <div key={idx} className="bg-teal/5 dark:bg-white/5 rounded-xl p-4 border border-teal/10 dark:border-white/5 group relative">
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
                    className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-[#00151a] border border-teal/10 dark:border-white/10 text-teal dark:text-cream focus:outline-none focus:ring-2 focus:ring-teal/30 dark:focus:ring-gold/30 min-h-[80px] resize-none scrollbar-thin"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingIdx(null)} className="px-3 py-1.5 text-xs text-teal/70 dark:text-cream/70 hover:bg-teal/10 dark:hover:bg-white/10 rounded-lg transition-colors">Cancel</button>
                    <button onClick={() => handleEditEntry(idx, editValue)} className="px-3 py-1.5 text-xs bg-[#003946] dark:bg-teal-light text-white font-bold rounded-lg hover:bg-[#004a5e] dark:hover:bg-teal-lighter transition-colors">Save</button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-teal-dark dark:text-cream whitespace-pre-wrap pr-16 leading-relaxed">{idx + 1}. {entry}</p>
                  {canEdit && (
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
      {canEdit && (
        <div className="p-4 border-t border-teal/10 dark:border-white/10 bg-teal/5 dark:bg-white/5">
          <div className="relative flex gap-3 max-w-4xl mx-auto">
            <textarea
              ref={textareaRef}
              rows={1}
              value={newEntry}
              onChange={(e) => setNewEntry(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a new daily record..."
              className="flex-1 resize-none text-sm px-4 py-3 rounded-xl bg-white dark:bg-[#00151a] border border-teal/20 dark:border-white/10 text-teal dark:text-cream placeholder:text-teal/40 dark:placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-teal/30 dark:focus:ring-gold/30 max-h-[150px] scrollbar-thin transition-colors"
            />
            <div className="flex items-end">
              <button
                onClick={handleAddEntry}
                disabled={!newEntry.trim()}
                className="px-5 py-3 h-[46px] rounded-xl bg-[#003946] dark:bg-teal-light text-white text-sm font-bold hover:bg-[#004a5e] dark:hover:bg-teal-lighter disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center"
              >
                Add Record
              </button>
            </div>
          </div>
          <p className="text-[10px] text-teal/40 dark:text-cream/30 text-center mt-2 font-medium">
            Press Enter to add, Shift + Enter for new line
          </p>
        </div>
      )}
    </div>
  );
};
