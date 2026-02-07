import { useState } from "react";
import KanbanColumn from "./KanbanColumn";
import { TaskDto } from "../interface/kanbanInterface";
import { canManageTasks, canAssignTasks, isAdmin, canMoveTask, getUserId } from "../helper/auth";
import { toast } from "sonner";
import { useSidebar } from "../hooks/useSidebar";
interface KanbanBoardProps {
  columns: { status: TaskDto['status']; color: string; tasks: TaskDto[]; columnId?: number; id?: number }[];
  onTaskMove?: (
    taskId: number,
    newStatus: TaskDto['status'],
    position: number,
    columnId?: number
  ) => Promise<void>;
  onTaskClick?: (task: TaskDto) => void;
  onAddTask?: (status: TaskDto['status']) => void;
}
export default function KanbanBoard({
  columns,
  onTaskMove,
  onTaskClick,
  onAddTask,
}: KanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<TaskDto | null>(null);
  const [loadingTaskId, setLoadingTaskId] = useState<number | null>(null);
  const { isOpen: isSidebarOpen } = useSidebar();
  const canMoveSpecificTask = (task: TaskDto): boolean => {
    if (isAdmin()) {
      return false;
    }
    return canMoveTask(task);
  };
  if (!columns || columns.length === 0) {
    return (
      <div className="flex gap-6 overflow-x-auto p-6">
        <div className="text-center text-gray-500 py-8">Không có cột nào</div>
      </div>
    );
  }
  const handleDragStart = (task: TaskDto) => {
    if (!canMoveSpecificTask(task)) {
      toast.error('Bạn không có quyền di chuyển task này');
      return;
    }
    const isDone = task.status === 'done' || task.status === 'Đã hoàn thành';
    if (isDone) {
      toast.error('Không thể di chuyển task đã hoàn thành');
      return;
    }
    setDraggedTask(task);
  };
  const handleDrop = async (status: TaskDto['status'], position: number, columnId?: number) => {
    if (!onTaskMove) {
      toast.error('Không thể chỉnh sửa task trong dự án đã hoàn thành');
      setDraggedTask(null);
      return;
    }
    if (!draggedTask || !canMoveSpecificTask(draggedTask)) return;
    const isDone = draggedTask.status === 'done' || draggedTask.status === 'Đã hoàn thành';
    if (isDone) {
      toast.error('Không thể di chuyển task đã hoàn thành');
      setDraggedTask(null);
      return;
    }
    if (status === 'done') {
      toast.error('Không thể di chuyển task vào cột đã hoàn thành');
      setDraggedTask(null);
      return;
    }
    try {
      setLoadingTaskId(draggedTask.id);
      await onTaskMove(draggedTask.id, status, position, columnId);
    } finally {
      setDraggedTask(null);
      setLoadingTaskId(null);
    }
  };
  return (
    <div className="p-6 w-full">
      <div className="flex gap-6 justify-around flex-nowrap overflow-x-auto">
        {columns.map((col) => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            tasks={col.tasks}
            color={col.color}
            onDragStart={handleDragStart}
            onDrop={(status, position) => handleDrop(status, position, col.columnId ?? col.id)}
            onTaskClick={onTaskClick}
            onAddTask={onAddTask}
            draggable={true}
            loadingTaskId={loadingTaskId}
          />
        ))}
      </div>
    </div>
  );
}