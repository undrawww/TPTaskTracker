import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { DepartmentPanel } from './DepartmentPanel';
import { supabase } from '../../lib/supabaseClient';
import { DEPARTMENTS, type Intern, type DailyTask, type TaskStatus } from '../../types';

interface Props {
  interns: Intern[];
  tasks: DailyTask[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onVerifyChange?: (taskId: string, isVerified: boolean) => void;
  onEditTask?: (taskId: string, newName: string) => void;
  onDeleteIntern?: (internId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  isAdmin?: boolean;
  onViewProfile?: (internId: string) => void;
}

export const DailyTracker: React.FC<Props> = ({
  interns,
  tasks,
  onStatusChange,
  onVerifyChange,
  onEditTask,
  onDeleteIntern,
  onDeleteTask,
  isAdmin = false,
  onViewProfile
}) => {
  const [localInterns, setLocalInterns] = useState(interns);
  const [localTasks, setLocalTasks] = useState(tasks);

  useEffect(() => { setLocalInterns(interns); }, [interns]);
  useEffect(() => { setLocalTasks(tasks); }, [tasks]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    if (activeType === 'intern' && overType === 'intern') {
      const oldIndex = localInterns.findIndex(i => i.id === active.id);
      const newIndex = localInterns.findIndex(i => i.id === over.id);
      
      const newInterns = arrayMove(localInterns, oldIndex, newIndex);
      const updated = newInterns.map((i, index) => ({ ...i, order_index: index }));
      setLocalInterns(updated);

      try {
        await Promise.all(
          updated.map((i) => supabase.from('interns').update({ order_index: i.order_index }).eq('id', i.id))
        );
      } catch (err) {
        console.error("Failed to save intern order", err);
      }
    } else if (activeType !== 'intern' && overType !== 'intern') {
      // It's a task
      const oldIndex = localTasks.findIndex(t => t.id === active.id);
      const newIndex = localTasks.findIndex(t => t.id === over.id);

      const newTasks = arrayMove(localTasks, oldIndex, newIndex);
      
      // Update order_index for tasks in the same group to be sequential
      const activeTask = localTasks[oldIndex];
      const internTasks = newTasks.filter(t => t.intern_id === activeTask.intern_id);
      
      const updatedInternTasks = internTasks.map((t, index) => ({ ...t, order_index: index }));
      
      const finalTasks = newTasks.map(t => {
        const updated = updatedInternTasks.find(ut => ut.id === t.id);
        return updated ? updated : t;
      });

      setLocalTasks(finalTasks);

      try {
        await Promise.all(
          updatedInternTasks.map((t) => supabase.from('daily_tasks').update({ order_index: t.order_index }).eq('id', t.id))
        );
      } catch (err) {
        console.error("Failed to save task order", err);
      }
    }
  };

  return (
    <section id="daily-tracker">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-bold text-white tracking-wide">Daily Tracker</h2>
        <div className="flex-1 h-px bg-white/10" />
      </div>
      {localInterns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-black/20 rounded-2xl border border-white/5">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/30">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="17" y1="8" x2="23" y2="14" />
              <line x1="23" y1="8" x2="17" y2="14" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-white mb-1">
            {isAdmin ? 'No interns found' : 'Not added to system'}
          </h3>
          <p className="text-sm text-white/40">
            {isAdmin
              ? 'Add interns to start tracking their tasks.'
              : 'You have not been added as an intern by an administrator yet.'}
          </p>
        </div>
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="overflow-x-auto pb-4 custom-scrollbar">
            <div className="grid grid-flow-col auto-cols-[320px] gap-4 items-start px-2">
              {DEPARTMENTS.map((dept) => (
                <DepartmentPanel
                  key={dept}
                  department={dept}
                  interns={localInterns}
                  tasks={localTasks}
                  onStatusChange={onStatusChange}
                  onVerifyChange={onVerifyChange}
                  onEditTask={onEditTask}
                  onDeleteIntern={onDeleteIntern}
                  onDeleteTask={onDeleteTask}
                  onViewProfile={onViewProfile}
                />
              ))}
            </div>
          </div>
        </DndContext>
      )}
    </section>
  );
};
