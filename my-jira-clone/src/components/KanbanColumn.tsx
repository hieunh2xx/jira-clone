
import { useState } from "react";
import TaskCard from "./TaskCard";
import { Plus } from "lucide-react";
import { TaskDto } from "../interface/kanbanInterface";
import { getStatusLabel } from "../helper/statusHelper";
interface KanbanColumnProps {
  status: TaskDto['status'];
  tasks: TaskDto[];
  color: string;
  onDragStart: (task: TaskDto) => void;
  onDrop?: (status: TaskDto['status'], position: number) => void;
  onTaskClick?: (task: TaskDto) => void;
  onAddTask?: (status: TaskDto['status']) => void;
  draggable: boolean;
  loadingTaskId?: number | null;
}
export default function KanbanColumn({
  status,
  tasks,
  color,
  onDragStart,
  onDrop,
  onTaskClick,
  onAddTask,
  draggable,
  loadingTaskId,
}: KanbanColumnProps) {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggedTaskStatus, setDraggedTaskStatus] = useState<string | null>(null);
  const handleDrop = (e: React.DragEvent, position: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(null);
    const taskStatus = e.dataTransfer.getData('task-status');
    if (taskStatus === 'done' || draggedTaskStatus === 'done') {
      setDraggedTaskStatus(null);
      return;
    }
    setDraggedTaskStatus(null);
    if (onDrop) {
      onDrop(status, position);
    }
  };
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(index);
  };
  return (
    <div
      className="flex-shrink-0 w-72 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 min-h-96"
      onDragOver={(e) => {
        if (draggedTaskStatus === 'done') {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
        e.preventDefault();
        setDragOverIndex(tasks.length);
      }}
      onDrop={(e) => {
        const taskStatus = e.dataTransfer.getData('task-status');
        if (taskStatus === 'done' || draggedTaskStatus === 'done') {
          e.preventDefault();
          e.stopPropagation();
          setDraggedTaskStatus(null);
          return false;
        }
        handleDrop(e, tasks.length);
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${color}`} />
          <h3 className="font-semibold text-slate-900 dark:text-white">{getStatusLabel(status)}</h3>
          <span className="text-xs bg-gray-100 dark:bg-slate-700 text-slate-700 dark:text-white px-2 py-1 rounded-full">{tasks.length}</span>
        </div>
      </div>
      <div className="space-y-3">
        {tasks.map((task, index) => {
          const isTaskDone = task.status === 'done' || task.status === 'Đã hoàn thành';
          const isDraggable = draggable && !isTaskDone;
          return (
            <div
              key={task.id}
              draggable={isDraggable && draggable}
              onDragStart={(e) => {
                if (isTaskDone || task.status === 'done') {
                  e.preventDefault();
                  e.stopPropagation();
                  return false;
                }
                setDraggedTaskStatus(task.status || '');
                onDragStart(task);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', task.id.toString());
                e.dataTransfer.setData('task-status', task.status || '');
                e.currentTarget.style.opacity = '0.5';
              }}
              onDragEnd={(e) => {
                e.currentTarget.style.opacity = '1';
                setDragOverIndex(null);
                setDraggedTaskStatus(null);
              }}
              onDragOver={(e) => {
                if (draggedTaskStatus === 'done') {
                  e.preventDefault();
                  e.stopPropagation();
                  return false;
                }
                handleDragOver(e, index);
              }}
              onDragLeave={() => {
                setDragOverIndex(null);
              }}
              onDrop={(e) => {
                const taskStatus = e.dataTransfer.getData('task-status');
                if (taskStatus === 'done' || draggedTaskStatus === 'done') {
                  e.preventDefault();
                  e.stopPropagation();
                  setDraggedTaskStatus(null);
                  return false;
                }
                handleDrop(e, index);
              }}
              className={`transition-all relative ${
                dragOverIndex === index ? 'border-t-2 border-blue-500 pt-2' : ''
              } ${isTaskDone ? 'cursor-not-allowed opacity-75' : ''}`}
            >
              <TaskCard task={task} onTaskClick={onTaskClick} isLoading={loadingTaskId === task.id} />
            </div>
          );
        })}
        <div
          onDragOver={(e) => {
            if (draggedTaskStatus === 'done') {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
            e.preventDefault();
            e.stopPropagation();
            setDragOverIndex(tasks.length);
          }}
          onDragLeave={() => setDragOverIndex(null)}
          onDrop={(e) => {
            const taskStatus = e.dataTransfer.getData('task-status');
            if (taskStatus === 'done' || draggedTaskStatus === 'done') {
              e.preventDefault();
              e.stopPropagation();
              setDraggedTaskStatus(null);
              return false;
            }
            handleDrop(e, tasks.length);
          }}
          className={`h-12 border-2 border-dashed rounded-lg transition-all ${
            dragOverIndex === tasks.length
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300'
          }`}
        />
      </div>
      {onAddTask && (
        <button 
          onClick={() => onAddTask(status)}
          className="w-full mt-4 flex items-center justify-center gap-2 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Thêm công việc
        </button>
      )}
    </div>
  );
}