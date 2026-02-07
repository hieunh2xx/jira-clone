import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ProjectDashboard from "../components/ProjectDashboard";
import CreateProjectDialog from "../components/CreateProjectDialog";
import { ProjectService } from "../service";
import { TaskService } from "../service";
import { Loader2, Plus, FolderPlus, Menu } from "lucide-react";
import { toast } from "sonner";
import { isLoggedIn, canCreateProject, isAdmin } from "../helper/auth";
import { useSidebar } from "../hooks/useSidebar";
export default function HomePage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [projectTaskCounts, setProjectTaskCounts] = useState<Record<number, number>>({});
  const { isOpen, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const userIsAdmin = isAdmin();
  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await ProjectService.getMyProjects();
      setProjects(data);
      applyDepartmentFilter(data, selectedDepartment);
      if (data && data.length > 0) {
        const stateProjectId = (location.state as any)?.selectedProjectId;
        const projectToSelect = stateProjectId && data.find(p => p.id === stateProjectId)
          ? stateProjectId
          : data[0].id;
        setSelectedProject(projectToSelect);
        loadTaskCounts(data);
        if (stateProjectId) {
          navigate(location.pathname, { replace: true, state: {} });
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Không thể tải danh sách dự án');
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
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
      console.error('Error loading task counts:', error);
    }
  };
  const applyDepartmentFilter = (projectsList: any[], department: string | null) => {
    if (!department || department === 'all') {
      setFilteredProjects(projectsList);
    } else {
      setFilteredProjects(projectsList.filter(p => p.departmentName === department));
    }
  };
  const departments = Array.from(new Set(projects.map(p => p.departmentName).filter(Boolean)));
  useEffect(() => {
    applyDepartmentFilter(projects, selectedDepartment);
  }, [selectedDepartment, projects]);
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    loadProjects();
  }, [navigate]);
  const handleCreateProject = async (data: { code: string; name: string; description?: string; teamId: number; memberIds?: number[]; departmentId?: number }) => {
    try {
      await ProjectService.create(data);
      toast.success('Tạo dự án thành công!');
      await loadProjects();
      setIsCreateDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Không thể tạo dự án');
      throw error;
    }
  };
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Đang tải dự án...</span>
      </div>
    );
  }
  const currentProject = filteredProjects.find((p) => p.id === selectedProject) || projects.find((p) => p.id === selectedProject);
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
        setSelectedProject={setSelectedProject}
        onCreateProject={() => setIsCreateDialogOpen(true)}
        onProjectDeleted={loadProjects}
        departments={departments}
        selectedDepartment={selectedDepartment}
        onDepartmentChange={setSelectedDepartment}
        isOpen={isOpen}
        onToggleSidebar={toggleSidebar}
      />
      <main className="flex-1 overflow-auto relative">
        {!isOpen && (
          <button
            onClick={toggleSidebar}
            className="absolute top-4 left-4 z-40 p-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
            title="Hiện sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        {filteredProjects.length === 0 ? (
          <div className="flex h-full items-center justify-center p-8">
            <div className="max-w-md w-full text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FolderPlus className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Chưa có dự án nào
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Tạo dự án đầu tiên của bạn để bắt đầu quản lý công việc
                </p>
              </div>
              {canCreateProject() ? (
                <button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Tạo dự án mới
                </button>
              ) : (
                <div className="px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Bạn không có quyền tạo dự án. Vui lòng liên hệ quản trị viên.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : filteredProjects.length > 0 && currentProject ? (
          <ProjectDashboard 
            projectId={currentProject.id} 
            projectName={currentProject.name}
            initialViewMode="board"
          />
        ) : (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            Không tìm thấy dự án
          </div>
        )}
      </main>
      <CreateProjectDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
}