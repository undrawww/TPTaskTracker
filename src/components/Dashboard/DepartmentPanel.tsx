import { InternTaskGroup } from './InternTaskGroup';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import type { Intern, DailyTask, WeeklyTask, TaskStatus, Department } from '../../types';

interface Props {
  department: Department;
  interns: Intern[];
  tasks: (DailyTask | WeeklyTask)[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onVerifyChange?: (taskId: string, isVerified: boolean) => void;
  onEditTask?: (taskId: string, newName: string) => void;
  onDeleteIntern?: (internId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onViewProfile?: (internId: string) => void;
  onAddTask?: (internId: string, taskName: string, emptyGapsCount?: number) => void;
  activeCommentTaskId?: string | null;
  setActiveCommentTaskId?: (id: string | null) => void;
  hideHeader?: boolean;
}



export const DepartmentPanel: React.FC<Props> = ({
  department,
  interns,
  tasks,
  onStatusChange,
  onVerifyChange,
  onEditTask,
  onDeleteIntern,
  onDeleteTask,
  onViewProfile,
  onAddTask,
  activeCommentTaskId,
  setActiveCommentTaskId,
  hideHeader
}) => {
  const deptInterns = interns
    .filter((i) => i.department === department)
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  
  const getInitials = (dept: string) => {
    return dept.split(' ').map(w => w[0]).join('');
  };

  return (
    <div className="bg-transparent border-none flex-shrink-0 min-w-min">
      {!hideHeader && (
        <div className="flex items-center justify-between pb-2 mb-4 border-b border-teal/10 dark:border-white/10">
          <h3 className="font-sans text-xl font-bold text-teal dark:text-cream tracking-wide">
            {getInitials(department)}
          </h3>
          <span className="text-xs text-teal/50 dark:text-cream/50 uppercase tracking-widest font-medium">
            {department}
          </span>
        </div>
      )}

      {/* Intern task groups */}
      <div className="py-4 flex flex-row gap-4">
        {deptInterns.length === 0 ? (
          <p className="text-sm text-[#003946] dark:text-[#f5e7c6] italic text-center py-4">
            No interns in this department
          </p>
        ) : (
          <SortableContext 
            items={deptInterns.map(i => i.id)}
            strategy={horizontalListSortingStrategy}
          >
            {deptInterns.map((intern) => {
            const internTasks = tasks
              .filter((t) => t.intern_id === intern.id)
              .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
            return (
              <InternTaskGroup
                key={intern.id}
                internId={intern.id}
                internName={intern.full_name}
                avatarIndex={intern.avatar_index}
                avatarUrl={intern.avatar_url}
                tasks={internTasks}
                onStatusChange={onStatusChange}
                onVerifyChange={onVerifyChange}
                onEditTask={onEditTask}
                onDeleteIntern={onDeleteIntern}
                onDeleteTask={onDeleteTask}
                onViewProfile={onViewProfile}
                onAddTask={onAddTask}
                activeCommentTaskId={activeCommentTaskId}
                setActiveCommentTaskId={setActiveCommentTaskId}
              />
            );
          })}
          </SortableContext>
        )}
      </div>
    </div>
  );
};
