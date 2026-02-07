import { useState, useEffect } from "react"
import { ProjectEvaluationService, type ProjectEvaluationDto, type ProjectTrialEvaluationDto } from "../../service/projectEvaluation"
import { Loader2, Star, User } from "lucide-react"
import { toast } from "sonner"
import ProjectEvaluationDetailModal from "./ProjectEvaluationDetailModal"

interface ProjectEvaluationsViewTabProps {
  projectId: number
}

export default function ProjectEvaluationsViewTab({ projectId }: ProjectEvaluationsViewTabProps) {
  const [evaluations, setEvaluations] = useState<ProjectEvaluationDto[]>([])
  const [trialEvaluations, setTrialEvaluations] = useState<Record<number, ProjectTrialEvaluationDto[]>>({})
  const [loading, setLoading] = useState(true)
  const [selectedEvaluation, setSelectedEvaluation] = useState<ProjectEvaluationDto | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  useEffect(() => {
    loadEvaluations()
  }, [projectId])

  const loadEvaluations = async () => {
    try {
      setLoading(true)
      const [evaluationsData, allTrialEvaluations] = await Promise.all([
        ProjectEvaluationService.getEvaluationsByProject(projectId),
        ProjectEvaluationService.getTrialEvaluations(projectId) // Get all users' trial evaluations
      ])
      
      setEvaluations(Array.isArray(evaluationsData) ? evaluationsData : [])
      
      // Group trial evaluations by userId
      const trialMap: Record<number, ProjectTrialEvaluationDto[]> = {}
      if (Array.isArray(allTrialEvaluations)) {
        allTrialEvaluations.forEach(trial => {
          if (trial.userId) {
            if (!trialMap[trial.userId]) {
              trialMap[trial.userId] = []
            }
            trialMap[trial.userId].push(trial)
          }
        })
      }
      setTrialEvaluations(trialMap)
    } catch (error: any) {
      console.error("Error loading evaluations:", error)
      toast.error("Không thể tải danh sách đánh giá")
      setEvaluations([])
      setTrialEvaluations({})
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating?: number) => {
    if (!rating) return <span className="text-slate-400 dark:text-slate-500 text-sm">Chưa đánh giá</span>
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 dark:fill-slate-700 text-gray-200 dark:text-slate-700"
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">({rating}/5)</span>
      </div>
    )
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "Chưa có thời gian"
    const date = new Date(dateString)
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1)
    const year = date.getFullYear()
    return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (evaluations.length === 0) {
    return (
      <div className="text-center py-20">
        <User className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500 text-lg">Chưa có đánh giá nào</p>
        <p className="text-gray-400 text-sm mt-2">Các thành viên sẽ hiển thị đánh giá ở đây sau khi hoàn thành</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Summary Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
          Tổng số đánh giá: {evaluations.length}
        </h3>
        <p className="text-xs text-blue-700 dark:text-blue-300">
          Dưới đây là tất cả các đánh giá từ thành viên dự án
        </p>
      </div>

      {/* Evaluations List */}
      <div className="space-y-4">
        {evaluations.map((evaluation) => (
          <div
            key={evaluation.id}
            onClick={() => {
              setSelectedEvaluation(evaluation);
              setIsDetailModalOpen(true);
            }}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          >
            {/* User Info Section */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white text-base">
                    {evaluation.userFullName || evaluation.userName || "Người dùng"}
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {formatDateTime(evaluation.evaluatedAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Q-C-D Evaluation Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Quality */}
              <div className="border-l-4 border-blue-500 pl-4">
                <h5 className="font-medium text-slate-700 dark:text-slate-300 mb-3 text-sm">Chất lượng</h5>
                <div className="mb-2">
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
                <h5 className="font-medium text-slate-700 dark:text-slate-300 mb-3 text-sm">Chi phí</h5>
                <div className="mb-2">
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
                <h5 className="font-medium text-slate-700 dark:text-slate-300 mb-3 text-sm">Giao hàng</h5>
                <div className="mb-2">
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
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
                <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Nhận xét chung</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {evaluation.generalComment}
                </p>
              </div>
            )}

            {/* Trial Evaluations Table */}
            {evaluation.userId && trialEvaluations[evaluation.userId] && trialEvaluations[evaluation.userId].length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
                <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-4">Đánh giá thử nghiệm / 試験評価</h5>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-300 dark:border-slate-600">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900">
                        <th className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                          No. / STT
                        </th>
                        <th className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                          Hạng mục cắt giảm / 削減項目
                        </th>
                        <th className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                          Trước cải tiến / 改善前
                        </th>
                        <th className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                          Sau cải tiến / 改善後
                        </th>
                        <th className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                          Hiệu quả dự tính / 効果予定
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {trialEvaluations[evaluation.userId]
                        .sort((a, b) => a.orderIndex - b.orderIndex)
                        .map((trial, index) => (
                          <tr key={trial.id} className="bg-white dark:bg-slate-800">
                            <td className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-center text-slate-900 dark:text-slate-100">
                              {index + 1}
                            </td>
                            <td className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-slate-900 dark:text-slate-100">
                              {trial.reductionItem || "-"}
                            </td>
                            <td className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-slate-900 dark:text-slate-100">
                              {trial.beforeImprovement || "-"}
                            </td>
                            <td className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-slate-900 dark:text-slate-100">
                              {trial.afterImprovement || "-"}
                            </td>
                            <td className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-slate-900 dark:text-slate-100">
                              {trial.estimatedEfficiency || "-"}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedEvaluation && (
        <ProjectEvaluationDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedEvaluation(null);
          }}
          projectId={projectId}
          evaluation={selectedEvaluation}
        />
      )}
    </div>
  )
}
