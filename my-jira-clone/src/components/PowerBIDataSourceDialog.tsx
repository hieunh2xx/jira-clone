import { useState, useEffect } from "react";
import { X, Download, Link2, Copy, Check, Loader2, FileSpreadsheet, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { POWER_BI_API, PowerBIExportFilter } from "../service/powerBI";

interface PowerBIDataSourceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: number;
}

interface DataSource {
  id: string;
  name: string;
  description: string;
  category: string;
  purpose: string;
  recommendedCharts: string[];
}

interface DataSourceDetail {
  id: string;
  name: string;
  description: string;
  purpose: string;
  links: {
    jsonApiUrl: string;
    excelDownloadUrl: string;
    csvDownloadUrl: string;
    usageInstructions: string;
  };
  recommendedCharts: string[];
  supportedFilters: string[];
}

export default function PowerBIDataSourceDialog({
  isOpen,
  onClose,
  projectId,
}: PowerBIDataSourceDialogProps) {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [selectedDataSource, setSelectedDataSource] = useState<DataSourceDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [filters, setFilters] = useState<PowerBIExportFilter & { periodType?: 'day' | 'week' | 'month' }>({
    projectId,
    includeCompleted: true,
  });

  useEffect(() => {
    if (isOpen) {
      loadDataSources();
    }
  }, [isOpen]);

  const loadDataSources = async () => {
    setLoading(true);
    try {
      const response = await POWER_BI_API.getAllDataSources();
      // apiClient.get tự động extract data từ response { code, message, data }
      // Nên response ở đây đã là array dataSources rồi
      if (Array.isArray(response)) {
        setDataSources(response);
      } else if (response && Array.isArray(response.data)) {
        // Fallback: nếu response vẫn có structure { data: [...] }
        setDataSources(response.data);
      } else {
        console.error("Unexpected response format:", response);
        toast.error("Định dạng dữ liệu không đúng");
      }
    } catch (error: any) {
      console.error("Error loading data sources:", error);
      const errorMessage = error?.message || "Không thể tải danh sách báo cáo";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDataSource = async (id: string) => {
    setLoadingDetail(true);
    try {
      const response = await POWER_BI_API.getDataSource(id, filters);
      // apiClient.get tự động extract data từ response
      if (response) {
        setSelectedDataSource(response);
      } else {
        toast.error("Không tìm thấy thông tin báo cáo");
      }
    } catch (error: any) {
      console.error("Error loading data source detail:", error);
      const errorMessage = error?.message || "Không thể tải thông tin báo cáo";
      toast.error(errorMessage);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!selectedDataSource) return;

    setDownloading(true);
    try {
      let response: Blob;
      const exportFilters: PowerBIExportFilter & { periodType?: 'day' | 'week' | 'month' } = {
        ...filters,
        statuses: undefined,
        includeCompleted: true,
      };

      switch (selectedDataSource.id) {
        case "overview":
          response = await POWER_BI_API.downloadOverviewExcel(exportFilters);
          break;
        case "task-progress":
          response = await POWER_BI_API.downloadTaskProgressExcel(exportFilters);
          break;
        case "overdue-risks":
          response = await POWER_BI_API.downloadOverdueRisksExcel(exportFilters);
          break;
        case "workload":
          response = await POWER_BI_API.downloadWorkloadExcel(exportFilters);
          break;
        case "bottlenecks":
          response = await POWER_BI_API.downloadBottlenecksExcel(exportFilters);
          break;
        case "sla-compliance":
          response = await POWER_BI_API.downloadSLAComplianceExcel(exportFilters);
          break;
        case "project-comparison":
          response = await POWER_BI_API.downloadProjectComparisonExcel(exportFilters);
          break;
        case "tasks":
          response = await POWER_BI_API.downloadTasksExcel(exportFilters);
          break;
        case "projects":
          response = await POWER_BI_API.downloadProjectsExcel(exportFilters);
          break;
        case "user-performance":
          response = await POWER_BI_API.downloadUserPerformanceExcel(exportFilters);
          break;
        case "time-tracking":
          response = await POWER_BI_API.downloadTimeTrackingExcel(exportFilters);
          break;
        default:
          throw new Error("Loại báo cáo không được hỗ trợ");
      }

      const blob = new Blob([response], { 
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const dateStr = new Date().toISOString().split("T")[0];
      link.download = `${selectedDataSource.id}_export_${dateStr}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Đã tải xuống file Excel thành công!");
    } catch (error: any) {
      const errorMessage = error?.message || error?.response?.data?.message || "Có lỗi xảy ra khi tải file";
      toast.error(errorMessage);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLink = () => {
    if (!selectedDataSource?.links.jsonApiUrl) return;
    
    navigator.clipboard.writeText(selectedDataSource.links.jsonApiUrl);
    setCopied(true);
    toast.success("Đã sao chép link!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Xuất Dữ Liệu Power BI
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Chọn loại báo cáo để tải Excel hoặc lấy link import vào Power BI
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel - Data Sources List */}
          <div className="w-1/3 border-r border-gray-200 dark:border-slate-700 overflow-y-auto bg-gray-50 dark:bg-slate-900">
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Danh Sách Báo Cáo</h3>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : (
                <div className="space-y-2">
                  {dataSources.map((source) => (
                    <button
                      key={source.id}
                      onClick={() => handleSelectDataSource(source.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedDataSource?.id === source.id
                          ? "bg-blue-600 text-white"
                          : "bg-white dark:bg-slate-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700"
                      }`}
                    >
                      <div className="font-medium">{source.name}</div>
                      <div className={`text-xs mt-1 ${
                        selectedDataSource?.id === source.id
                          ? "text-blue-100"
                          : "text-gray-500 dark:text-gray-400"
                      }`}>
                        {source.category}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Selected Data Source Details */}
          <div className="flex-1 overflow-y-auto p-6">
            {loadingDetail ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : selectedDataSource ? (
              <div className="space-y-6">
                {/* Info */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {selectedDataSource.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    {selectedDataSource.description}
                  </p>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      <strong>Mục đích:</strong> {selectedDataSource.purpose}
                    </p>
                  </div>
                </div>

                {/* Filters */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Bộ Lọc (Tùy chọn)</h4>
                  <div className="grid grid-cols-2 gap-4">
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
                    {selectedDataSource.id === "task-progress" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Loại thời gian
                        </label>
                        <select
                          value={filters.periodType || "day"}
                          onChange={(e) =>
                            setFilters({ ...filters, periodType: e.target.value as 'day' | 'week' | 'month' })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                        >
                          <option value="day">Theo ngày</option>
                          <option value="week">Theo tuần</option>
                          <option value="month">Theo tháng</option>
                        </select>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleSelectDataSource(selectedDataSource.id)}
                    className="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 text-sm"
                  >
                    Áp dụng bộ lọc
                  </button>
                </div>

                {/* Links */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Link Import Power BI</h4>
                  <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Link2 className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        JSON API URL
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={selectedDataSource.links.jsonApiUrl}
                        readOnly
                        className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        title="Sao chép link"
                      >
                        {copied ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Copy link này và paste vào Power BI Desktop: Get Data → Web
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleDownloadExcel}
                    disabled={downloading}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {downloading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Đang tải...</span>
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="w-5 h-5" />
                        <span>Tải File Excel</span>
                      </>
                    )}
                  </button>
                  <a
                    href={selectedDataSource.links.excelDownloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                  >
                    <ExternalLink className="w-5 h-5" />
                    <span>Mở Link</span>
                  </a>
                </div>

                {/* Recommended Charts */}
                {selectedDataSource.recommendedCharts.length > 0 && (
                  <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Biểu đồ được khuyến nghị:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedDataSource.recommendedCharts.map((chart, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm"
                        >
                          {chart}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Usage Instructions */}
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-300 mb-2">
                    Hướng dẫn sử dụng:
                  </h4>
                  <p className="text-sm text-yellow-800 dark:text-yellow-400 whitespace-pre-line">
                    {selectedDataSource.links.usageInstructions}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Chọn một loại báo cáo từ danh sách bên trái</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
