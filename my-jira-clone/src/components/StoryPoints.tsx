
import { useState } from "react";
import { Zap, TrendingUp, Info } from "lucide-react";
interface StoryPointsProps {
  value?: number;
  onChange?: (points: number | undefined) => void;
  disabled?: boolean;
  showFibonacci?: boolean;
}
const FIBONACCI_POINTS = [1, 2, 3, 5, 8, 13, 21];
const TSHIRT_SIZES = [
  { label: "XS", points: 1, description: "Rất nhỏ, < 2 giờ" },
  { label: "S", points: 2, description: "Nhỏ, 2-4 giờ" },
  { label: "M", points: 3, description: "Trung bình, 4-8 giờ" },
  { label: "L", points: 5, description: "Lớn, 1-2 ngày" },
  { label: "XL", points: 8, description: "Rất lớn, 2-3 ngày" },
  { label: "XXL", points: 13, description: "Cực lớn, 3-5 ngày" },
];
export default function StoryPoints({
  value,
  onChange,
  disabled,
  showFibonacci = true
}: StoryPointsProps) {
  const [showSelector, setShowSelector] = useState(false);
  const [viewMode, setViewMode] = useState<"fibonacci" | "tshirt">("fibonacci");
  const getPointColor = (points: number) => {
    if (points <= 2) return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    if (points <= 5) return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    if (points <= 8) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  };
  const getPointDescription = (points: number) => {
    const size = TSHIRT_SIZES.find(s => s.points === points);
    return size?.description || `${points} điểm`;
  };
  const selectPoints = (points: number) => {
    onChange?.(points);
    setShowSelector(false);
  };
  const clearPoints = () => {
    onChange?.(undefined);
    setShowSelector(false);
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-600" />
          <span className="font-medium text-slate-900 dark:text-white">
            Story Points
          </span>
        </div>
        {value && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {getPointDescription(value)}
          </span>
        )}
      </div>
      <div className="relative">
        <button
          onClick={() => !disabled && setShowSelector(!showSelector)}
          disabled={disabled}
          className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
            disabled 
              ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60' 
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-500 cursor-pointer'
          }`}
        >
          {value ? (
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-lg font-bold ${getPointColor(value)}`}>
                {value}
              </span>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {TSHIRT_SIZES.find(s => s.points === value)?.label || ''} - {getPointDescription(value)}
              </span>
            </div>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">
              Chưa ước tính
            </span>
          )}
          <TrendingUp className="w-5 h-5 text-slate-400" />
        </button>
        {showSelector && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-10 overflow-hidden">
            <div className="flex border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode("fibonacci")}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === "fibonacci"
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                Fibonacci
              </button>
              <button
                onClick={() => setViewMode("tshirt")}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === "tshirt"
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                T-Shirt Size
              </button>
            </div>
            <div className="p-4">
              {viewMode === "fibonacci" ? (
                <div className="grid grid-cols-4 gap-2">
                  {FIBONACCI_POINTS.map((points) => (
                    <button
                      key={points}
                      onClick={() => selectPoints(points)}
                      className={`p-3 rounded-lg text-center transition-all hover:scale-105 ${
                        value === points
                          ? `${getPointColor(points)} ring-2 ring-blue-500`
                          : `${getPointColor(points)} hover:ring-2 hover:ring-blue-300`
                      }`}
                    >
                      <span className="text-xl font-bold">{points}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {TSHIRT_SIZES.map((size) => (
                    <button
                      key={size.label}
                      onClick={() => selectPoints(size.points)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                        value === size.points
                          ? `${getPointColor(size.points)} ring-2 ring-blue-500`
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-12 text-center px-2 py-1 rounded font-bold ${getPointColor(size.points)}`}>
                          {size.label}
                        </span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {size.description}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-slate-400">
                        {size.points}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {value && (
              <div className="px-4 pb-4">
                <button
                  onClick={clearPoints}
                  className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  Xóa ước tính
                </button>
              </div>
            )}
            <div className="px-4 pb-4">
              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Story Points đo độ phức tạp tương đối của task, không phải thời gian. 
                  Sử dụng dãy Fibonacci để tránh ước tính quá chính xác.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}