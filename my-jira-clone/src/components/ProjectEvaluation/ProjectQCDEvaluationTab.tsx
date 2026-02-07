import { useState, useEffect } from "react";
import { Star, Loader2 } from "lucide-react";
import { ProjectEvaluationService } from "../../service/projectEvaluation";
import { toast } from "sonner";
import type { ProjectEvaluationDto, ProjectEvaluationStatusDto } from "../../service/projectEvaluation";

interface ProjectQCDEvaluationTabProps {
  projectId: number;
  evaluationStatus: ProjectEvaluationStatusDto | null;
  onEvaluationSubmit: () => void;
  readonly?: boolean;
}

export default function ProjectQCDEvaluationTab({ 
  projectId, 
  evaluationStatus,
  onEvaluationSubmit,
  readonly = false
}: ProjectQCDEvaluationTabProps) {
  const [evaluation, setEvaluation] = useState<ProjectEvaluationDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [qualityRating, setQualityRating] = useState<number | null>(null);
  const [qualityComment, setQualityComment] = useState("");
  const [qualitySkipped, setQualitySkipped] = useState(false);
  
  const [costRating, setCostRating] = useState<number | null>(null);
  const [costComment, setCostComment] = useState("");
  const [costSkipped, setCostSkipped] = useState(false);
  
  const [deliveryRating, setDeliveryRating] = useState<number | null>(null);
  const [deliveryComment, setDeliveryComment] = useState("");
  const [deliverySkipped, setDeliverySkipped] = useState(false);
  
  const [generalComment, setGeneralComment] = useState("");
  const [deploymentTime, setDeploymentTime] = useState<number | null>(null);

  useEffect(() => {
    loadEvaluation();
  }, [projectId]);

  const loadEvaluation = async () => {
    try {
      setLoading(true);
      const data = await ProjectEvaluationService.getEvaluation(projectId);
      if (data) {
        setEvaluation(data);
        setQualityRating(data.qualityRating || null);
        setQualityComment(data.qualityComment || "");
        setQualitySkipped(data.qualityRating === null);
        setCostRating(data.costRating || null);
        setCostComment(data.costComment || "");
        setCostSkipped(data.costRating === null);
        setDeliveryRating(data.deliveryRating || null);
        setDeliveryComment(data.deliveryComment || "");
        setDeliverySkipped(data.deliveryRating === null);
        setGeneralComment(data.generalComment || "");
        setDeploymentTime(data.deploymentTime || null);
      }
    } catch (error: any) {
      console.error("Error loading evaluation:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await ProjectEvaluationService.createOrUpdateEvaluation({
        projectId,
        qualityRating: qualitySkipped || qualityRating === null ? null : qualityRating,
        qualityComment: qualitySkipped || qualityRating === null ? undefined : (qualityComment || undefined),
        costRating: costSkipped || costRating === null ? null : costRating,
        costComment: costSkipped || costRating === null ? undefined : (costComment || undefined),
        deliveryRating: deliverySkipped || deliveryRating === null ? null : deliveryRating,
        deliveryComment: deliverySkipped || deliveryRating === null ? undefined : (deliveryComment || undefined),
        generalComment: generalComment || undefined,
        deploymentTime: deploymentTime || undefined,
      });
      toast.success("Gửi đánh giá thành công");
      await loadEvaluation();
      onEvaluationSubmit();
    } catch (error: any) {
      console.error("Error saving evaluation:", error);
      toast.error("Không thể gửi đánh giá");
    } finally {
      setSaving(false);
    }
  };

  const StarRating = ({ 
    rating, 
    onRatingChange, 
    skipped, 
    onSkipToggle,
    disabled = false
  }: { 
    rating: number | null;
    onRatingChange: (rating: number | null) => void;
    skipped: boolean;
    onSkipToggle: () => void;
    disabled?: boolean;
  }) => (
    <div className="flex items-center gap-4">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => {
              if (!disabled) {
                onRatingChange(star);
                if (skipped) {
                  onSkipToggle();
                }
              }
            }}
            className="focus:outline-none"
            disabled={disabled}
          >
            <Star
              className={`h-6 w-6 ${
                rating !== null && star <= rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-slate-300 dark:text-slate-600"
              } hover:text-yellow-400 transition-colors`}
            />
          </button>
        ))}
      </div>
      {!disabled && (
        <button
          type="button"
          onClick={() => {
            onRatingChange(null);
            if (!skipped) {
              onSkipToggle();
            }
          }}
          className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
        >
          Bỏ
        </button>
      )}
      {skipped && rating === null && (
        <span className="text-sm text-slate-500 dark:text-slate-400">Chưa đánh giá</span>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // If readonly and has evaluation, show in view mode
  if (readonly && evaluation) {
    const renderStars = (rating?: number | null) => {
      if (!rating) return <span className="text-slate-400 dark:text-slate-500">Chưa đánh giá</span>
      return (
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-5 h-5 ${
                star <= rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-slate-200 dark:fill-slate-700 text-slate-200 dark:text-slate-700"
              }`}
            />
          ))}
          <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">({rating}/5)</span>
        </div>
      )
    }

    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 max-w-4xl mx-auto">
        <div className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Đánh giá Q-C-D của bạn / あなたのQ-C-D評価
          </h2>
          {evaluation.evaluatedAt && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Đánh giá lúc: {new Date(evaluation.evaluatedAt).toLocaleString("vi-VN")}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Quality */}
          <div className="border-l-4 border-blue-500 pl-4">
            <h5 className="font-medium text-slate-700 dark:text-slate-300 mb-2">Chất lượng</h5>
            {renderStars(evaluation.qualityRating)}
            {evaluation.qualityComment && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 whitespace-pre-wrap">
                {evaluation.qualityComment}
              </p>
            )}
            {!evaluation.qualityComment && evaluation.qualityRating && (
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-2 italic">Không có nhận xét</p>
            )}
          </div>

          {/* Cost */}
          <div className="border-l-4 border-green-500 pl-4">
            <h5 className="font-medium text-slate-700 dark:text-slate-300 mb-2">Chi phí</h5>
            {renderStars(evaluation.costRating)}
            {evaluation.costComment && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 whitespace-pre-wrap">
                {evaluation.costComment}
              </p>
            )}
            {!evaluation.costComment && evaluation.costRating && (
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-2 italic">Không có nhận xét</p>
            )}
          </div>

          {/* Delivery */}
          <div className="border-l-4 border-purple-500 pl-4">
            <h5 className="font-medium text-slate-700 dark:text-slate-300 mb-2">Giao hàng</h5>
            {renderStars(evaluation.deliveryRating)}
            {evaluation.deliveryComment && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 whitespace-pre-wrap">
                {evaluation.deliveryComment}
              </p>
            )}
            {!evaluation.deliveryComment && evaluation.deliveryRating && (
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-2 italic">Không có nhận xét</p>
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
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
        Biểu mẫu đánh giá Q-C-D / Q-C-D評価フォーム
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-2">
        Đánh giá dự án theo Chất lượng (Q), Chi phí (C) và Thời gian giao hàng (D)
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        品質(Q)、コスト(C)、納期 (D)に基づいてプロジェクトを評価
      </p>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-8">
        Chọn các tiêu chí muốn đánh giá và nhập nhận xét cho từng tiêu chí:
      </p>

      {/* Quality Section */}
      <div className="mb-8 p-6 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Chất lượng / 品質(Q)
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">品質/品質指標</p>
        <div className="mb-4">
          <StarRating
            rating={qualityRating}
            onRatingChange={setQualityRating}
            skipped={qualitySkipped}
            onSkipToggle={() => setQualitySkipped(!qualitySkipped)}
            disabled={readonly}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Nhận xét chi tiết / 詳細なコメント
          </label>
          <textarea
            value={qualityComment}
            onChange={(e) => setQualityComment(e.target.value)}
            placeholder="Nhập nhận xét, lý do, hoặc ghi chú chi tiết về tiêu chí này..."
            className="w-full h-32 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            disabled={qualitySkipped || readonly}
            readOnly={readonly}
          />
        </div>
      </div>

      {/* Cost Section */}
      <div className="mb-8 p-6 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Chi phí / コスト (C)
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">コスト/コスト効率</p>
        <div className="mb-4">
          <StarRating
            rating={costRating}
            onRatingChange={setCostRating}
            skipped={costSkipped}
            onSkipToggle={() => setCostSkipped(!costSkipped)}
            disabled={readonly}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Nhận xét chi tiết / 詳細なコメント
          </label>
          <textarea
            value={costComment}
            onChange={(e) => setCostComment(e.target.value)}
            placeholder="Nhập nhận xét, lý do, hoặc ghi chú chi tiết về tiêu chí này..."
            className="w-full h-32 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            disabled={costSkipped || readonly}
            readOnly={readonly}
          />
        </div>
      </div>

      {/* Delivery Section */}
      <div className="mb-8 p-6 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Thời gian giao hàng / 納期(D)
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">納期/納期管理</p>
        <div className="mb-4">
          <StarRating
            rating={deliveryRating}
            onRatingChange={setDeliveryRating}
            skipped={deliverySkipped}
            onSkipToggle={() => setDeliverySkipped(!deliverySkipped)}
            disabled={readonly}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Nhận xét chi tiết / 詳細なコメント
          </label>
          <textarea
            value={deliveryComment}
            onChange={(e) => setDeliveryComment(e.target.value)}
            placeholder="Nhập nhận xét, lý do, hoặc ghi chú chi tiết về tiêu chí này..."
            className="w-full h-32 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            disabled={deliverySkipped || readonly}
            readOnly={readonly}
          />
        </div>
      </div>

      {/* Deployment Time */}
      <div className="mb-8 p-6 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Thời gian triển khai (Tháng) / 展開時間(月)
        </h3>
        <input
          type="number"
          value={deploymentTime || ""}
          onChange={(e) => setDeploymentTime(e.target.value ? parseInt(e.target.value) : null)}
          placeholder="Nhập số tháng triển khai"
          min="0"
          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={readonly}
          readOnly={readonly}
        />
      </div>

      {/* General Comments */}
      <div className="mb-8 p-6 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Nhận xét bổ sung chung (Tùy chọn) / 全体的なコメント(オプション)
        </h3>
        <textarea
          value={generalComment}
          onChange={(e) => setGeneralComment(e.target.value)}
          placeholder="Thêm bất kỳ phản hồi hoặc nhận xét chung về dự án toàn bộ..."
          className="w-full h-40 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
          disabled={readonly}
          readOnly={readonly}
        />
      </div>

      {/* Evaluation Status */}
      {evaluationStatus && (
        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            <strong>Trạng thái đánh giá:</strong> {evaluationStatus.evaluatedMembers} / {evaluationStatus.totalMembers} thành viên đã đánh giá
          </p>
        </div>
      )}

      {/* Submit Button */}
      {!readonly && (
        <button
          onClick={handleSave}
          disabled={saving || evaluationStatus?.hasEvaluated}
          className="w-full px-6 py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <span className="flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Đang gửi...
            </span>
          ) : (
            "Gửi đánh giá"
          )}
        </button>
      )}
    </div>
  );
}
