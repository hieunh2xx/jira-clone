
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Sun, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  Clock, 
  Star, 
  StarOff,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Filter,
  Search,
  X,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { format, isToday, isTomorrow, isPast, addDays, startOfDay } from "date-fns";
import { vi } from "date-fns/locale";
import { ProjectService, TaskService } from "../service";
import { TaskDto } from "../interface/kanbanInterface";
import { getUserId, getUserFullName, isLoggedIn } from "../helper/auth";
import Sidebar from "../components/Sidebar";
import { ENDPOINTS } from "../constants/endpoints";
import { apiClient } from "../helper/api";
interface MyDayTask extends TaskDto {
  projectName: string;
  isStarred?: boolean;
  isAddedToMyDay?: boolean;
  isOverdue?: boolean | null;
}
export default function MyDayPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<MyDayTask[]>([]);
  const [myDayTasks, setMyDayTasks] = useState<Set<number>>(new Set());
  const [starredTasks, setStarredTasks] = useState<Set<number>>(new Set());
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<number>(0);
  const [projectTaskCounts, setProjectTaskCounts] = useState<Record<number, number>>({});
  const [stats, setStats] = useState({
    total: 0,
    overdue: 0,
    dueToday: 0,
    dueTomorrow: 0,
    completed: 0
  });
  const userId = getUserId();
  const fullName = getUserFullName();
  const today = new Date();
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    loadData();
    const savedMyDay = localStorage.getItem(`myDay_${userId}_${format(today, 'yyyy-MM-dd')}`);
    if (savedMyDay) {
      setMyDayTasks(new Set(JSON.parse(savedMyDay)));
    }
    const savedStarred = localStorage.getItem(`starred_${userId}`);
    if (savedStarred) {
      setStarredTasks(new Set(JSON.parse(savedStarred)));
    }
  }, [navigate, userId]);
  useEffect(() => {
    if (!userId) return;
    const loadStats = async () => {
      try {
        const response = await apiClient.get<any>(ENDPOINTS.DASHBOARD.MY_DAY_STATISTICS(userId));
        setStats(response);
      } catch (error) {
        console.error('Lỗi load My Day stats:', error);
      }
    };
    loadStats();
  }, [userId]);
  const loadData = async () => {
    try {
      setLoading(true);
      const projectsData = await ProjectService.getMyProjects();
      setProjects(projectsData);
      if (projectsData.length > 0) {
        setSelectedProject(projectsData[0].id);
      }
      const tasksPromises = projectsData.map(async (project: any) => {
        try {
          const board = await TaskService.getKanban(project.id);
          return board.columns.flatMap(col => 
            col.tasks.map(task => ({
              ...task,
              projectName: project.name,
            }))
          );
        } catch {
          return [];
        }
      });
      const allTasksArrays = await Promise.all(tasksPromises);
      const tasks = allTasksArrays.flat();
      setAllTasks(tasks);
      const counts: Record<number, number> = {};
      projectsData.forEach((p: any) => {
        const projectTasks = tasks.filter(t => t.projectId === p.id);
        counts[p.id] = projectTasks.length;
      });
      setProjectTaskCounts(counts);
    } catch (error: any) {
      toast.error(error.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };
  const myTasks = useMemo(() => {
    if (!userId) return [];
    return allTasks.filter(task => 
      task.assigneeIds?.includes(userId) && task.status !== 'done'
    );
  }, [allTasks, userId]);
  const tasksInMyDay = useMemo(() => {
    return myTasks.filter(task => myDayTasks.has(task.id));
  }, [myTasks, myDayTasks]);
  const suggestedTasks = useMemo(() => {
    const suggestions: { category: string; tasks: MyDayTask[]; icon: React.ReactNode; color: string }[] = [];
    const overdue = myTasks.filter(task => {
      if (myDayTasks.has(task.id)) return false;
      return task.isOverdue === true;
    });
    if (overdue.length > 0) {
      suggestions.push({
        category: "Quá hạn",
        tasks: overdue,
        icon: <AlertTriangle className="w-4 h-4" />,
        color: "text-red-600 bg-red-50 dark:bg-red-900/20"
      });
    }
    const dueToday = myTasks.filter(task => 
      task.dueDate && isToday(new Date(task.dueDate)) && !myDayTasks.has(task.id)
    );
    if (dueToday.length > 0) {
      suggestions.push({
        category: "Hôm nay",
        tasks: dueToday,
        icon: <Calendar className="w-4 h-4" />,
        color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20"
      });
    }
    const dueTomorrow = myTasks.filter(task => 
      task.dueDate && isTomorrow(new Date(task.dueDate)) && !myDayTasks.has(task.id)
    );
    if (dueTomorrow.length > 0) {
      suggestions.push({
        category: "Ngày mai",
        tasks: dueTomorrow,
        icon: <Clock className="w-4 h-4" />,
        color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20"
      });
    }
    const starred = myTasks.filter(task => 
      starredTasks.has(task.id) && !myDayTasks.has(task.id)
    );
    if (starred.length > 0) {
      suggestions.push({
        category: "Đã đánh dấu",
        tasks: starred,
        icon: <Star className="w-4 h-4" />,
        color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20"
      });
    }
    return suggestions;
  }, [myTasks, myDayTasks, starredTasks]);
  const toggleMyDay = (taskId: number) => {
    const newMyDay = new Set(myDayTasks);
    if (newMyDay.has(taskId)) {
      newMyDay.delete(taskId);
      toast.success("Đã xóa khỏi My Day");
    } else {
      newMyDay.add(taskId);
      toast.success("Đã thêm vào My Day");
    }
    setMyDayTasks(newMyDay);
    localStorage.setItem(`myDay_${userId}_${format(today, 'yyyy-MM-dd')}`, JSON.stringify([...newMyDay]));
  };
  const toggleStar = (taskId: number) => {
    const newStarred = new Set(starredTasks);
    if (newStarred.has(taskId)) {
      newStarred.delete(taskId);
    } else {
      newStarred.add(taskId);
    }
    setStarredTasks(newStarred);
    localStorage.setItem(`starred_${userId}`, JSON.stringify([...newStarred]));
  };
  const completeTask = async (task: MyDayTask) => {
    try {
      await TaskService.updateStatus(task.projectId, task.id, 'done', userId || undefined);
      toast.success("Đã hoàn thành task!");
      const newMyDay = new Set(myDayTasks);
      newMyDay.delete(task.id);
      setMyDayTasks(newMyDay);
      localStorage.setItem(`myDay_${userId}_${format(today, 'yyyy-MM-dd')}`, JSON.stringify([...newMyDay]));
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Không thể cập nhật task");
    }
  };
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'medium': return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      default: return 'text-slate-600 bg-slate-100 dark:bg-slate-700';
    }
  };
  const filteredSuggestions = useMemo(() => {
    if (!searchQuery) return suggestedTasks;
    const query = searchQuery.toLowerCase();
    return suggestedTasks.map(category => ({
      ...category,
      tasks: category.tasks.filter(task => 
        task.title.toLowerCase().includes(query) ||
        task.projectName.toLowerCase().includes(query)
      )
    })).filter(category => category.tasks.length > 0);
  }, [suggestedTasks, searchQuery]);
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        <span className="ml-2 text-gray-600">Đang tải...</span>
      </div>
    );
  }
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar
        projects={projects.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          teamMembers: [],
          tasks: Array(projectTaskCounts[p.id] || 0).fill(null)
        }))}
        selectedProject={selectedProject || 0}
        setSelectedProject={(id) => {
          setSelectedProject(id);
          navigate('/board', { state: { selectedProjectId: id } });
        }}
        disableNavigation={true}
      />
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-red-400 p-8 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Sun className="w-8 h-8" />
            <h1 className="text-3xl font-bold">My Day</h1>
          </div>
          <p className="text-white/90 text-lg">
            {format(today, "EEEE, d MMMM yyyy", { locale: vi })}
          </p>
          <p className="text-white/80 mt-1">
            Xin chào, {fullName}! Bạn có {tasksInMyDay.length} task hôm nay.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6 pt-6 border-t border-white/20">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
              <div className="text-white/80 text-xs font-medium">Tổng Tasks</div>
              <div className="text-2xl font-bold text-white mt-1">{stats.total}</div>
            </div>
            <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-3">
              <div className="text-red-100 text-xs font-medium">Quá hạn</div>
              <div className="text-2xl font-bold text-white mt-1">{stats.overdue}</div>
            </div>
            <div className="bg-yellow-500/30 backdrop-blur-sm rounded-lg p-3">
              <div className="text-yellow-100 text-xs font-medium">Hôm nay</div>
              <div className="text-2xl font-bold text-white mt-1">{stats.dueToday}</div>
            </div>
            <div className="bg-blue-500/30 backdrop-blur-sm rounded-lg p-3">
              <div className="text-blue-100 text-xs font-medium">Ngày mai</div>
              <div className="text-2xl font-bold text-white mt-1">{stats.dueTomorrow}</div>
            </div>
            <div className="bg-green-500/30 backdrop-blur-sm rounded-lg p-3">
              <div className="text-green-100 text-xs font-medium">Hoàn thành</div>
              <div className="text-2xl font-bold text-white mt-1">{stats.completed}</div>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sun className="w-5 h-5 text-amber-500" />
                  Tasks hôm nay ({tasksInMyDay.length})
                </h2>
              </div>
              {tasksInMyDay.length === 0 ? (
                <div className="p-8 text-center">
                  <Sparkles className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400 mb-2">
                    Chưa có task nào trong My Day
                  </p>
                  <p className="text-sm text-slate-400 dark:text-slate-500">
                    Thêm tasks từ gợi ý bên dưới để bắt đầu ngày mới!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {tasksInMyDay.map(task => (
                    <div
                      key={task.id}
                      className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => completeTask(task)}
                          className="mt-1 text-slate-400 hover:text-green-600 transition-colors"
                        >
                          <Circle className="w-5 h-5" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                              #{task.key}
                            </span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {task.projectName}
                            </span>
                          </div>
                          <h3 
                            className="font-medium text-slate-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                            onClick={() => navigate(`/board/${task.projectId}/task/${task.id}`)}
                          >
                            {task.title}
                          </h3>
                          <div className="flex items-center gap-3 mt-2 text-xs">
                            <span className={`px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
                              {task.priority === 'high' ? 'Cao' : task.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                            </span>
                            {task.dueDate && (
                              <span className={`flex items-center gap-1 ${
                                isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate))
                                  ? 'text-red-600'
                                  : 'text-slate-500'
                              }`}>
                                <Calendar className="w-3 h-3" />
                                {format(new Date(task.dueDate), 'dd/MM/yyyy')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => toggleStar(task.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              starredTasks.has(task.id)
                                ? 'text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                                : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                          >
                            {starredTasks.has(task.id) ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => toggleMyDay(task.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    Gợi ý thêm vào My Day
                  </h2>
                  <button
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {showSuggestions ? 'Ẩn' : 'Hiện'} gợi ý
                  </button>
                </div>
                {showSuggestions && (
                  <div className="mt-3 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm kiếm task..."
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
              {showSuggestions && (
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredSuggestions.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                      <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <p>Tuyệt vời! Không có task nào cần gợi ý.</p>
                    </div>
                  ) : (
                    filteredSuggestions.map((category, idx) => (
                      <div key={idx} className="p-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-3 ${category.color}`}>
                          {category.icon}
                          {category.category} ({category.tasks.length})
                        </div>
                        <div className="space-y-2">
                          {category.tasks.map(task => (
                            <div
                              key={task.id}
                              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
                            >
                              <button
                                onClick={() => toggleMyDay(task.id)}
                                className="text-slate-400 hover:text-amber-500 transition-colors"
                              >
                                <Plus className="w-5 h-5" />
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                    #{task.key}
                                  </span>
                                  <span className="text-xs text-slate-400">•</span>
                                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                    {task.projectName}
                                  </span>
                                </div>
                                <h4 
                                  className="text-sm font-medium text-slate-900 dark:text-white truncate cursor-pointer hover:text-blue-600"
                                  onClick={() => navigate(`/board/${task.projectId}/task/${task.id}`)}
                                >
                                  {task.title}
                                </h4>
                              </div>
                              <button
                                onClick={() => toggleStar(task.id)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  starredTasks.has(task.id)
                                    ? 'text-yellow-500'
                                    : 'text-slate-300 opacity-0 group-hover:opacity-100'
                                }`}
                              >
                                {starredTasks.has(task.id) ? <Star className="w-4 h-4 fill-current" /> : <Star className="w-4 h-4" />}
                              </button>
                              <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}