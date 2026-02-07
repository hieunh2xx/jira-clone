import { useState } from "react";
import { X, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { POWER_BI_API, PowerBIExportFilter } from "../service/powerBI";

interface PowerBIExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: number;
  exportType: "tasks" | "projects" | "user-performance" | "time-tracking";
}

export default function PowerBIExportDialog({
  isOpen,
  onClose,
  projectId,
  exportType,
}: PowerBIExportDialogProps) {
  const [loading, setLoading] = useState(false);
  // Mặc định xuất TẤT CẢ status - không filter status và includeCompleted = true
  const [filters, setFilters] = useState<PowerBIExportFilter>({
    projectId,
    includeCompleted: true, // Mặc định bao gồm tất cả (completed và chưa completed)
    // Không set statuses để xuất tất cả status
  });

  if (!isOpen) return null;

  const handleDownload = async () => {
    setLoading(true);
    try {
      // Tạo filter để xuất TẤT CẢ status - không filter statuses
      const exportFilters: PowerBIExportFilter = {
        ...filters,
        // Không set statuses để xuất tất cả status
        statuses: undefined,
        includeCompleted: true, // Luôn bao gồm tất cả
      };

      let response;
      switch (exportType) {
        case "tasks":
          response = await POWER_BI_API.downloadTasksCsv(exportFilters);
          break;
        case "projects":
          response = await POWER_BI_API.downloadProjectsCsv(exportFilters);
          break;
        case "user-performance":
          response = await POWER_BI_API.downloadUserPerformanceCsv(exportFilters);
          break;
        case "time-tracking":
          response = await POWER_BI_API.downloadTimeTrackingCsv(exportFilters);
          break;
      }

      // Create blob and download
      const blob = new Blob([response], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const dateStr = new Date().toISOString().split("T")[0];
      link.download = `${exportType}_export_${dateStr}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Đã tải xuống file CSV thành công! File chứa tất cả status.");
    } catch (error: any) {
      const errorMessage = error?.message || error?.response?.data?.message || "Có lỗi xảy ra khi export";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getExportTypeLabel = () => {
    switch (exportType) {
      case "tasks":
        return "Tasks";
      case "projects":
        return "Projects";
      case "user-performance":
        return "User Performance";
      case "time-tracking":
        return "Time Tracking";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Export {getExportTypeLabel()} cho Power BI
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Info */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Lưu ý:</strong> File CSV sẽ chứa <strong>TẤT CẢ</strong> các status (todo, in_progress, done, v.v.) và bao gồm cả các task đã hoàn thành.
            </p>
          </div>

          {/* Filters - Tùy chọn */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-white">Bộ lọc (Tùy chọn)</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {exportType === "tasks" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Từ ngày
                    </label>
                    <input
                      type="date"
                      value={filters.startDate || ""}
                      onChange={(e) =>
                        setFilters({ ...filters, startDate: e.target.value || undefined })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Đến ngày
                    </label>
                    <input
                      type="date"
                      value={filters.endDate || ""}
                      onChange={(e) =>
                        setFilters({ ...filters, endDate: e.target.value || undefined })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Đang tải...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Tải xuống CSV</span>
                </>
              )}
            </button>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>
              <strong>Hướng dẫn:</strong> File CSV có thể được import trực tiếp vào Power BI Desktop. Sau khi tải về, mở Power BI Desktop và chọn "Get Data" → "Text/CSV" để import file.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
