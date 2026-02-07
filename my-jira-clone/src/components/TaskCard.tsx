import { TaskDto } from "../interface/kanbanInterface";
import { Download, Calendar, GitBranch, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { getStatusLabel } from "../helper/statusHelper";
interface TaskCardProps {
  task: TaskDto;
  onTaskClick?: (task: TaskDto) => void;
  isLoading?: boolean;
}
const getStatusColor = (status: string) => {
  switch(status) {
    case 'todo': return 'bg-gray-200 text-gray-700';
    case 'in_progress': return 'bg-blue-200 text-blue-700';
    case 'fix': return 'bg-orange-200 text-orange-700';
    case 'review': return 'bg-yellow-200 text-yellow-700';
    case 'done': return 'bg-green-200 text-green-700';
    default: return 'bg-gray-200 text-gray-700';
  }
};
export default function TaskCard({ task, onTaskClick, isLoading = false }: TaskCardProps) {
  const [showImage, setShowImage] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const openImage = (url: string) => {
    setImageUrl(url);
    setShowImage(true);
  };
  const downloadFile = (url: string, name: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
  };
  const isSubtask = task.parentTaskId != null;
  return (
    <>
      <div
        onClick={() => onTaskClick?.(task)}
        className={`group rounded-lg p-3 shadow-sm hover:shadow-md cursor-pointer border transition relative ${
          isSubtask 
            ? 'bg-blue-50 border-blue-200 border-l-4 border-l-blue-500' 
            : 'bg-white border-gray-200'
        } ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-slate-800/80 rounded-lg flex items-center justify-center z-10">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        )}
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-1.5">
            {isSubtask ? (
              <GitBranch className="w-3 h-3 text-blue-600" aria-label="Subtask" />
            ) : (
              <FileText className="w-3 h-3 text-green-600" aria-label="Main Task" />
            )}
            <span className={`text-xs font-medium ${isSubtask ? 'text-blue-600' : 'text-blue-600'}`}>
              #{task.key}
            </span>
            {isSubtask && task.parentTaskTitle && (
              <span className="text-xs text-gray-500 italic" title={`Parent: ${task.parentTaskTitle}`}>
                ({task.parentTaskTitle})
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${getStatusColor(task.status)}`}>
              {getStatusLabel(task.status)}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full text-white ${
              task.priority === 'highest' ? 'bg-red-600' :
              task.priority === 'high' ? 'bg-red-500' :
              task.priority === 'medium' ? 'bg-yellow-500' :
              task.priority === 'low' ? 'bg-green-500' :
              'bg-gray-500'
            }`}>
              {task.priority}
            </span>
          </div>
        </div>
        <h4 className={`font-medium mb-1 ${isSubtask ? 'text-gray-800' : 'text-gray-900'}`}>
          {isSubtask && <span className="text-blue-600 mr-1">└─</span>}
          {task.title}
        </h4>
        {task.description && (
          <p className="text-xs text-gray-600 line-clamp-2 mb-2">{task.description}</p>
        )}
        <div className="flex items-center justify-between mb-2">
          {task.assigneeNames.length > 0 && (
            <div className="flex -space-x-1">
              {task.assigneeNames.slice(0, 3).map((name, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center border-2 border-white"
                  title={name}
                >
                  {name[0]?.toUpperCase() || ''}
                </div>
              ))}
              {task.assigneeNames.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-300 text-xs flex items-center justify-center border-2 border-white">
                  +{task.assigneeNames.length - 3}
                </div>
              )}
            </div>
          )}
          {task.dueDate && (
            <div className={`flex items-center gap-1 text-xs ${
              task.isOverdue
                ? 'text-red-600 font-semibold bg-red-50 px-2 py-1 rounded'
                : 'text-gray-600'
            }`}>
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(task.dueDate), 'dd/MM/yyyy')}</span>
              {task.isOverdue && <span className="font-bold">!</span>}
            </div>
          )}
        </div>
        {task.images.length > 0 && (
          <div className="flex gap-1 mb-2 overflow-x-auto">
            {task.images.slice(0, 4).map(img => (
              <button
                key={img.id}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  openImage(img.imageUrl || ''); 
                }}
                className="w-12 h-12 rounded overflow-hidden border hover:border-blue-500"
              >
                <img 
                  src={img.imageUrl || ''} 
                  alt={img.fileName || 'Image'} 
                  className="w-full h-full object-cover" 
                />
              </button>
            ))}
          </div>
        )}
        {task.files.length > 0 && (
          <div className="flex flex-wrap gap-1 text-xs">
            {task.files.map(file => (
              <button
                key={file.id}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  downloadFile(file.fileUrl || '', file.fileName || 'download'); 
                }}
                className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
              >
                <Download className="w-3 h-3" />
                <span className="truncate max-w-20">{file.fileName || 'File'}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {showImage && imageUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImage(false)}
        >
          <img src={imageUrl} alt="Full" className="max-w-full max-h-full rounded-lg" />
        </div>
      )}
    </>
  );
}