
import { useState, useMemo } from "react";
import { 
  Zap, 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Circle,
  Play,
  Square,
  ChevronDown,
  ChevronRight,
  Target,
  TrendingUp,
  AlertCircle,
  MoreHorizontal,
  Edit2,
  Trash2,
  Archive
} from "lucide-react";
import { format, differenceInDays, isAfter, isBefore, addDays } from "date-fns";
import { vi } from "date-fns/locale";
import { TaskDto } from "../interface/kanbanInterface";
export interface Sprint {
  id: string;
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
  status: "planning" | "active" | "completed";
  taskIds: number[];
  createdAt: string;
}
interface SprintManagementProps {
  sprints: Sprint[];
  tasks: TaskDto[];
  onCreateSprint: (sprint: Omit<Sprint, "id" | "createdAt">) => void;
  onUpdateSprint: (sprint: Sprint) => void;
  onDeleteSprint: (sprintId: string) => void;
  onStartSprint: (sprintId: string) => void;
  onCompleteSprint: (sprintId: string) => void;
  onAddTaskToSprint: (sprintId: string, taskId: number) => void;
  onRemoveTaskFromSprint: (sprintId: string, taskId: number) => void;
  disabled?: boolean;
}
export default function SprintManagement({
  sprints,
  tasks,
  onCreateSprint,
  onUpdateSprint,
  onDeleteSprint,
  onStartSprint,
  onCompleteSprint,
  onAddTaskToSprint,
  onRemoveTaskFromSprint,
  disabled
}: SprintManagementProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedSprints, setExpandedSprints] = useState<Set<string>>(new Set());
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [sprintName, setSprintName] = useState("");
  const [sprintGoal, setSprintGoal] = useState("");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 14), "yyyy-MM-dd"));
  const activeSprint = useMemo(() => 
    sprints.find(s => s.status === "active"), 
    [sprints]
  );
  const backlogTasks = useMemo(() => {
    const sprintTaskIds = new Set(sprints.flatMap(s => s.taskIds));
    return tasks.filter(t => !sprintTaskIds.has(t.id) && t.status !== 'done');
  }, [tasks, sprints]);
  const getSprintStats = (sprint: Sprint) => {
    const sprintTasks = tasks.filter(t => sprint.taskIds.includes(t.id));
    const total = sprintTasks.length;
    const completed = sprintTasks.filter(t => t.status === 'done').length;
    const inProgress = sprintTasks.filter(t => t.status === 'in_progress').length;
    const todo = sprintTasks.filter(t => t.status === 'todo').length;
    const progress = total > 0 ? (completed / total) * 100 : 0;
    return { total, completed, inProgress, todo, progress, tasks: sprintTasks };
  };
  const getRemainingDays = (sprint: Sprint) => {
    if (sprint.status === 'completed') return 0;
    const end = new Date(sprint.endDate);
    const today = new Date();
    return Math.max(0, differenceInDays(end, today));
  };
  const toggleExpand = (sprintId: string) => {
    const newExpanded = new Set(expandedSprints);
    if (newExpanded.has(sprintId)) {
      newExpanded.delete(sprintId);
    } else {
      newExpanded.add(sprintId);
    }
    setExpandedSprints(newExpanded);
  };
  const handleCreateSprint = () => {
    if (!sprintName.trim()) return;
    onCreateSprint({
      name: sprintName.trim(),
      goal: sprintGoal.trim() || undefined,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      status: "planning",
      taskIds: [],
    });
    resetForm();
    setShowCreateForm(false);
  };
  const handleUpdateSprint = () => {
    if (!editingSprint || !sprintName.trim()) return;
    onUpdateSprint({
      ...editingSprint,
      name: sprintName.trim(),
      goal: sprintGoal.trim() || undefined,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
    });
    resetForm();
    setEditingSprint(null);
  };
  const startEditing = (sprint: Sprint) => {
    setEditingSprint(sprint);
    setSprintName(sprint.name);
    setSprintGoal(sprint.goal || "");
    setStartDate(format(new Date(sprint.startDate), "yyyy-MM-dd"));
    setEndDate(format(new Date(sprint.endDate), "yyyy-MM-dd"));
  };
  const resetForm = () => {
    setSprintName("");
    setSprintGoal("");
    setStartDate(format(new Date(), "yyyy-MM-dd"));
    setEndDate(format(addDays(new Date(), 14), "yyyy-MM-dd"));
  };
  const getStatusBadge = (status: Sprint["status"]) => {
    switch (status) {
      case "active":
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium">
            <Play className="w-3 h-3" />
            Đang chạy
          </span>
        );
      case "completed":
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs font-medium">
            <CheckCircle2 className="w-3 h-3" />
            Đã hoàn thành
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 rounded-full text-xs font-medium">
            <Circle className="w-3 h-3" />
            Lên kế hoạch
          </span>
        );
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Sprint Management
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {activeSprint ? `Sprint hiện tại: ${activeSprint.name}` : "Chưa có sprint nào đang chạy"}
            </p>
          </div>
        </div>
        {!disabled && !showCreateForm && !editingSprint && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tạo Sprint
          </button>
        )}
      </div>
      {(showCreateForm || editingSprint) && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
            {editingSprint ? "Chỉnh sửa Sprint" : "Tạo Sprint mới"}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tên Sprint <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={sprintName}
                onChange={(e) => setSprintName(e.target.value)}
                placeholder="Sprint 1"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Mục tiêu Sprint
              </label>
              <textarea
                value={sprintGoal}
                onChange={(e) => setSprintGoal(e.target.value)}
                placeholder="Mục tiêu cần đạt được trong sprint này..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Ngày bắt đầu
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Ngày kết thúc
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  resetForm();
                  setShowCreateForm(false);
                  setEditingSprint(null);
                }}
                className="flex-1 px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={editingSprint ? handleUpdateSprint : handleCreateSprint}
                disabled={!sprintName.trim()}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingSprint ? "Cập nhật" : "Tạo Sprint"}
              </button>
            </div>
          </div>
        </div>
      )}
      {activeSprint && (
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold">{activeSprint.name}</h3>
              {activeSprint.goal && (
                <p className="text-white/80 text-sm mt-1">{activeSprint.goal}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{getRemainingDays(activeSprint)}</div>
              <div className="text-white/80 text-sm">ngày còn lại</div>
            </div>
          </div>
          {(() => {
            const stats = getSprintStats(activeSprint);
            return (
              <>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-3">
                  <div 
                    className="h-full bg-white transition-all duration-500"
                    style={{ width: `${stats.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>{stats.completed}/{stats.total} tasks hoàn thành</span>
                  <span>{Math.round(stats.progress)}%</span>
                </div>
              </>
            );
          })()}
        </div>
      )}
      <div className="space-y-4">
        {sprints.map(sprint => {
          const stats = getSprintStats(sprint);
          const isExpanded = expandedSprints.has(sprint.id);
          const remainingDays = getRemainingDays(sprint);
          return (
            <div 
              key={sprint.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              <div 
                className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                onClick={() => toggleExpand(sprint.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-slate-900 dark:text-white">
                          {sprint.name}
                        </h4>
                        {getStatusBadge(sprint.status)}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(sprint.startDate), "dd/MM")} - {format(new Date(sprint.endDate), "dd/MM/yyyy")}
                        </span>
                        {sprint.status === "active" && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {remainingDays} ngày còn lại
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-900 dark:text-white">
                        {Math.round(stats.progress)}%
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {stats.completed}/{stats.total} tasks
                      </div>
                    </div>
                    {!disabled && (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {sprint.status === "planning" && !activeSprint && (
                          <button
                            onClick={() => onStartSprint(sprint.id)}
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="Bắt đầu Sprint"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        {sprint.status === "active" && (
                          <button
                            onClick={() => onCompleteSprint(sprint.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Hoàn thành Sprint"
                          >
                            <Square className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => startEditing(sprint)}
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteSprint(sprint.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      sprint.status === 'completed' 
                        ? 'bg-blue-500' 
                        : sprint.status === 'active' 
                        ? 'bg-green-500' 
                        : 'bg-slate-400'
                    }`}
                    style={{ width: `${stats.progress}%` }}
                  />
                </div>
              </div>
              {isExpanded && (
                <div className="border-t border-slate-200 dark:border-slate-700">
                  {sprint.goal && (
                    <div className="px-4 py-3 bg-purple-50 dark:bg-purple-900/20 border-b border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 text-sm">
                        <Target className="w-4 h-4 text-purple-600" />
                        <span className="font-medium text-purple-700 dark:text-purple-400">Mục tiêu:</span>
                        <span className="text-purple-600 dark:text-purple-300">{sprint.goal}</span>
                      </div>
                    </div>
                  )}
                  {stats.tasks.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                      <p>Chưa có task nào trong sprint này</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                      {stats.tasks.map(task => (
                        <div 
                          key={task.id}
                          className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {task.status === 'done' ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              ) : task.status === 'in_progress' ? (
                                <Clock className="w-5 h-5 text-blue-600" />
                              ) : (
                                <Circle className="w-5 h-5 text-slate-400" />
                              )}
                              <div>
                                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                  #{task.key}
                                </span>
                                <h5 className={`font-medium ${
                                  task.status === 'done' 
                                    ? 'text-slate-400 line-through' 
                                    : 'text-slate-900 dark:text-white'
                                }`}>
                                  {task.title}
                                </h5>
                              </div>
                            </div>
                            {!disabled && sprint.status !== 'completed' && (
                              <button
                                onClick={() => onRemoveTaskFromSprint(sprint.id, task.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                title="Xóa khỏi sprint"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {backlogTasks.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
              <Archive className="w-5 h-5 text-slate-500" />
              Backlog ({backlogTasks.length} tasks)
            </h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-64 overflow-y-auto">
            {backlogTasks.map(task => (
              <div 
                key={task.id}
                className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      #{task.key}
                    </span>
                    <h5 className="font-medium text-slate-900 dark:text-white">
                      {task.title}
                    </h5>
                  </div>
                  {!disabled && activeSprint && (
                    <button
                      onClick={() => onAddTaskToSprint(activeSprint.id, task.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Thêm vào Sprint
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {sprints.length === 0 && !showCreateForm && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
          <Zap className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            Chưa có Sprint nào
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Tạo sprint đầu tiên để bắt đầu quản lý công việc theo phương pháp Agile
          </p>
          {!disabled && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tạo Sprint đầu tiên
            </button>
          )}
        </div>
      )}
    </div>
  );
}