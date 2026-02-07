import { useState, useEffect } from "react";
import { X, Star, Image as ImageIcon, Loader2 } from "lucide-react";
import { ProjectEvaluationService } from "../../service/projectEvaluation";
import { ProjectService } from "../../service/project";
import { toast } from "sonner";
import type { ProjectEvaluationDto, ProjectTrialEvaluationDto, ProjectImprovementDto, ProjectImageDto } from "../../service/projectEvaluation";
import type { ProjectDto } from "../../service/project";

interface ProjectEvaluationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  evaluation: ProjectEvaluationDto;
}

export default function ProjectEvaluationDetailModal({
  isOpen,
  onClose,
  projectId,
  evaluation,
}: ProjectEvaluationDetailModalProps) {
  const [project, setProject] = useState<ProjectDto | null>(null);
  const [trialEvaluations, setTrialEvaluations] = useState<ProjectTrialEvaluationDto[]>([]);
  const [improvements, setImprovements] = useState<ProjectImprovementDto[]>([]);
  const [images, setImages] = useState<ProjectImageDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && projectId > 0 && evaluation.userId) {
      loadData();
    }
  }, [isOpen, projectId, evaluation.userId]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load data for the specific evaluator (evaluation.userId), not current user
      const [projectData, trialData, improvementsData, imagesData, processData] = await Promise.all([
        ProjectService.getById(projectId),
        ProjectEvaluationService.getTrialEvaluations(projectId, evaluation.userId),
        ProjectEvaluationService.getImprovements(projectId, undefined, evaluation.userId),
        ProjectEvaluationService.getImages(projectId, evaluation.userId),
        ProjectEvaluationService.getProcess(projectId, evaluation.userId),
      ]);

      setProject(projectData);
      setTrialEvaluations(Array.isArray(trialData) ? trialData : []);
      setImprovements(Array.isArray(improvementsData) ? improvementsData : []);
      setImages(Array.isArray(imagesData) ? imagesData : []);
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error("Không thể tải thông tin chi tiết");
    } finally {
      setLoading(false);
    }
  };

  const formatDateRange = (startDate?: string, dueDate?: string) => {
    if (!startDate || !dueDate) return "-";
    const start = new Date(startDate);
    const end = new Date(dueDate);
    const startStr = `${String(start.getMonth() + 1).padStart(2, '0')}/${start.getFullYear()}`;
    const endStr = `${String(end.getMonth() + 1).padStart(2, '0')}/${end.getFullYear()}`;
    return `${startStr} - ${endStr}`;
  };

  const getStatusColor = (status?: string, isCompleted?: boolean) => {
    if (isCompleted) {
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200";
    }
    if (status === "in-progress" || status === "active") {
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200";
    }
    return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  };

  const getStatusText = (status?: string, isCompleted?: boolean) => {
    if (isCompleted) return "Hoàn thành";
    if (status === "in-progress" || status === "active") return "Đang triển khai";
    return "Dự kiến";
  };

  const renderStars = (rating?: number) => {
    if (!rating) return <span className="text-slate-400 dark:text-slate-500 text-sm">Chưa đánh giá</span>;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 dark:fill-slate-700 text-gray-200 dark:text-slate-700"
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">({rating}/5)</span>
      </div>
    );
  };

  // Calculate summary values
  const calculateSummary = () => {
    let totalSavings = 0;
    let reductionItems = 0;

    trialEvaluations.forEach(trial => {
      const before = parseFloat(trial.beforeImprovement?.replace(/[^0-9.]/g, '') || '0');
      const after = parseFloat(trial.afterImprovement?.replace(/[^0-9.]/g, '') || '0');
      
      if (before > 0) {
        reductionItems++;
        totalSavings += (before - after);
      }

      // Extract savings from estimated efficiency
      const efficiency = trial.estimatedEfficiency || '';
      const match = efficiency.match(/\$?([0-9,]+)/);
      if (match) {
        totalSavings = Math.max(totalSavings, parseFloat(match[1].replace(/,/g, '')));
      }
    });

    return {
      estimatedEfficiency: totalSavings,
      reductionItems,
      deploymentTime: evaluation.deploymentTime || (project?.startDate && project?.dueDate
        ? Math.ceil((new Date(project.dueDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
        : 0),
    };
  };

  const summary = calculateSummary();

  // Get advantages (after improvements with advantage category)
  const advantages = improvements.filter(i => i.type === "after" && i.category === "advantage");
  const advantagesBefore = improvements.filter(i => i.type === "before" && i.category === "advantage");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto my-8">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Chi tiết đánh giá - {evaluation.userFullName || evaluation.userName}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              {/* Header Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    {project && (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status, project.isCompleted)}`}>
                        {getStatusText(project.status, project.isCompleted)}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-slate-500 dark:text-slate-400">Phòng ban:</span>
                      <span className="ml-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                        {project?.departmentName || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-slate-500 dark:text-slate-400">Giai đoạn triển khai:</span>
                      <span className="ml-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                        {project ? formatDateRange(project.startDate, project.dueDate) : "-"}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Mô tả</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {project?.description || "Không có mô tả"}
                  </p>
                </div>
              </div>

              {/* Q-C-D Evaluation Section */}
              <div className="mb-6 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  Đánh giá Q-C-D / Q-C-D評価
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Quality */}
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h5 className="font-medium text-slate-700 dark:text-slate-300 mb-3">Chất lượng / 品質(Q)</h5>
                    <div className="mb-3">
                      {renderStars(evaluation.qualityRating)}
                    </div>
                    {evaluation.qualityComment && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 whitespace-pre-wrap">
                        {evaluation.qualityComment}
                      </p>
                    )}
                  </div>

                  {/* Cost */}
                  <div className="border-l-4 border-green-500 pl-4">
                    <h5 className="font-medium text-slate-700 dark:text-slate-300 mb-3">Chi phí / コスト (C)</h5>
                    <div className="mb-3">
                      {renderStars(evaluation.costRating)}
                    </div>
                    {evaluation.costComment && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 whitespace-pre-wrap">
                        {evaluation.costComment}
                      </p>
                    )}
                  </div>

                  {/* Delivery */}
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h5 className="font-medium text-slate-700 dark:text-slate-300 mb-3">Thời gian giao hàng / 納期(D)</h5>
                    <div className="mb-3">
                      {renderStars(evaluation.deliveryRating)}
                    </div>
                    {evaluation.deliveryComment && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 whitespace-pre-wrap">
                        {evaluation.deliveryComment}
                      </p>
                    )}
                  </div>
                </div>

                {/* General Comment */}
                {evaluation.generalComment && (
                  <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <h5 className="font-medium text-slate-700 dark:text-slate-300 mb-2">Nhận xét chung</h5>
                    <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                      {evaluation.generalComment}
                    </p>
                  </div>
                )}
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Image Section */}
                <div className="lg:col-span-1">
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Hình ảnh / 画像
                  </h3>
                  {images.length > 0 ? (
                    <div className="space-y-3">
                      {images.map((image) => (
                        <img
                          key={image.id}
                          src={image.imageUrl}
                          alt={image.description || image.fileName || "Project image"}
                          className="w-full h-48 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center">
                      <div className="text-center">
                        <ImageIcon className="w-12 h-12 mx-auto text-slate-400 mb-2" />
                        <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có hình ảnh</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Advantages Section */}
                <div className="lg:col-span-2">
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Ưu điểm và lợi ích
                  </h3>
                  <ul className="space-y-2 mb-6">
                    {advantages.map((improvement) => (
                      <li key={improvement.id} className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">{improvement.content}</span>
                      </li>
                    ))}
                  </ul>

                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Ưu điểm so với trước cải tiến / 改善前と比較したメリット
                  </h3>
                  <ul className="space-y-2">
                    {advantagesBefore.map((improvement) => (
                      <li key={improvement.id} className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">{improvement.content}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Cost Reduction Table */}
              {trialEvaluations.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                    Bảng chi phí cắt giảm
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-slate-300 dark:border-slate-600">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900">
                          <th className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                            No.
                          </th>
                          <th className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                            Hạng mục cắt giảm / 項目削減
                          </th>
                          <th className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                            Công số tác (Đơn vị)
                          </th>
                          <th className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                            Trước cải tiến
                          </th>
                          <th className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                            Sau cải tiến
                          </th>
                          <th className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300 bg-red-50 dark:bg-red-900/20">
                            Chi phí nhân công/giờ / 人材費用/時
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {trialEvaluations
                          .sort((a, b) => a.orderIndex - b.orderIndex)
                          .map((trial, index) => {
                            const before = parseFloat(trial.beforeImprovement?.replace(/[^0-9.]/g, '') || '0');
                            const after = parseFloat(trial.afterImprovement?.replace(/[^0-9.]/g, '') || '0');
                            const costPerHour = before > 0 ? (before - after) : 0;
                            
                            return (
                              <tr key={trial.id} className="bg-white dark:bg-slate-800">
                                <td className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-center text-slate-900 dark:text-slate-100">
                                  {index + 1}
                                </td>
                                <td className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-slate-900 dark:text-slate-100">
                                  {trial.reductionItem || "-"}
                                </td>
                                <td className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-slate-900 dark:text-slate-100">
                                  {trial.manHours || "-"}
                                </td>
                                <td className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-slate-900 dark:text-slate-100">
                                  {trial.beforeImprovement || "-"}
                                </td>
                                <td className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-slate-900 dark:text-slate-100">
                                  {trial.afterImprovement || "-"}
                                </td>
                                <td className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-slate-900 dark:text-slate-100 bg-red-50 dark:bg-red-900/20">
                                  {costPerHour > 0 ? (costPerHour % 1 === 0 ? costPerHour.toString() : costPerHour.toFixed(2)) : "-"}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Summary Boxes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                  <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                    HIỆU QUẢ ƯỚC TÍNH
                  </h4>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                    ${summary.estimatedEfficiency.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                  <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                    HẠNG MỤC GIẢM
                  </h4>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {summary.reductionItems}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                  <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                    THỜI GIAN TRIỂN KHAI
                  </h4>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {summary.deploymentTime} tháng
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
