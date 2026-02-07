
import { useState, useEffect } from "react";
import { 
  Clock, 
  Play, 
  Pause, 
  Square, 
  Timer, 
  TrendingUp,
  AlertCircle,
  Check
} from "lucide-react";
interface TimeTrackingProps {
  estimatedHours?: number;
  actualHours?: number;
  onEstimatedChange?: (hours: number) => void;
  onActualChange?: (hours: number) => void;
  onLogTime?: (hours: number, description?: string) => void;
  disabled?: boolean;
}
interface TimeLog {
  id: string;
  hours: number;
  description?: string;
  timestamp: string;
}
export default function TimeTracking({
  estimatedHours = 0,
  actualHours = 0,
  onEstimatedChange,
  onActualChange,
  onLogTime,
  disabled
}: TimeTrackingProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [trackingTime, setTrackingTime] = useState(0);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logHours, setLogHours] = useState("");
  const [logMinutes, setLogMinutes] = useState("");
  const [logDescription, setLogDescription] = useState("");
  const [editingEstimate, setEditingEstimate] = useState(false);
  const [estimateInput, setEstimateInput] = useState(estimatedHours.toString());
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking) {
      interval = setInterval(() => {
        setTrackingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking]);
  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  const formatHours = (hours: number): string => {
    if (hours === 0) return "0h";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };
  const progress = estimatedHours > 0 
    ? Math.min((actualHours / estimatedHours) * 100, 100) 
    : 0;
  const remainingHours = Math.max(estimatedHours - actualHours, 0);
  const getStatus = () => {
    if (estimatedHours === 0) return { color: "text-slate-500", label: "Chưa ước tính" };
    if (actualHours > estimatedHours) return { color: "text-red-600", label: "Vượt thời gian" };
    if (actualHours >= estimatedHours * 0.8) return { color: "text-amber-600", label: "Gần hoàn thành" };
    return { color: "text-green-600", label: "Trong tiến độ" };
  };
  const status = getStatus();
  const startTracking = () => {
    setIsTracking(true);
    setTrackingTime(0);
  };
  const pauseTracking = () => {
    setIsTracking(false);
  };
  const stopTracking = () => {
    if (trackingTime > 0) {
      const hours = trackingTime / 3600;
      onActualChange?.(actualHours + hours);
      onLogTime?.(hours, "Tracked time");
    }
    setIsTracking(false);
    setTrackingTime(0);
  };
  const handleLogTime = () => {
    const hours = parseFloat(logHours || "0");
    const minutes = parseFloat(logMinutes || "0");
    const totalHours = hours + (minutes / 60);
    if (totalHours > 0) {
      onActualChange?.(actualHours + totalHours);
      onLogTime?.(totalHours, logDescription);
      setLogHours("");
      setLogMinutes("");
      setLogDescription("");
      setShowLogModal(false);
    }
  };
  const saveEstimate = () => {
    const value = parseFloat(estimateInput);
    if (!isNaN(value) && value >= 0) {
      onEstimatedChange?.(value);
    }
    setEditingEstimate(false);
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-slate-900 dark:text-white">
            Time Tracking
          </span>
        </div>
        <span className={`text-sm font-medium ${status.color}`}>
          {status.label}
        </span>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              actualHours > estimatedHours 
                ? 'bg-gradient-to-r from-red-500 to-red-600' 
                : 'bg-gradient-to-r from-blue-500 to-green-500'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">
            Đã dùng: <span className="font-medium text-slate-900 dark:text-white">{formatHours(actualHours)}</span>
          </span>
          <span className="text-slate-600 dark:text-slate-400">
            Còn lại: <span className="font-medium text-slate-900 dark:text-white">{formatHours(remainingHours)}</span>
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-slate-500" />
          <span className="text-sm text-slate-600 dark:text-slate-400">Ước tính:</span>
        </div>
        {editingEstimate ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={estimateInput}
              onChange={(e) => setEstimateInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveEstimate()}
              className="w-20 px-2 py-1 text-sm border border-blue-500 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none"
              min="0"
              step="0.5"
              autoFocus
            />
            <span className="text-sm text-slate-500">giờ</span>
            <button
              onClick={saveEstimate}
              className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => !disabled && setEditingEstimate(true)}
            disabled={disabled}
            className={`text-sm font-medium ${
              disabled 
                ? 'text-slate-400 cursor-not-allowed' 
                : 'text-blue-600 hover:text-blue-700 cursor-pointer'
            }`}
          >
            {formatHours(estimatedHours)}
          </button>
        )}
      </div>
      {!disabled && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          {isTracking ? (
            <div className="space-y-3">
              <div className="text-center">
                <span className="text-3xl font-mono font-bold text-blue-600 dark:text-blue-400">
                  {formatTime(trackingTime)}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={pauseTracking}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                >
                  <Pause className="w-4 h-4" />
                  Tạm dừng
                </button>
                <button
                  onClick={stopTracking}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <Square className="w-4 h-4" />
                  Dừng & Lưu
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <button
                onClick={startTracking}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Play className="w-4 h-4" />
                Bắt đầu đếm giờ
              </button>
              <button
                onClick={() => setShowLogModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Clock className="w-4 h-4" />
                Ghi nhận thủ công
              </button>
            </div>
          )}
        </div>
      )}
      {actualHours > estimatedHours && estimatedHours > 0 && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-sm text-red-700 dark:text-red-400">
            Đã vượt {formatHours(actualHours - estimatedHours)} so với ước tính
          </span>
        </div>
      )}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Ghi nhận thời gian
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                    Giờ
                  </label>
                  <input
                    type="number"
                    value={logHours}
                    onChange={(e) => setLogHours(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                    Phút
                  </label>
                  <input
                    type="number"
                    value={logMinutes}
                    onChange={(e) => setLogMinutes(e.target.value)}
                    placeholder="0"
                    min="0"
                    max="59"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                  Mô tả (tùy chọn)
                </label>
                <textarea
                  value={logDescription}
                  onChange={(e) => setLogDescription(e.target.value)}
                  placeholder="Bạn đã làm gì..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setShowLogModal(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleLogTime}
                disabled={!logHours && !logMinutes}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ghi nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}