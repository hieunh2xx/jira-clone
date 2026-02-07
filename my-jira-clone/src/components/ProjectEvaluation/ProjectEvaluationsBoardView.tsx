import { useState, useEffect } from "react"
import { ProjectEvaluationService, type ProjectEvaluationDto } from "../../service/projectEvaluation"
import { Loader2, Star, User, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"

interface ProjectEvaluationsBoardViewProps {
  projectId: number
  isLeader: boolean
}

export default function ProjectEvaluationsBoardView({ projectId, isLeader }: ProjectEvaluationsBoardViewProps) {
  const [evaluations, setEvaluations] = useState<ProjectEvaluationDto[]>([])
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    loadEvaluations()
  }, [projectId])

  const loadEvaluations = async () => {
    try {
      setLoading(true)
      const data = await ProjectEvaluationService.getEvaluationsByProject(projectId)
      setEvaluations(Array.isArray(data) ? data : [])
    } catch (error: any) {
      console.error("Error loading evaluations:", error)
      toast.error("Không thể tải danh sách đánh giá")
      setEvaluations([])
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating?: number) => {
    if (!rating) return <span className="text-gray-400 text-xs">Chưa đánh giá</span>
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 text-gray-200"
            }`}
          />
        ))}
        <span className="ml-1 text-xs text-gray-600 dark:text-gray-400">({rating}/5)</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-sm text-gray-600">Đang tải đánh giá...</span>
      </div>
    )
  }

  if (evaluations.length === 0) {
    return (
      <div className="text-center py-8 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <User className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500 text-sm">Chưa có đánh giá nào</p>
        <p className="text-gray-400 text-xs mt-1">Các thành viên sẽ hiển thị đánh giá ở đây</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Đánh giá dự án
          </h3>
          <span className="text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
            {evaluations.length} đánh giá
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-500" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
          {evaluations.map((evaluation) => (
            <div
              key={evaluation.id}
              className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-slate-900 dark:text-white">
                      {evaluation.userFullName || evaluation.userName || "Người dùng"}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {evaluation.evaluatedAt
                        ? new Date(evaluation.evaluatedAt).toLocaleString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })
                        : "Chưa có thời gian"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border-l-2 border-blue-500 pl-3">
                  <h5 className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Chất lượng
                  </h5>
                  {renderStars(evaluation.qualityRating)}
                  {evaluation.qualityComment && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                      {evaluation.qualityComment}
                    </p>
                  )}
                </div>

                <div className="border-l-2 border-green-500 pl-3">
                  <h5 className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Chi phí
                  </h5>
                  {renderStars(evaluation.costRating)}
                  {evaluation.costComment && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                      {evaluation.costComment}
                    </p>
                  )}
                </div>

                <div className="border-l-2 border-purple-500 pl-3">
                  <h5 className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Giao hàng
                  </h5>
                  {renderStars(evaluation.deliveryRating)}
                  {evaluation.deliveryComment && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                      {evaluation.deliveryComment}
                    </p>
                  )}
                </div>
              </div>

              {evaluation.generalComment && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <h5 className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nhận xét chung
                  </h5>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3">
                    {evaluation.generalComment}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
