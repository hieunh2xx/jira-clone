
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import ProjectDashboard from "../components/ProjectDashboard";
import { ProjectService } from "../service/project";
import { ProjectEvaluationService } from "../service/projectEvaluation";
import { Loader2, Menu } from "lucide-react";
import { toast } from "sonner";
import { isLoggedIn, hasRole, getUserId } from "../helper/auth";
import { useSidebar } from "../hooks/useSidebar";
export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const projectId = Number(boardId);
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen, toggleSidebar } = useSidebar();
  const [projects, setProjects] = useState<any[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [projectTaskCounts, setProjectTaskCounts] = useState<Record<number, number>>({});
  const [evaluationStatuses, setEvaluationStatuses] = useState<Record<number, any>>({});
  
  const checkEvaluationRequirement = async (project: any) => {
    if (!project.isCompleted || !project.requiresEvaluation) return false;
    try {
      // Check if user is project leader (creator) - leaders don't need to evaluate
      const isLeader = hasRole('team_lead') || hasRole('system_admin') || 
        (project.createdBy === getUserId());
      if (isLeader) {
        return false; // Project leader doesn't need to evaluate
      }
      
      const status = await ProjectEvaluationService.getEvaluationStatus(project.id);
      if (status && typeof status === 'object' && status.requiresEvaluation && !status.hasEvaluated) {
        // Check if user is project member
        try {
          const members = await ProjectService.getMembers(project.id);
          const memberIds = members.map((m: any) => m.id);
          const userId = getUserId();
          const isProjectMember = userId && memberIds.includes(userId);
          
          // If user is not project member (from different team), must evaluate
          if (!isProjectMember) {
            return true; // User from different team needs to evaluate
          }
        } catch (error) {
          console.error("Error checking project members:", error);
        }
      }
      return false;
    } catch (error) {
      console.error("Error checking evaluation requirement:", error);
      return false;
    }
  };
  
  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await ProjectServiceFromIndex.getMyProjects();
      setProjects(data);
      applyDepartmentFilter(data, selectedDepartment);
      if (data && data.length > 0) {
        const stateProjectId = (location.state as any)?.selectedProjectId;
        const projectToSelect = projectId && data.find(p => p.id === projectId)
          ? projectId
          : stateProjectId && data.find(p => p.id === stateProjectId)
          ? stateProjectId
          : data[0].id;
        setSelectedProject(projectToSelect);
        loadTaskCounts(data);
        
        // Check evaluation requirements for all projects
        const statuses: Record<number, any> = {};
        await Promise.all(
          data.map(async (project: any) => {
            try {
              if (project.requiresEvaluation) {
                const status = await ProjectEvaluationService.getEvaluationStatus(project.id);
                if (status && typeof status === 'object') {
                  statuses[project.id] = status;
                }
              }
            } catch (error) {
              // Silently fail
            }
          })
        );
        setEvaluationStatuses(statuses);
        
        // Check if selected project requires evaluation
        const selectedProj = data.find((p: any) => p.id === projectToSelect);
        if (selectedProj) {
          const needsEvaluation = await checkEvaluationRequirement(selectedProj);
          if (needsEvaluation) {
            toast.info("Bạn cần đánh giá dự án này trước khi xem board");
            navigate(`/projects/${selectedProj.id}/evaluation`);
            return;
          }
        }
        
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
      const { TaskService } = await import("../service");
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
  
  // Check evaluation requirement when selected project changes
  useEffect(() => {
    const checkAndRedirect = async () => {
      if (selectedProject && projects.length > 0) {
        const project = projects.find((p: any) => p.id === selectedProject);
        if (project) {
          const needsEvaluation = await checkEvaluationRequirement(project);
          if (needsEvaluation) {
            toast.info("Bạn cần đánh giá dự án này trước khi xem board");
            navigate(`/projects/${project.id}/evaluation`);
          }
        }
      }
    };
    checkAndRedirect();
  }, [selectedProject, projects, navigate]);
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
            className="fixed top-4 left-4 z-50 p-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
            title="Hiện sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        {filteredProjects.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            Không tìm thấy dự án
          </div>
        ) : filteredProjects.length > 0 && currentProject ? (
          <ProjectDashboard 
            projectId={currentProject.id} 
            projectName={currentProject.name}
            initialViewMode="board"
            isSidebarOpen={isOpen}
          />
        ) : (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            Không tìm thấy dự án
          </div>
        )}
      </main>
    </div>
  );
}