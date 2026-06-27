import React, { useState } from 'react';
import { DepartmentPanel } from './DepartmentPanel';
import { DEPARTMENTS, type Intern, type DailyTask, type TaskStatus, type Department } from '../../types';
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { ConfirmModal } from '../common/ConfirmModal';

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
  onAddTask?: (internId: string, taskName: string, emptyGapsCount?: number) => void;
  reorderTasks?: (updates: { id: string, intern_id: string, order_index: number }[], newTasksState: DailyTask[]) => void;
  reorderInterns?: (updates: { id: string, department: Department, order_index: number }[], newInternsState: Intern[]) => void;
  activeCommentTaskId?: string | null;
  setActiveCommentTaskId?: (id: string | null) => void;
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
  onViewProfile,
  onAddTask,
  reorderTasks,
  reorderInterns,
  activeCommentTaskId,
  setActiveCommentTaskId
}) => {
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isBizDevExpanded, setIsBizDevExpanded] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = () => {
    // setActiveId(event.active.id);
  };

  const handleDragOver = () => {
    // Only handle if dragging to a different container
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    const activeType = active.data.current?.type;
    
    // 1. INTERN REORDERING
    if (activeType === 'Intern') {
      if (!reorderInterns) return;
      const activeInternId = active.id as string;
      const overInternId = over.id as string;
      
      const activeIntern = interns.find(i => i.id === activeInternId);
      const overIntern = interns.find(i => i.id === overInternId);
      
      if (!activeIntern) return;
      
      let targetDept = activeIntern.department;
      if (overIntern) targetDept = overIntern.department;
      
      const internsInDept = interns.filter(i => i.department === targetDept).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      const oldIndex = internsInDept.findIndex(i => i.id === activeInternId);
      const newIndex = internsInDept.findIndex(i => i.id === overInternId);
      
      let newInternsForDept;
      if (activeIntern.department === targetDept && oldIndex !== -1 && newIndex !== -1) {
        // Same department reorder
        newInternsForDept = arrayMove(internsInDept, oldIndex, newIndex);
      } else {
        // Cross department reorder
        const filtered = internsInDept.filter(i => i.id !== activeInternId);
        const isBelow = over && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height;
        const insertIdx = newIndex >= 0 ? newIndex + (isBelow ? 1 : 0) : filtered.length;
        filtered.splice(insertIdx, 0, activeIntern);
        newInternsForDept = filtered;
      }
      
      const updates = newInternsForDept.map((i, idx) => ({
        id: i.id,
        department: targetDept,
        order_index: idx
      }));
      
      const newFullInterns = interns.map(i => {
        const up = updates.find(u => u.id === i.id);
        if (up) return { ...i, department: up.department, order_index: up.order_index };
        return i;
      });
      
      reorderInterns(updates, newFullInterns);
      return;
    }

    // 2. TASK REORDERING
    if (activeType === 'Task' && reorderTasks) {
      const activeTaskId = active.id as string;
      const overId = over.id as string;

      const activeTask = tasks.find(t => t.id === activeTaskId);
      if (!activeTask) return;

      let targetInternId = activeTask.intern_id;
      const overTask = tasks.find(t => t.id === overId);
      
      let tasksInTarget: DailyTask[] = [];
      let newTasksForTarget: DailyTask[] = [];

      if (overTask) {
        targetInternId = overTask.intern_id;
        tasksInTarget = tasks.filter(t => t.intern_id === targetInternId).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        const oldIndex = tasksInTarget.findIndex(t => t.id === activeTaskId);
        const newIndex = tasksInTarget.findIndex(t => t.id === overId);

        if (activeTask.intern_id === targetInternId && oldIndex !== -1 && newIndex !== -1) {
          // Same container reorder
          newTasksForTarget = arrayMove(tasksInTarget, oldIndex, newIndex);
        } else {
          // Cross container reorder
          const filtered = tasksInTarget.filter(t => t.id !== activeTaskId);
          const isBelow = over && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height;
          const insertIdx = newIndex >= 0 ? newIndex + (isBelow ? 1 : 0) : filtered.length;
          filtered.splice(insertIdx, 0, activeTask);
          newTasksForTarget = filtered;
        }
      } else {
        // Dropped on empty container (internId)
        const isContainerId = overId.startsWith('task-container-');
        if (isContainerId) {
          targetInternId = overId.replace('task-container-', '');
          tasksInTarget = tasks.filter(t => t.intern_id === targetInternId).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
          newTasksForTarget = [...tasksInTarget.filter(t => t.id !== activeTaskId), activeTask];
        } else {
          return;
        }
      }

      const updates = newTasksForTarget.map((t, idx) => ({
        id: t.id,
        intern_id: targetInternId,
        order_index: idx
      }));

      const newFullTasks = tasks.map(t => {
         const up = updates.find(u => u.id === t.id);
         if (up) return { ...t, intern_id: up.intern_id, order_index: up.order_index };
         return t;
      });

      reorderTasks(updates, newFullTasks);
    }
  };

  return (
    <section id="daily-tracker">
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-bold text-teal dark:text-gold">Daily Task Tracker</h2>
        <div className="flex-1 h-px bg-teal/20 dark:bg-gold/20" />
      </div>
      {interns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-teal/5 dark:bg-[#002833]/50 rounded-2xl border border-teal/10 dark:border-white/5">
          <div className="w-16 h-16 rounded-2xl bg-teal/10 dark:bg-white/5 flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal/40 dark:text-cream/30">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="17" y1="8" x2="23" y2="14" />
              <line x1="23" y1="8" x2="17" y2="14" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-teal dark:text-cream mb-1">
            {isAdmin ? 'No interns found' : 'Not added to system'}
          </h3>
          <p className="text-sm text-teal/50 dark:text-cream/40">
            {isAdmin
              ? 'Add interns to start tracking their tasks.'
              : 'You have not been added as an intern by an administrator yet.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Regular Departments */}
          <div className="flex overflow-x-auto pb-6 gap-6 items-start w-full min-h-[500px]">
            {DEPARTMENTS.filter(dept => dept !== 'BizDev Leadership Team').map((dept) => (
              <DepartmentPanel
                key={dept}
                department={dept}
                interns={interns}
                tasks={tasks}
                onStatusChange={onStatusChange}
                onVerifyChange={onVerifyChange}
                onEditTask={onEditTask}
                onDeleteIntern={onDeleteIntern}
                onDeleteTask={(id) => setTaskToDelete(id)}
                onViewProfile={onViewProfile}
                onAddTask={onAddTask}
                activeCommentTaskId={activeCommentTaskId}
                setActiveCommentTaskId={setActiveCommentTaskId}
              />
            ))}
          </div>

          <div className="w-full h-px bg-teal/10 dark:bg-white/5 my-2"></div>

          {/* BizDev Leadership Team Section */}
          <div className="w-full">
            <button
              onClick={() => setIsBizDevExpanded(!isBizDevExpanded)}
              className="flex items-center gap-2 mb-4 group/bizdev"
            >
              <div className="p-1 rounded hover:bg-teal/5 dark:hover:bg-white/5 transition-colors">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`text-teal/40 dark:text-cream/40 group-hover/bizdev:text-teal dark:group-hover/bizdev:text-cream transition-transform duration-200 ${isBizDevExpanded ? '' : '-rotate-90'}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-teal dark:text-cream tracking-tight">BizDev Leadership Team</h2>
            </button>
            {isBizDevExpanded && (
              <div className="flex overflow-x-auto pb-6 gap-6 items-start w-full">
                <DepartmentPanel
                  department="BizDev Leadership Team"
                  interns={interns}
                  tasks={tasks}
                  onStatusChange={onStatusChange}
                  onVerifyChange={onVerifyChange}
                  onEditTask={onEditTask}
                  onDeleteIntern={onDeleteIntern}
                  onDeleteTask={(id) => setTaskToDelete(id)}
                  onViewProfile={onViewProfile}
                  onAddTask={onAddTask}
                  activeCommentTaskId={activeCommentTaskId}
                  setActiveCommentTaskId={setActiveCommentTaskId}
                  hideHeader={true}
                />
              </div>
            )}
          </div>
        </div>
      )}
      </DndContext>

      <ConfirmModal
        isOpen={!!taskToDelete}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        onConfirm={() => {
          if (taskToDelete) {
            onDeleteTask?.(taskToDelete);
          }
        }}
        onClose={() => setTaskToDelete(null)}
      />
    </section>
  );
};
