import { useEffect, useMemo, useState, useRef } from "react";
import { DashboardService, UserTaskDashboardDto, UserTaskTimelineDto } from "../service/dashboard";
import { DepartmentDto, DepartmentService } from "../service/department";
import { ProjectService } from "../service/project";
import { TaskService } from "../service/task";
import { getUserRoles, getUserId, hasAnyRole, isLoggedIn } from "../helper/auth";
import { Loader2, Search, Calendar, Plus, Menu } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import MultiUserTimelineChart from "../components/MultiUserTimelineChart";
import { UserTaskTimeline } from "../components/UserTaskTimelineChart";
import Sidebar from "../components/Sidebar";
import { useSidebar } from "../hooks/useSidebar";
interface Project {
  id: number;
  name: string;
  code: string;
}
export default function UserDashboardPage() {
  const roles = getUserRoles();
  const currentUserId = getUserId();
  const isAdmin = roles.includes("system_admin");
  const isManager = roles.includes("department_manager") || roles.includes("team_lead");
  const isMember = roles.includes("member");
  const canViewDashboard = hasAnyRole(['system_admin', 'department_manager', 'team_lead']);
  const { isOpen, toggleSidebar } = useSidebar();
  const [loading, setLoading] = useState(true);
  const [dashboards, setDashboards] = useState<UserTaskDashboardDto[]>([]);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [projectTaskCounts, setProjectTaskCounts] = useState<Record<number, number>>({});
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const navigate = useNavigate();
  const location = useLocation();
  const loadProjects = async () => {
    try {
      const data = await ProjectService.getMyProjects();
      setProjects(data);
      applyDepartmentFilter(data, selectedDepartment);
      if (data && data.length > 0) {
        loadTaskCounts(data);
      }
    } catch (error: any) {
      // Error loading projects
    }
  };
  const loadTaskCounts = async (projectsList: any[]) => {
    const counts: Record<number, number> = {};
    try {
      await Promise.all(
        projectsList.map(async (project) => {
          try {
            const board = await TaskService.getKanban(project.id);
            const totalTasks = board.columns.reduce((sum, col) => sum + col.tasks.length, 0);
            counts[project.id] = totalTasks;
          } catch (error) {
            counts[project.id] = 0;
          }
        })
      );
      setProjectTaskCounts(counts);
    } catch (error) {
      // Error loading task counts
    }
  };
  const applyDepartmentFilter = (projectsList: any[], department: string | null) => {
    if (!department || department === 'all') {
      setFilteredProjects(projectsList);
    } else {
      setFilteredProjects(projectsList.filter(p => p.departmentName === department));
    }
  };
  const departmentsList = Array.from(new Set(projects.map(p => p.departmentName).filter(Boolean)));
  const loadDepartments = async () => {
    try {
      const data = await DepartmentService.getAll();
      setDepartments(data);
    } catch (error: any) {
      toast.error(error?.message || "Không thể tải danh sách phòng ban");
    }
  };
  const loadDashboards = async (filters?: { departmentId?: number; userId?: number; projectId?: number }) => {
    try {
      setLoading(true);
      const data = await DashboardService.getUserTaskDashboard(filters);
      setDashboards(data);
    } catch (error: any) {
      toast.error(error?.message || "Không thể tải dữ liệu dashboard nhân viên");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    loadProjects();
    if (isAdmin) {
      loadDepartments();
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (canViewDashboard && !isMember) {
          const userFilter =
            selectedUser !== "all" ? Number(selectedUser) : undefined;
          const projectFilter = selectedProject || undefined;
          loadDashboards({ 
            departmentId: undefined,
            userId: userFilter,
            projectId: projectFilter
          });
        } else if (isMember && currentUserId) {
          loadDashboards({ userId: currentUserId });
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [navigate, isAdmin, canViewDashboard, isMember, currentUserId, selectedDepartment, selectedUser]);
  useEffect(() => {
    applyDepartmentFilter(projects, selectedDepartment);
  }, [selectedDepartment, projects]);
  useEffect(() => {
    if (isMember && currentUserId) {
      loadDashboards({ userId: currentUserId });
      return;
    }
    if (!canViewDashboard) {
      return;
    }
    const userFilter =
      selectedUser !== "all" ? Number(selectedUser) : undefined;
    const projectFilter = selectedProject || undefined;
    loadDashboards({ 
      departmentId: undefined,
      userId: userFilter,
      projectId: projectFilter
    });
  }, [selectedDepartment, selectedUser, selectedProject, isMember, currentUserId, canViewDashboard]);
  const prevPathname = useRef<string | undefined>(undefined);
  useEffect(() => {
    const locationState = (location.state as { returnTo?: string; projectCreated?: boolean; selectedProjectId?: number } | null) || null;
    if (location.pathname === '/dashboard/users' && location.pathname !== prevPathname.current) {
      prevPathname.current = location.pathname;
      const returnFromBoard = locationState?.returnTo === '/dashboard/users';
      const projectCreated = locationState?.projectCreated === true;
      if (returnFromBoard || projectCreated) {
        if (canViewDashboard && !isMember) {
          const userFilter =
            selectedUser !== "all" ? Number(selectedUser) : undefined;
          const projectFilter = selectedProject || locationState?.selectedProjectId || undefined;
          loadDashboards({ 
            departmentId: undefined,
            userId: userFilter,
            projectId: projectFilter
          });
        } else if (isMember && currentUserId) {
          loadDashboards({ userId: currentUserId });
        }
      }
    }
  }, [location.pathname]);
  // Filter projects to only show projects where the selected user (or current user) is a team member
  // This is determined by which projects have tasks in the dashboard data
  const availableProjects = useMemo(() => {
    if (selectedUser !== "all") {
      // When a specific user is selected, only show projects where that user has tasks
      const userId = Number(selectedUser);
      const userDashboard = dashboards.find(d => d.userId === userId);
      if (userDashboard) {
        const projectIds = new Set(userDashboard.tasks.map(t => t.projectId).filter(Boolean));
        return projects.filter(p => projectIds.has(p.id));
      }
      return [];
    } else {
      // When showing all users, show projects where any user has tasks
      const projectIds = new Set(
        dashboards.flatMap(d => d.tasks.map(t => t.projectId).filter(Boolean))
      );
      return projects.filter(p => projectIds.has(p.id));
    }
  }, [dashboards, selectedUser, projects]);

  const filteredDashboards = useMemo(() => {
    let filtered = dashboards;
    if (search.trim()) {
      const keyword = search.trim().toLowerCase();
      filtered = filtered.filter((item) => {
        const name = item.fullName?.toLowerCase() ?? "";
        const email = item.email?.toLowerCase() ?? "";
        const dept = item.departmentName?.toLowerCase() ?? "";
        return name.includes(keyword) || email.includes(keyword) || dept.includes(keyword);
      });
    }
    if (selectedProject) {
      filtered = filtered.map(user => {
        const originalTaskCount = user.tasks.length;
        const filteredTasks = user.tasks.filter(task => {
          return task.projectId === selectedProject;
        });
        return {
          ...user,
          tasks: filteredTasks
        };
      }).filter(user => {
        return user.tasks.length > 0;
      });
    }
    return filtered;
  }, [dashboards, search, selectedProject]);
  const handleNavigateTask = (task: UserTaskTimeline) => {
    if (!task.projectId) {
      toast.info("Không tìm thấy thông tin dự án của task này.");
      return;
    }
    navigate(`/board/${task.projectId}/task/${task.taskId}`);
  };
  const userTodayTaskCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    const today = selectedDate;
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    filteredDashboards.forEach(user => {
      const todayTasks = user.tasks.filter(task => {
        if (task.status === "done") return false;
        if (task.dueDate) {
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          if (isSameDay(dueDate, today)) return true;
        }
        const startDate = new Date(task.createdAt);
        startDate.setHours(0, 0, 0, 0);
        const endDate = task.dueDate ? new Date(task.dueDate) : task.updatedAt ? new Date(task.updatedAt) : null;
        if (endDate) {
          endDate.setHours(23, 59, 59, 999);
          return startDate <= todayEnd && endDate >= todayStart;
        }
        return false;
      });
      counts[user.userId] = todayTasks.length;
    });
    return counts;
  }, [filteredDashboards, selectedDate]);
  const timelineData = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const data = filteredDashboards.map(user => {
      const tasks = (user.tasks as UserTaskTimeline[]).map(task => {
        if (task.status === "done" || !task.dueDate) {
          return task;
        }
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((dueDate.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000));
        return {
          ...task,
          isOverdue: diffDays < 0,
          isDueSoon: diffDays >= 0 && diffDays <= 3,
        };
      });
      const subtasksByParent = tasks.reduce((acc, task) => {
        if (task.parentTaskId) {
          if (!acc[task.parentTaskId]) {
            acc[task.parentTaskId] = [];
          }
          acc[task.parentTaskId].push(task);
        }
        return acc;
      }, {} as Record<number, UserTaskTimeline[]>);
      const tasksWithProgress = tasks.map(task => {
        if (!task.parentTaskId && subtasksByParent[task.taskId]) {
          const subtasks = subtasksByParent[task.taskId];
          const completed = subtasks.filter(st => st.status === "done").length;
          const total = subtasks.length;
          const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
          return { ...task, subtaskPercent: percent };
        }
        return task;
      });
      return {
        userId: user.userId,
        userName: `${user.fullName}${user.departmentName ? ` (${user.departmentName})` : ''}`,
        tasks: tasksWithProgress,
      };
    }).filter(user => user.tasks.length > 0);
    return data.sort((a, b) => {
      const countA = userTodayTaskCounts[a.userId] || 0;
      const countB = userTodayTaskCounts[b.userId] || 0;
      if (countA !== countB) {
        return countB - countA;
      }
      return b.tasks.length - a.tasks.length;
    });
  }, [filteredDashboards, userTodayTaskCounts]);
  if (isMember && !canViewDashboard) {
    const myDashboard = filteredDashboards.find(d => d.userId === currentUserId);
    return (
      <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
        <Sidebar
          projects={filteredProjects.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description || '',
            teamMembers: [],
            tasks: Array(projectTaskCounts[p.id] || 0).fill(null)
          }))}
          selectedProject={selectedProject || 0}
          setSelectedProject={(id) => {
            setSelectedProject(id);
          }}
          departments={departmentsList}
          selectedDepartment={selectedDepartment}
          onDepartmentChange={setSelectedDepartment}
          disableNavigation={false}
        />
        <main className="flex-1 overflow-auto">
          <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
            <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    Tasks của tôi
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Xem tất cả tasks đã được giao cho bạn
                  </p>
                </div>
              </div>
            </header>
            <div className="flex-1 overflow-auto px-6 py-6">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : !myDashboard || myDashboard.tasks.length === 0 ? (
                <div className="text-center text-slate-500 dark:text-slate-400 py-12">
                  Bạn chưa có task nào được giao.
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                      Timeline Công việc
                    </h2>
                    <MultiUserTimelineChart 
                      data={[{
                        userId: myDashboard.userId,
                        userName: myDashboard.fullName,
                        tasks: myDashboard.tasks as UserTaskTimeline[]
                      }]}
                      onTaskClick={handleNavigateTask}
                      selectedDate={selectedDate}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }
  if (!canViewDashboard && !isMember) {
    return (
      <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
        <Sidebar
          projects={filteredProjects.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description || '',
            teamMembers: [],
            tasks: Array(projectTaskCounts[p.id] || 0).fill(null)
          }))}
          selectedProject={selectedProject || 0}
          setSelectedProject={(id) => {
            setSelectedProject(id);
          }}
          departments={departmentsList}
          selectedDepartment={selectedDepartment}
          onDepartmentChange={setSelectedDepartment}
          disableNavigation={false}
        />
        <main className="flex-1 overflow-auto">
          <div className="flex h-full items-center justify-center bg-slate-50 dark:bg-slate-900">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Bạn không có quyền truy cập dashboard nhân viên
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Vui lòng liên hệ quản trị viên nếu bạn cần quyền truy cập.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar
        projects={filteredProjects.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          teamMembers: [],
          tasks: Array(projectTaskCounts[p.id] || 0).fill(null)
        }))}
        selectedProject={selectedProject || 0}
        setSelectedProject={(id) => {
          setSelectedProject(id);
        }}
        onCreateProject={async () => {
          navigate('/board');
        }}
        onProjectDeleted={async () => {
          await loadProjects();
          if (canViewDashboard && !isMember) {
            const departmentFilter =
              selectedDepartment && selectedDepartment !== "all" ? Number(selectedDepartment) : undefined;
            const userFilter =
              selectedUser !== "all" ? Number(selectedUser) : undefined;
            loadDashboards({ 
              departmentId: departmentFilter,
              userId: userFilter 
            });
          }
        }}
        departments={departmentsList}
        selectedDepartment={selectedDepartment}
        onDepartmentChange={setSelectedDepartment}
        disableNavigation={false}
        isOpen={isOpen}
        onToggleSidebar={toggleSidebar}
      />
      <main className="flex-1 overflow-auto relative">
        {!isOpen && (
          <button
            onClick={toggleSidebar}
            className="fixed top-4 left-4 z-50 p-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
            title="Hiện sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
          <header className={`border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 px-6 py-4 sticky top-0 z-10 ${!isOpen ? 'pl-16' : ''}`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Dashboard Quản Lý Nhân Viên
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Xem timeline tasks của tất cả nhân viên trên cùng một biểu đồ
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" />
                  <input
                    type="date"
                    value={format(selectedDate, 'yyyy-MM-dd')}
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelectedDate(new Date(e.target.value));
                      }
                    }}
                    className="pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm theo tên, email..."
                    className="pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {isAdmin && (
                  <select
                    value={selectedDepartment || "all"}
                    onChange={(e) => {
                      const value = e.target.value === "all" ? null : e.target.value;
                      setSelectedDepartment(value);
                    }}
                    className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tất cả phòng ban</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                )}
                <select
                  value={selectedProject || "all"}
                  onChange={(e) => {
                    const value = e.target.value === "all" ? null : Number(e.target.value);
                    setSelectedProject(value);
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tất cả dự án</option>
                  {availableProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tất cả nhân viên</option>
                  {filteredDashboards.map((user) => (
                    <option key={user.userId} value={user.userId}>
                      {user.fullName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-auto px-6 py-6">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : timelineData.length === 0 ? (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      Không có dữ liệu nhân viên phù hợp với bộ lọc hiện tại
                    </h3>
                    {selectedProject && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                        Dự án này chưa có tasks được gán cho nhân viên. Hãy tạo tasks và gán cho nhân viên để xem trên dashboard.
                      </p>
                    )}
                  </div>
                  {selectedProject && (
                    <button
                      onClick={async () => {
                        navigate('/board', { state: { selectedProjectId: selectedProject } });
                      }}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                    >
                      <Plus className="w-5 h-5" />
                      Đi đến dự án để tạo task và gán
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className={`p-6 ${!isOpen ? 'flex flex-col items-center' : ''}`}>
                <h2 className={`text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 ${!isOpen ? 'w-full max-w-7xl' : ''}`}>
                  Timeline Tasks - Tất cả nhân viên
                </h2>
                <div className={!isOpen ? 'w-full max-w-7xl' : ''}>
                  <MultiUserTimelineChart 
                    data={timelineData}
                    onTaskClick={handleNavigateTask}
                    selectedDate={selectedDate}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}