import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { useInterns } from './useInterns';
import { sendNotification } from './useNotifications';
import type { AttendanceRecord, AttendanceAction, AttendanceWithIntern } from '../types';

/** Get today's date as YYYY-MM-DD in local timezone */
function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Empty attendance shell for a given intern name and date */
function emptyRecord(internName: string, date: string): AttendanceRecord {
  return {
    id: Math.random().toString(36).substring(2, 11),
    intern_name: internName,
    attendance_date: date,
    time_in: null,
    break_out: null,
    break_in: null,
    time_out: null,
    total_hours: null,
    accomplishments: '',
    admin_feedback: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/** Compute total hours client-side (mirrors the DB generated column) */
function computeHours(rec: AttendanceRecord): number | null {
  if (!rec.time_in || !rec.time_out) return null;
  const inMs = new Date(rec.time_out).getTime() - new Date(rec.time_in).getTime();
  return Math.round((inMs / 3600000) * 100) / 100;
}

export function useAttendance(initialDate?: string) {
  const { interns, loading: internsLoading } = useInterns();
  const [records, setRecords] = useState<AttendanceWithIntern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(initialDate || todayStr());
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (initialDate) setSelectedDate(initialDate);
  }, [initialDate]);

  // ── Fetch attendance for the selected date ────────────────────
  const fetchAttendance = useCallback(async (date: string = selectedDate) => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      // Demo mode: create empty records for all interns
      const stored = localStorage.getItem(`padua_attendance_${date}`);
      const demoRecords: AttendanceRecord[] = stored
        ? JSON.parse(stored)
        : interns.map((i) => emptyRecord(i.full_name, date));

      if (!stored) {
        localStorage.setItem(`padua_attendance_${date}`, JSON.stringify(demoRecords));
      }

      const enriched: AttendanceWithIntern[] = demoRecords.map((r) => ({
        ...r,
        total_hours: computeHours(r),
        intern: interns.find((i) => i.full_name === r.intern_name),
      }));
      setRecords(enriched);
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('attendance')
        .select('*')
        .eq('attendance_date', date)
        .order('intern_name', { ascending: true });

      if (fetchError) throw fetchError;

      const existing = (data as AttendanceRecord[]) ?? [];

      // Build enriched records — one per intern
      const enriched: AttendanceWithIntern[] = [];

      for (const intern of interns) {
        const found = existing.find((r) => r.intern_name === intern.full_name);
        if (found) {
          enriched.push({ ...found, intern });
        } else {
          enriched.push({ ...emptyRecord(intern.full_name, date), id: '', intern });
        }
      }

      setRecords(enriched);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch attendance';
      setError(message);
      console.error('Attendance fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, interns]);

  // ── Stamp a time action ───────────────────────────────────────
  const stampAction = useCallback(async (internName: string, action: AttendanceAction) => {
    const now = new Date().toISOString();
    setError(null);

    if (!isSupabaseConfigured) {
      setRecords((prev) => {
        const updated = prev.map((r) => {
          if (r.intern_name !== internName) return r;
          const patched = { ...r, [action]: now, updated_at: now };
          patched.total_hours = computeHours(patched);
          return patched;
        });
        localStorage.setItem(
          `padua_attendance_${selectedDate}`,
          JSON.stringify(updated.map(({ intern, ...rest }) => rest))
        );
        return updated;
      });
      return;
    }

    try {
      const { error: upsertError } = await supabase
        .from('attendance')
        .upsert(
          {
            intern_name: internName,
            attendance_date: selectedDate,
            [action]: now,
          },
          { onConflict: 'intern_name,attendance_date' }
        );

      if (upsertError) {
        if (upsertError.message.toLowerCase().includes('row-level security') || upsertError.code === '42501') {
          throw new Error("Admins need permission to edit attendance. Please run the SQL command provided in the fix to allow Admins to edit attendance.");
        }
        throw upsertError;
      }

      // Optimistic update
      setRecords((prev) =>
        prev.map((r) => {
          if (r.intern_name !== internName) return r;
          const patched = { ...r, [action]: now, updated_at: now };
          patched.total_hours = computeHours(patched);
          return patched;
        })
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to stamp action';
      setError(message);
      console.error('Stamp error:', err);
    }
  }, [selectedDate]);

  // ── Undo a time stamp ─────────────────────────────────────────
  const undoStampAction = useCallback(async (internName: string, action: AttendanceAction) => {
    setError(null);
    const now = new Date().toISOString();

    if (!isSupabaseConfigured) {
      setRecords((prev) => {
        const updated = prev.map((r) => {
          if (r.intern_name !== internName) return r;
          const patched = { ...r, [action]: null, updated_at: now };
          patched.total_hours = computeHours(patched);
          return patched;
        });
        localStorage.setItem(
          `padua_attendance_${selectedDate}`,
          JSON.stringify(updated.map(({ intern, ...rest }) => rest))
        );
        return updated;
      });
      return;
    }

    try {
      const { error: upsertError } = await supabase
        .from('attendance')
        .upsert(
          {
            intern_name: internName,
            attendance_date: selectedDate,
            [action]: null,
          },
          { onConflict: 'intern_name,attendance_date' }
        );

      if (upsertError) {
        if (upsertError.message.toLowerCase().includes('row-level security') || upsertError.code === '42501') {
          throw new Error("Admins need permission to edit attendance. Please run the SQL command provided in the fix to allow Admins to edit attendance.");
        }
        throw upsertError;
      }

      // Optimistic update
      setRecords((prev) =>
        prev.map((r) => {
          if (r.intern_name !== internName) return r;
          const patched = { ...r, [action]: null, updated_at: now };
          patched.total_hours = computeHours(patched);
          return patched;
        })
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to undo stamp';
      setError(message);
      console.error('Undo stamp error:', err);
    }
  }, [selectedDate]);

  // ── Edit a time stamp manually ────────────────────────────────
  const editTimeAction = useCallback(async (internName: string, action: AttendanceAction, isoString: string | null) => {
    setError(null);
    const now = new Date().toISOString();

    if (!isSupabaseConfigured) {
      setRecords((prev) => {
        const updated = prev.map((r) => {
          if (r.intern_name !== internName) return r;
          const patched = { ...r, [action]: isoString, updated_at: now };
          patched.total_hours = computeHours(patched);
          return patched;
        });
        localStorage.setItem(
          `padua_attendance_${selectedDate}`,
          JSON.stringify(updated.map(({ intern, ...rest }) => rest))
        );
        return updated;
      });
      return;
    }

    try {
      const { error: upsertError } = await supabase
        .from('attendance')
        .upsert(
          {
            intern_name: internName,
            attendance_date: selectedDate,
            [action]: isoString,
          },
          { onConflict: 'intern_name,attendance_date' }
        );

      if (upsertError) {
        if (upsertError.message.toLowerCase().includes('row-level security') || upsertError.code === '42501') {
          throw new Error("Admins need permission to edit attendance. Please run the SQL command provided in the fix to allow Admins to edit attendance.");
        }
        throw upsertError;
      }

      setRecords((prev) =>
        prev.map((r) => {
          if (r.intern_name !== internName) return r;
          const patched = { ...r, [action]: isoString, updated_at: now };
          patched.total_hours = computeHours(patched);
          return patched;
        })
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to edit stamp';
      setError(message);
      console.error('Edit stamp error:', err);
    }
  }, [selectedDate]);

  // ── Update text fields (debounced) ────────────────────────────
  const updateText = useCallback(
    (internName: string, field: 'accomplishments' | 'admin_feedback', value: string) => {
      // Immediate local update
      setRecords((prev) =>
        prev.map((r) =>
          r.intern_name === internName ? { ...r, [field]: value } : r
        )
      );

      // Debounce the persistence
      const key = `${internName}_${field}`;
      if (debounceTimers.current[key]) {
        clearTimeout(debounceTimers.current[key]);
      }

      debounceTimers.current[key] = setTimeout(async () => {
        if (!isSupabaseConfigured) {
          setRecords((prev) => {
            localStorage.setItem(
              `padua_attendance_${selectedDate}`,
              JSON.stringify(prev.map(({ intern, ...rest }) => rest))
            );
            return prev;
          });
          return;
        }

        try {
          const { error: upsertError } = await supabase
            .from('attendance')
            .upsert(
              {
                intern_name: internName,
                attendance_date: selectedDate,
                [field]: value,
              },
              { onConflict: 'intern_name,attendance_date' }
            );

          if (upsertError) {
            if (upsertError.message.toLowerCase().includes('row-level security') || upsertError.code === '42501') {
              setError("Admins need permission to edit attendance/feedback. Please run the SQL command provided in the fix.");
            } else {
              console.error('Text sync error:', upsertError);
            }
          } else if (field === 'admin_feedback' && value.trim()) {
            // Notify the intern that admin left feedback
            let internEmail = '';
            
            // Try to find from current state (might be stale due to useCallback deps)
            const record = records.find(r => r.intern_name === internName);
            if (record?.intern?.email) {
              internEmail = record.intern.email;
            } else {
              // Fetch directly to be safe
              try {
                const { data } = await supabase
                  .from('interns')
                  .select('email')
                  .eq('full_name', internName)
                  .single();
                if (data?.email) internEmail = data.email;
              } catch (e) {
                console.warn('Could not find intern email for feedback notification');
              }
            }

            if (internEmail) {
              const authorName = localStorage.getItem('tp_avatar_name') || 'Admin';
              sendNotification(
                internEmail,
                'feedback',
                `${authorName} left feedback`,
                `Feedback on your ${selectedDate} attendance record`,
                { intern_name: internName, date: selectedDate }
              );
            }
          }
        } catch (err) {
          console.error('Text sync error:', err);
        }
      }, 800);
    },
    [selectedDate]
  );

  // ── Initial fetch + realtime ──────────────────────────────────
  useEffect(() => {
    if (internsLoading) return;
    fetchAttendance(selectedDate);

    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel(`attendance_changes_${Math.random().toString(36).substring(7)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance' },
        () => {
          fetchAttendance(selectedDate);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDate, fetchAttendance, interns]);

  // Cleanup debounce timers
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, []);

  return {
    records,
    loading,
    error,
    selectedDate,
    setSelectedDate,
    stampAction,
    undoStampAction,
    editTimeAction,
    updateText,
    refetch: () => fetchAttendance(selectedDate),
  };
}
