
import { useState, useRef, useEffect } from "react";
import { Tag, Plus, X, Check, Palette } from "lucide-react";
export interface TaskLabel {
  id: string;
  name: string;
  color: string;
}
const LABEL_COLORS = [
  { name: "Red", value: "#ef4444", bg: "bg-red-500" },
  { name: "Orange", value: "#f97316", bg: "bg-orange-500" },
  { name: "Amber", value: "#f59e0b", bg: "bg-amber-500" },
  { name: "Yellow", value: "#eab308", bg: "bg-yellow-500" },
  { name: "Lime", value: "#84cc16", bg: "bg-lime-500" },
  { name: "Green", value: "#22c55e", bg: "bg-green-500" },
  { name: "Emerald", value: "#10b981", bg: "bg-emerald-500" },
  { name: "Teal", value: "#14b8a6", bg: "bg-teal-500" },
  { name: "Cyan", value: "#06b6d4", bg: "bg-cyan-500" },
  { name: "Sky", value: "#0ea5e9", bg: "bg-sky-500" },
  { name: "Blue", value: "#3b82f6", bg: "bg-blue-500" },
  { name: "Indigo", value: "#6366f1", bg: "bg-indigo-500" },
  { name: "Violet", value: "#8b5cf6", bg: "bg-violet-500" },
  { name: "Purple", value: "#a855f7", bg: "bg-purple-500" },
  { name: "Fuchsia", value: "#d946ef", bg: "bg-fuchsia-500" },
  { name: "Pink", value: "#ec4899", bg: "bg-pink-500" },
];
const DEFAULT_LABELS: TaskLabel[] = [
  { id: "bug", name: "Lỗi", color: "#ef4444" },
  { id: "feature", name: "Tính năng", color: "#3b82f6" },
  { id: "improvement", name: "Cải tiến", color: "#22c55e" },
  { id: "documentation", name: "Tài liệu", color: "#8b5cf6" },
  { id: "urgent", name: "Khẩn cấp", color: "#f97316" },
  { id: "design", name: "Thiết kế", color: "#ec4899" },
  { id: "backend", name: "Backend", color: "#06b6d4" },
  { id: "frontend", name: "Frontend", color: "#eab308" },
];
interface TaskLabelsProps {
  selectedLabels: TaskLabel[];
  availableLabels?: TaskLabel[];
  onChange: (labels: TaskLabel[]) => void;
  onCreateLabel?: (label: TaskLabel) => void;
  disabled?: boolean;
  compact?: boolean;
}
export default function TaskLabels({
  selectedLabels,
  availableLabels = DEFAULT_LABELS,
  onChange,
  onCreateLabel,
  disabled,
  compact = false
}: TaskLabelsProps) {
  const [showSelector, setShowSelector] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0].value);
  const [searchQuery, setSearchQuery] = useState("");
  const selectorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(e.target as Node)) {
        setShowSelector(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  useEffect(() => {
    if (showCreateForm && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showCreateForm]);
  const toggleLabel = (label: TaskLabel) => {
    if (disabled) return;
    const isSelected = selectedLabels.some(l => l.id === label.id);
    if (isSelected) {
      onChange(selectedLabels.filter(l => l.id !== label.id));
    } else {
      onChange([...selectedLabels, label]);
    }
  };
  const removeLabel = (labelId: string) => {
    if (disabled) return;
    onChange(selectedLabels.filter(l => l.id !== labelId));
  };
  const createLabel = () => {
    if (!newLabelName.trim()) return;
    const newLabel: TaskLabel = {
      id: `label_${Date.now()}`,
      name: newLabelName.trim(),
      color: newLabelColor,
    };
    onCreateLabel?.(newLabel);
    onChange([...selectedLabels, newLabel]);
    setNewLabelName("");
    setShowCreateForm(false);
  };
  const filteredLabels = availableLabels.filter(label =>
    label.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const getLabelStyle = (color: string) => ({
    backgroundColor: `${color}20`,
    color: color,
    borderColor: `${color}40`,
  });
  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        {selectedLabels.map(label => (
          <span
            key={label.id}
            style={getLabelStyle(label.color)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border"
          >
            {label.name}
          </span>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-indigo-600" />
          <span className="font-medium text-slate-900 dark:text-white">
            Labels
          </span>
        </div>
        {selectedLabels.length > 0 && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {selectedLabels.length} đã chọn
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {selectedLabels.map(label => (
          <span
            key={label.id}
            style={getLabelStyle(label.color)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border"
          >
            {label.name}
            {!disabled && (
              <button
                onClick={() => removeLabel(label.id)}
                className="hover:opacity-70 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </span>
        ))}
        {!disabled && (
          <button
            onClick={() => setShowSelector(!showSelector)}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Thêm nhãn
          </button>
        )}
      </div>
      {showSelector && (
        <div 
          ref={selectorRef}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
          <div className="p-3 border-b border-slate-200 dark:border-slate-700">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm label..."
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-2">
            {filteredLabels.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                Không tìm thấy nhãn
              </p>
            ) : (
              <div className="space-y-1">
                {filteredLabels.map(label => {
                  const isSelected = selectedLabels.some(l => l.id === label.id);
                  return (
                    <button
                      key={label.id}
                      onClick={() => toggleLabel(label)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                        isSelected 
                          ? 'bg-blue-50 dark:bg-blue-900/30' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span
                        style={getLabelStyle(label.color)}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border"
                      >
                        {label.name}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="p-3 border-t border-slate-200 dark:border-slate-700">
            {showCreateForm ? (
              <div className="space-y-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createLabel()}
                  placeholder="Tên label mới..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-slate-400" />
                  <div className="flex flex-wrap gap-1">
                    {LABEL_COLORS.map(color => (
                      <button
                        key={color.value}
                        onClick={() => setNewLabelColor(color.value)}
                        className={`w-6 h-6 rounded-full transition-transform ${color.bg} ${
                          newLabelColor === color.value 
                            ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' 
                            : 'hover:scale-110'
                        }`}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                {newLabelName && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Preview:</span>
                    <span
                      style={getLabelStyle(newLabelColor)}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border"
                    >
                      {newLabelName}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={createLabel}
                    disabled={!newLabelName.trim()}
                    className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Tạo nhãn
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Tạo nhãn mới
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}