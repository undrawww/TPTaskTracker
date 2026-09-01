import { InternTaskGroup } from './InternTaskGroup';
import { DepartmentTaskPool } from './DepartmentTaskPool';
import { POOL_UUIDS, type Intern, type DailyTask, type WeeklyTask, type TaskStatus, type Department } from '../../types';
import { SortableContext, rectSortingStrategy, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable, useDndContext } from '@dnd-kit/core';

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
  singleRow?: boolean;
  maxInternRows?: number;
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
  hideHeader,
  singleRow,
  maxInternRows
}) => {
  const deptInterns = interns
    .filter((i) => i.department === department)
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  
  const getInitials = (dept: string) => {
    return dept.split(' ').map(w => w[0]).join('');
  };

  // Pool tasks for this department
  const poolId = POOL_UUIDS[department];
  const poolTasks = (tasks as DailyTask[])
    .filter(t => t.intern_id === poolId)
    .sort((a, b) => (Number(a.order_index) || 0) - (Number(b.order_index) || 0));

  const { setNodeRef, isOver } = useDroppable({
    id: `dept-container-${department}`,
    data: { type: 'Department', department }
  });
  const { active } = useDndContext();
  const isDraggingIntern = active?.data.current?.type === 'Intern';

  return (
    <div 
      ref={setNodeRef}
      className={`bg-transparent border-none flex-shrink-0 min-w-min rounded-xl transition-colors duration-200 ${isOver && isDraggingIntern ? 'bg-teal/5 dark:bg-white/5 ring-2 ring-teal/20 dark:ring-gold/30' : ''}`}
      style={maxInternRows ? {
        gridRow: `span ${2 + maxInternRows}`,
        display: 'grid',
        gridTemplateRows: 'subgrid',
        alignItems: 'start'
      } : undefined}
    >
      {!hideHeader && (
        <div className="flex flex-col items-center justify-center pb-2 mb-4 border-b border-teal/10 dark:border-white/10 text-center">
          <h3 className="font-sans text-xl font-bold text-teal dark:text-cream tracking-wide">
            {getInitials(department)}
          </h3>
          <span className="text-[10px] text-teal/50 dark:text-cream/50 uppercase tracking-widest font-medium mt-1">
            {department}
          </span>
        </div>
      )}

      {/* Department Task Pool / Requests */}
      {onAddTask && (
        <div style={{ alignSelf: 'start', height: 'fit-content' }} className="w-full">
          <DepartmentTaskPool
            poolId={poolId}
            departmentLabel={getInitials(department)}
            tasks={poolTasks}
            interns={interns}
            onStatusChange={onStatusChange}
            onVerifyChange={onVerifyChange}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onAddTask={onAddTask}
            activeCommentTaskId={activeCommentTaskId}
            setActiveCommentTaskId={setActiveCommentTaskId}
          />
        </div>
      )}

      {/* Intern task groups */}
      <div 
        className={singleRow ? "py-4 flex flex-row gap-3" : (maxInternRows ? "pt-4" : "py-4 grid grid-cols-2 gap-3")}
        style={!singleRow && maxInternRows ? {
          gridRow: `span ${maxInternRows}`,
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 16rem)',
          gridTemplateRows: 'subgrid',
          gap: '12px',
          alignItems: 'start'
        } : undefined}
      >
        {deptInterns.length === 0 ? (
          <p className={`text-sm text-[#003946] dark:text-[#f5e7c6] italic text-center py-4 ${singleRow ? '' : 'col-span-2'}`}>
            No interns in this department
          </p>
        ) : (
          <SortableContext 
            items={deptInterns.map(i => i.id)}
            strategy={singleRow ? horizontalListSortingStrategy : rectSortingStrategy}
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
                internUsername={intern.username}
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
