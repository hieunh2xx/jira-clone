import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ProjectService } from "../service/project";
import { ProjectEvaluationService } from "../service/projectEvaluation";
import { Search, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ProjectDto } from "../service/project";
import type { ProjectTrialEvaluationDto } from "../service/projectEvaluation";

interface ProjectEvaluationSummary {
  project: ProjectDto;
  improvementPercent: number;
  savingsPerYear: number;
  status: "Đang triển khai" | "Hoàn thành" | "Dự kiến";
}

export default function ProjectEvaluationsListPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectEvaluationSummary[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ProjectEvaluationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [searchKeyword, projects]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const allProjects = await ProjectService.getAll();
      const projectsWithEvaluations: ProjectEvaluationSummary[] = [];

      for (const project of allProjects) {
        try {
          // Get trial evaluations to calculate improvement and savings
          const trialEvaluations = await ProjectEvaluationService.getTrialEvaluations(project.id);
          
          if (trialEvaluations && trialEvaluations.length > 0) {
            // Calculate improvement percentage and savings
            let totalSavings = 0;
            let totalBefore = 0;
            
            trialEvaluations.forEach(trial => {
              // Try to extract numeric values from before/after improvement
              const before = parseFloat(trial.beforeImprovement?.replace(/[^0-9.]/g, '') || '0');
              const after = parseFloat(trial.afterImprovement?.replace(/[^0-9.]/g, '') || '0');
              
              if (before > 0) {
                totalBefore += before;
                totalSavings += (before - after);
              }
            });

            const improvementPercent = totalBefore > 0 
              ? Math.round((totalSavings / totalBefore) * 100) 
              : 0;

            // Extract savings from estimated efficiency (look for $ or USD values)
            let savingsPerYear = 0;
            trialEvaluations.forEach(trial => {
              const efficiency = trial.estimatedEfficiency || '';
              const match = efficiency.match(/\$?([0-9,]+)/);
              if (match) {
                savingsPerYear += parseFloat(match[1].replace(/,/g, ''));
              }
            });

            // Determine status
            let status: "Đang triển khai" | "Hoàn thành" | "Dự kiến" = "Dự kiến";
            if (project.isCompleted) {
              status = "Hoàn thành";
            } else if (project.status === "in-progress" || project.status === "active") {
              status = "Đang triển khai";
            }

            projectsWithEvaluations.push({
              project,
              improvementPercent,
              savingsPerYear,
              status,
            });
          }
        } catch (error) {
          // Skip projects without evaluations
          console.error(`Error loading evaluations for project ${project.id}:`, error);
        }
      }

      setProjects(projectsWithEvaluations);
      setFilteredProjects(projectsWithEvaluations);
    } catch (error: any) {
      console.error("Error loading projects:", error);
      toast.error("Không thể tải danh sách dự án");
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    if (!searchKeyword.trim()) {
      setFilteredProjects(projects);
      return;
    }

    const keyword = searchKeyword.toLowerCase();
    const filtered = projects.filter(p => 
      p.project.name?.toLowerCase().includes(keyword) ||
      p.project.departmentName?.toLowerCase().includes(keyword) ||
      p.project.description?.toLowerCase().includes(keyword)
    );
    setFilteredProjects(filtered);
  };

  const formatDateRange = (startDate?: string, dueDate?: string) => {
    if (!startDate || !dueDate) return "-";
    const start = new Date(startDate);
    const end = new Date(dueDate);
    const startStr = `${String(start.getMonth() + 1).padStart(2, '0')}/${start.getFullYear()}`;
    const endStr = `${String(end.getMonth() + 1).padStart(2, '0')}/${end.getFullYear()}`;
    return `${startStr} - ${endStr}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Hoàn thành":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200";
      case "Đang triển khai":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6">
          Danh sách đánh giá dự án
        </h1>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề hoặc phòng ban..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Project Cards */}
        <div className="space-y-4">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-slate-500 dark:text-slate-400">
                {searchKeyword ? "Không tìm thấy dự án nào" : "Chưa có dự án đánh giá nào"}
              </p>
            </div>
          ) : (
            filteredProjects.map((item) => (
              <div
                key={item.project.id}
                onClick={() => navigate(`/projects/${item.project.id}/evaluation/detail`)}
                className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                        {item.project.name}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Phòng ban</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {item.project.departmentName || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Giai đoạn</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {formatDateRange(item.project.startDate, item.project.dueDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Cải tiến</p>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">
                          +{item.improvementPercent}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Tiết kiệm</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          ${item.savingsPerYear.toLocaleString()}/năm
                        </p>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-slate-400 ml-4 flex-shrink-0" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
