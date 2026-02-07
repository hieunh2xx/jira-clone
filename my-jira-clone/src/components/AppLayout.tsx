import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { ProjectService } from "../service/project";
import { TaskService } from "../service/task";
import { toast } from "sonner";
import { isLoggedIn } from "../helper/auth";
import type { Project } from "../interface/types";
import { Menu, ChevronRight } from "lucide-react";
interface AppLayoutProps {
  children: React.ReactNode;
  showProjects?: boolean;
}
export default function AppLayout({ children, showProjects = true }: AppLayoutProps) {
  const [projects, setProjects] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [projectTaskCounts, setProjectTaskCounts] = useState<Record<number, number>>({});
  const navigate = useNavigate();
  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await ProjectService.getMyProjects();
      setProjects(data);
      applyDepartmentFilter(data, selectedDepartment);
      if (data && data.length > 0) {
        if (!selectedProject) {
          setSelectedProject(data[0].id);
        }
        loadTaskCounts(data);
      }
    } catch (error: any) {
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
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    loadProjects();
  }, [navigate]);
  useEffect(() => {
    applyDepartmentFilter(projects, selectedDepartment);
  }, [selectedDepartment, projects]);
  const handleProjectSelect = (id: number) => {
    setSelectedProject(id);
    navigate('/board', { state: { selectedProjectId: id } });
  };
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl active:scale-95"
          title="Mở sidebar (Ctrl+B)"
          aria-label="Mở sidebar"
        >
          <Menu className="w-5 h-5 text-slate-900 dark:text-slate-100" />
        </button>
      )}
      <div className={`transition-all duration-300 ease-in-out ${sidebarOpen ? "w-64" : "w-0"} overflow-hidden`}>
        <Sidebar
          projects={filteredProjects.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description || '',
            teamMembers: [],
            tasks: Array(projectTaskCounts[p.id] || 0).fill(null)
          }))}
          selectedProject={selectedProject || 0}
          setSelectedProject={handleProjectSelect}
          departments={departments}
          selectedDepartment={selectedDepartment}
          onDepartmentChange={setSelectedDepartment}
          isOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          disableNavigation={!showProjects}
        />
      </div>
      {!sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setSidebarOpen(true)}
        />
      )}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}