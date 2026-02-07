import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, Save } from "lucide-react";
import { ProjectEvaluationService } from "../../service/projectEvaluation";
import { toast } from "sonner";
import type { ProjectTrialEvaluationDto, ProjectTrialEvaluationItemDto } from "../../service/projectEvaluation";

interface ProjectTrialEvaluationTabProps {
  projectId: number;
  readonly?: boolean;
}

export default function ProjectTrialEvaluationTab({ projectId, readonly = false }: ProjectTrialEvaluationTabProps) {
  const [items, setItems] = useState<ProjectTrialEvaluationItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTrialEvaluations();
  }, [projectId]);

  const loadTrialEvaluations = async () => {
    try {
      setLoading(true);
      // Load current user's trial evaluations only
      const { getUserId } = await import("../../helper/auth");
      const userId = getUserId();
      const evaluations = await ProjectEvaluationService.getTrialEvaluations(projectId, userId ?? undefined);
      const evaluationsList = Array.isArray(evaluations) ? evaluations : [];
      if (evaluationsList.length === 0) {
        setItems([{ orderIndex: 1, reductionItem: "", manHours: "", beforeImprovement: "", afterImprovement: "", estimatedEfficiency: "" }]);
      } else {
        setItems(evaluationsList.map(e => ({
          orderIndex: e.orderIndex,
          reductionItem: e.reductionItem || "",
          manHours: e.manHours || "",
          beforeImprovement: e.beforeImprovement || "",
          afterImprovement: e.afterImprovement || "",
          estimatedEfficiency: e.estimatedEfficiency || "",
        })));
      }
    } catch (error: any) {
      console.error("Error loading trial evaluations:", error);
      toast.error("Không thể tải dữ liệu");
      // Set default empty item on error
      setItems([{ orderIndex: 1, reductionItem: "", manHours: "", beforeImprovement: "", afterImprovement: "", estimatedEfficiency: "" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRow = () => {
    setItems([...items, {
      orderIndex: items.length + 1,
      reductionItem: "",
      manHours: "",
      beforeImprovement: "",
      afterImprovement: "",
      estimatedEfficiency: "",
    }]);
  };

  const handleDeleteRow = (index: number) => {
    if (items.length === 1) {
      toast.error("Phải có ít nhất một hàng");
      return;
    }
    const newItems = items.filter((_, i) => i !== index).map((item, i) => ({
      ...item,
      orderIndex: i + 1,
    }));
    setItems(newItems);
  };

  const handleChange = (index: number, field: keyof ProjectTrialEvaluationItemDto, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await ProjectEvaluationService.createOrUpdateTrialEvaluations({
        projectId,
        items: items.map((item, index) => ({
          ...item,
          orderIndex: index + 1,
        })),
      });
      toast.success("Lưu dữ liệu thử nghiệm thành công");
      await loadTrialEvaluations();
    } catch (error: any) {
      console.error("Error saving trial evaluations:", error);
      toast.error("Không thể lưu dữ liệu");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
        Đánh giá thử nghiệm / 試験評価
      </h2>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        Tạo bảng đánh giá thử nghiệm với các cột: STT, Hạng mục cắt giảm, Trước/Sau cải tiến, Hiệu quả dự tính
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        <strong>Ghi chú:</strong> Chi phí nhân công được tính theo giờ
      </p>

      <div className="overflow-x-auto mb-6">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900">
              <th className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                No. / STT
              </th>
              <th className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                Hạng mục cắt giảm / 削減項目
              </th>
              <th className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                Công số tác (Đơn vị) / 工数(単位)
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
              <th className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300 w-20">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="bg-white dark:bg-slate-800">
                <td className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-center text-slate-900 dark:text-slate-100">
                  {index + 1}
                </td>
                <td className="border border-slate-300 dark:border-slate-600 px-4 py-3">
                  <input
                    type="text"
                    value={item.reductionItem}
                    onChange={(e) => handleChange(index, "reductionItem", e.target.value)}
                    placeholder="Nhập hạng mục cắt giảm"
                    className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={readonly}
                    readOnly={readonly}
                  />
                </td>
                <td className="border border-slate-300 dark:border-slate-600 px-4 py-3">
                  <input
                    type="text"
                    value={item.manHours}
                    onChange={(e) => handleChange(index, "manHours", e.target.value)}
                    placeholder="VD: h/năm, USD/năm, lần, lần/năm, lần/tháng"
                    className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={readonly}
                    readOnly={readonly}
                  />
                </td>
                <td className="border border-slate-300 dark:border-slate-600 px-4 py-3">
                  <input
                    type="text"
                    value={item.beforeImprovement}
                    onChange={(e) => handleChange(index, "beforeImprovement", e.target.value)}
                    placeholder="Nhập trước cải tiến"
                    className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={readonly}
                    readOnly={readonly}
                  />
                </td>
                <td className="border border-slate-300 dark:border-slate-600 px-4 py-3">
                  <input
                    type="text"
                    value={item.afterImprovement}
                    onChange={(e) => handleChange(index, "afterImprovement", e.target.value)}
                    placeholder="Nhập sau cải tiến"
                    className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={readonly}
                    readOnly={readonly}
                  />
                </td>
                <td className="border border-slate-300 dark:border-slate-600 px-4 py-3">
                  <input
                    type="text"
                    value={item.estimatedEfficiency}
                    onChange={(e) => handleChange(index, "estimatedEfficiency", e.target.value)}
                    placeholder="Nhập hiệu quả dự tính"
                    className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={readonly}
                    readOnly={readonly}
                  />
                </td>
                <td className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-center">
                  {!readonly && (
                    <button
                      onClick={() => handleDeleteRow(index)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">Hướng dẫn điền dữ liệu:</h3>
        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
          <li><strong>Hạng mục cắt giảm:</strong> Tên loại cải tiến hoặc nội dung cắt giảm</li>
          <li><strong>Công số tác (Đơn vị):</strong> Đơn vị tính (VD: h/năm, USD/năm, lần, lần/năm, lần/tháng, lần/dự án, v.v.)</li>
          <li><strong>Trước cải tiến:</strong> Giá trị/chi phí trước cải tiến (theo đơn vị đã chọn)</li>
          <li><strong>Sau cải tiến:</strong> Giá trị/chi phí sau cải tiến (theo đơn vị đã chọn)</li>
          <li><strong>Hiệu quả dự tính:</strong> Kết quả, lợi ích hoặc tiết kiệm dự kiến từ cải tiến</li>
        </ul>
      </div>

      {!readonly && (
        <div className="flex justify-between">
          <button
            onClick={handleAddRow}
            className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Thêm hàng
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Lưu dữ liệu thử nghiệm
            </>
          )}
        </button>
        </div>
      )}
    </div>
  );
}
