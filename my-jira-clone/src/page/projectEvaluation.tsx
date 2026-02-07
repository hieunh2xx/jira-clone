import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { ProjectService } from "../service/project";
import { ProjectEvaluationService } from "../service/projectEvaluation";
import { toast } from "sonner";
import Sidebar from "../components/Sidebar";
import { useSidebar } from "../hooks/useSidebar";
import { ErrorBoundary } from "../components/ErrorBoundary";
import ProjectImagesProcessTab from "../components/ProjectEvaluation/ProjectImagesProcessTab";
import ProjectImprovementTab from "../components/ProjectEvaluation/ProjectImprovementTab";
import ProjectTrialEvaluationTab from "../components/ProjectEvaluation/ProjectTrialEvaluationTab";
import ProjectQCDEvaluationTab from "../components/ProjectEvaluation/ProjectQCDEvaluationTab";
import ProjectEvaluationsViewTab from "../components/ProjectEvaluation/ProjectEvaluationsViewTab";
import type { ProjectDto } from "../service/project";
import type { ProjectEvaluationStatusDto } from "../service/projectEvaluation";
import { hasRole, getUserId } from "../helper/auth";
import { RotateCcw } from "lucide-react";

type TabType = "images-process" | "improvement" | "trial" | "evaluation" | "view-evaluations";

export default function ProjectEvaluationPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { isOpen, toggleSidebar } = useSidebar();
  const [project, setProject] = useState<ProjectDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("images-process");
  const [evaluationStatus, setEvaluationStatus] = useState<ProjectEvaluationStatusDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [projectTaskCounts, setProjectTaskCounts] = useState<Record<number, number>>({});

  const projectIdNum = projectId ? parseInt(projectId, 10) : 0;

  useEffect(() => {
    if (projectIdNum && projectIdNum > 0) {
      loadProject();
      loadEvaluationStatus();
      loadProjects();
    } else {
      setLoading(false);
      toast.error("ID dự án không hợp lệ");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectIdNum]);

  // Keyboard shortcuts for navigation - must be before early returns
  useEffect(() => {
    if (!project) return; // Don't set up keyboard shortcuts if project not loaded
    
    // Calculate isLeader here to avoid using it before declaration
    const isProjectLeader = hasRole('team_lead') || hasRole('system_admin') || 
      (project && project.createdBy === getUserId());
    
    const tabs = [
      { id: "images-process" as TabType, label: "Hình ảnh & Quá trình" },
      { id: "improvement" as TabType, label: "Cải tiến" },
      { id: "trial" as TabType, label: "Thử nghiệm" },
      { id: "evaluation" as TabType, label: "Đánh giá" },
      ...(isProjectLeader ? [{ id: "view-evaluations" as TabType, label: "Xem đánh giá" }] : []),
    ];
    
    const currentTabIndex = tabs.findIndex(tab => tab.id === activeTab);
    const canGoPrev = currentTabIndex > 0;
    const canGoNxt = currentTabIndex < tabs.length - 1;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.key === 'ArrowLeft' && canGoPrev) {
        e.preventDefault();
        setActiveTab(tabs[currentTabIndex - 1].id);
      } else if (e.key === 'ArrowRight' && canGoNxt) {
        e.preventDefault();
        setActiveTab(tabs[currentTabIndex + 1].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, project]);

  const loadProjects = async () => {
    try {
      const data = await ProjectService.getMyProjects();
      setProjects(Array.isArray(data) ? data : []);
      // Load task counts
      const { TaskService } = await import("../service");
      const counts: Record<number, number> = {};
      await Promise.all(
        (Array.isArray(data) ? data : []).map(async (p: any) => {
          try {
            const board = await TaskService.getKanban(p.id);
            const totalTasks = board.columns.reduce((sum: number, col: any) => sum + col.tasks.length, 0);
            counts[p.id] = totalTasks;
          } catch (error) {
            counts[p.id] = 0;
          }
        })
      );
      setProjectTaskCounts(counts);
    } catch (error: any) {
      console.error("Error loading projects:", error);
    }
  };

  const loadProject = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ProjectService.getById(projectIdNum);
      // Handle both response formats: { data: ... } or direct data
      const projectData = (response as any)?.data || response;
      if (!projectData || !projectData.id) {
        throw new Error("Dữ liệu dự án không hợp lệ");
      }
      setProject(projectData);
      
      // Check if project requires evaluation
      if (projectData.requiresEvaluation) {
        checkEvaluationRequirement();
      }
    } catch (error: any) {
      console.error("Error loading project:", error);
      const errorMessage = error?.message || "Không thể tải thông tin dự án";
      setError(errorMessage);
      toast.error(errorMessage);
      setProject(null);
    } finally {
      setLoading(false);
    }
  };

  const loadEvaluationStatus = async () => {
    try {
      const status = await ProjectEvaluationService.getEvaluationStatus(projectIdNum);
      if (status && typeof status === 'object' && 'projectId' in status) {
        setEvaluationStatus(status);
      }
    } catch (error: any) {
      console.error("Error loading evaluation status:", error);
      // Don't show error toast for status, it's optional - API might not exist yet
      setEvaluationStatus(null);
    }
  };

  const checkEvaluationRequirement = async () => {
    try {
      // Check if user is project leader - leaders don't need to evaluate
      const isLeader = hasRole('team_lead') || hasRole('system_admin') || 
        (project && project.createdBy === getUserId());
      
      if (isLeader) {
        // Leader doesn't need to evaluate, skip check
        return;
      }
      
      const status = await ProjectEvaluationService.getEvaluationStatus(projectIdNum);
      if (status && typeof status === 'object' && status.requiresEvaluation && !status.hasEvaluated) {
        // Redirect to evaluation tab if evaluation is required
        setActiveTab("evaluation");
        toast.info("Bạn cần đánh giá dự án này trước khi xem thông tin chi tiết");
      }
    } catch (error) {
      console.error("Error checking evaluation requirement:", error);
      // Silently fail - evaluation might not be set up yet
    }
  };

  const handleCompleteProject = async () => {
    if (!project) return;
    try {
      await ProjectService.complete(project.id);
      toast.success("Đã đánh dấu hoàn thành dự án. Các thành viên từ nhóm khác cần đánh giá trước khi xem thông tin dự án.");
      await loadProject();
      await loadEvaluationStatus();
    } catch (error: any) {
      console.error("Error completing project:", error);
      toast.error(error?.message || "Không thể hoàn thành dự án");
    }
  };

  const handleReopenProject = async () => {
    if (!project) return;
    try {
      await ProjectService.reopen(project.id);
      toast.success("Đã mở lại dự án. Dự án có thể tiếp tục được chỉnh sửa.");
      await loadProject();
      await loadEvaluationStatus();
    } catch (error: any) {
      console.error("Error reopening project:", error);
      toast.error(error?.message || "Không thể mở lại dự án");
    }
  };

  // Check if user is project leader (team_lead or project creator)
  const isLeader = hasRole('team_lead') || hasRole('system_admin') || 
    (project && project.createdBy === getUserId());
  
  // Check if project is readonly for current user
  // Readonly when: project is completed AND user has evaluated AND user is not leader
  const isReadOnly = project?.isCompleted === true && 
    evaluationStatus?.hasEvaluated === true && 
    !isLeader;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate("/projects")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Quay lại danh sách dự án
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <p className="text-slate-500 dark:text-slate-400 mb-4">Không tìm thấy dự án</p>
          <button
            onClick={() => navigate("/projects")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Quay lại danh sách dự án
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "images-process" as TabType, label: "Hình ảnh & Quá trình" },
    { id: "improvement" as TabType, label: "Cải tiến" },
    { id: "trial" as TabType, label: "Thử nghiệm" },
    { id: "evaluation" as TabType, label: "Đánh giá" },
    ...(isLeader ? [{ id: "view-evaluations" as TabType, label: "Xem đánh giá" }] : []),
  ];

  const currentTabIndex = tabs.findIndex(tab => tab.id === activeTab);
  const canGoPrevious = currentTabIndex > 0;
  const canGoNext = currentTabIndex < tabs.length - 1;

  const handlePreviousTab = () => {
    if (canGoPrevious) {
      setActiveTab(tabs[currentTabIndex - 1].id);
    }
  };

  const handleNextTab = () => {
    if (canGoNext) {
      setActiveTab(tabs[currentTabIndex + 1].id);
    }
  };

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
        selectedProject={projectIdNum}
        setSelectedProject={(id) => {
          if (id !== projectIdNum) {
            navigate(`/projects/${id}/evaluation`);
          }
        }}
        disableNavigation={false}
        isOpen={isOpen}
        onToggleSidebar={toggleSidebar}
      />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isOpen ? "ml-10" : "ml-0"}`}>
        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigate("/projects")}
                className="flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                <span>Back to Projects</span>
              </button>
              {project.isCompleted ? (
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                  Completed
                </span>
              ) : (
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-full text-sm font-medium">
                  {project.status || "in-progress"}
                </span>
              )}
            </div>
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">{project.name}</h1>
              <p className="text-slate-600 dark:text-slate-400">{project.description || "Upgrade from manual Excel processes to integrated ERP system"}</p>
            </div>
            <div className="flex items-center gap-3">
              {!project.isCompleted && isLeader && (
                <button
                  onClick={handleCompleteProject}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Hoàn thành dự án</span>
                </button>
              )}
              {project.isCompleted && isLeader && (
                <button
                  onClick={handleReopenProject}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Mở lại dự án</span>
                </button>
              )}
              {isReadOnly && (
                <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full text-sm font-medium">
                  Chế độ chỉ đọc (Đã đánh giá)
                </span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <div className="px-6">
              <div className="flex items-center justify-between">
                <div className="flex space-x-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                        activeTab === tab.id
                          ? "text-slate-900 dark:text-slate-100 border-b-2 border-slate-900 dark:border-slate-100"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePreviousTab}
                    disabled={!canGoPrevious}
                    className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      canGoPrevious
                        ? "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                    }`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Trước</span>
                  </button>
                  <button
                    onClick={handleNextTab}
                    disabled={!canGoNext}
                    className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      canGoNext
                        ? "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                    }`}
                  >
                    <span>Sau</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6 bg-slate-50 dark:bg-slate-900">
            <ErrorBoundary>
              {activeTab === "images-process" && projectIdNum > 0 && (
                <ProjectImagesProcessTab projectId={projectIdNum} readonly={isReadOnly} />
              )}
              {activeTab === "improvement" && projectIdNum > 0 && (
                <ProjectImprovementTab projectId={projectIdNum} readonly={isReadOnly} />
              )}
              {activeTab === "trial" && projectIdNum > 0 && (
                <ProjectTrialEvaluationTab projectId={projectIdNum} readonly={isReadOnly} />
              )}
              {activeTab === "evaluation" && projectIdNum > 0 && (
                <ProjectQCDEvaluationTab 
                  projectId={projectIdNum} 
                  evaluationStatus={evaluationStatus}
                  onEvaluationSubmit={loadEvaluationStatus}
                  readonly={isReadOnly}
                />
              )}
              {activeTab === "view-evaluations" && projectIdNum > 0 && isLeader && (
                <ProjectEvaluationsViewTab projectId={projectIdNum} />
              )}
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}
