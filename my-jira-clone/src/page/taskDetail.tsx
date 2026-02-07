
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { TaskService } from "../service";
import { TaskDetailDto } from "../interface/kanbanInterface";
import { toast } from "sonner";
import { isLoggedIn } from "../helper/auth";
import TaskDetailModal from "../components/TaskDetailModal";
import KanbanBoard from "../components/KanbanBoard";
export default function TaskDetailPage() {
  const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<TaskDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [board, setBoard] = useState<any>(null);
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    if (!projectId || !taskId) {
      navigate('/board');
      return;
    }
    loadTaskDetail();
    loadBoard();
  }, [projectId, taskId, navigate]);
  const loadTaskDetail = async () => {
    try {
      setLoading(true);
      const taskDetail = await TaskService.getDetail(Number(projectId), Number(taskId));
      setTask(taskDetail);
    } catch (error: any) {
      toast.error(error.message || 'Không thể tải chi tiết task');
      navigate(`/board/${projectId}`);
    } finally {
      setLoading(false);
    }
  };
  const loadBoard = async () => {
    try {
      const boardData = await TaskService.getKanban(Number(projectId));
      setBoard(boardData);
    } catch (error: any) {
      console.error('Error loading board:', error);
    }
  };
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Đang tải chi tiết task...</span>
      </div>
    );
  }
  if (!task) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Không tìm thấy task</h2>
          <button
            onClick={() => navigate(`/board/${projectId}`)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Quay lại board
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
        <button
          onClick={() => navigate(`/board/${projectId}`)}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại board
        </button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {task.projectName} - Task #{task.key}
        </h1>
      </div>
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <TaskDetailModal
                task={task}
                projectId={Number(projectId)}
                onClose={() => {
                  navigate(`/board`, { state: { selectedProjectId: Number(projectId) } });
                }}
                onUpdate={loadTaskDetail}
              />
            </div>
          </div>
          {board && (
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 sticky top-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  Board View
                </h2>
                <div className="overflow-x-auto max-h-[600px]">
                  <KanbanBoard
                    columns={board.columns}
                    onTaskMove={async (taskId, status, position) => {
                      try {
                        const userId = parseInt(localStorage.getItem('userId') || '1');
                        await TaskService.updateStatus(Number(projectId), taskId, status, userId);
                        await loadBoard();
                        await loadTaskDetail();
                        toast.success('Cập nhật task thành công');
                      } catch (error: any) {
                        toast.error(error.message || 'Không thể cập nhật task');
                      }
                    }}
                    onTaskClick={(clickedTask) => {
                      if (clickedTask.id !== task.id) {
                        navigate(`/board/${projectId}/task/${clickedTask.id}`);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}