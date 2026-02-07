
import { useState, useEffect, useRef } from "react";
import { Plus, X, Calendar, Flag, User, Hash, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
interface QuickAddTaskProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: {
    title: string;
    priority: string;
    dueDate?: string;
    description?: string;
  }) => Promise<void>;
  defaultStatus?: string;
}
export default function QuickAddTask({ 
  isOpen, 
  onClose, 
  onSubmit,
  defaultStatus 
}: QuickAddTaskProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (!isOpen) {
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề task");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        priority,
        dueDate: dueDate || undefined,
      });
      setTitle("");
      setPriority("medium");
      setDueDate("");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Không thể tạo task");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  const quickDates = [
    { label: "Hôm nay", date: new Date() },
    { label: "Ngày mai", date: addDays(new Date(), 1) },
    { label: "Tuần sau", date: addDays(new Date(), 7) },
  ];
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden animate-in slide-in-from-top-4 duration-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Plus className="w-5 h-5" />
            <span className="text-sm font-medium">Tạo task nhanh</span>
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 rounded">
              Ctrl+N
            </kbd>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-4">
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tiêu đề task... (Enter để tạo)"
              className="w-full text-lg font-medium text-slate-900 dark:text-white bg-transparent border-none outline-none placeholder:text-slate-400"
              autoFocus
            />
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    const priorities = ['low', 'medium', 'high'];
                    const currentIndex = priorities.indexOf(priority);
                    setPriority(priorities[(currentIndex + 1) % priorities.length]);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    priority === 'high' 
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                      : priority === 'medium'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  }`}
                >
                  <Flag className="w-4 h-4" />
                  {priority === 'high' ? 'Cao' : priority === 'medium' ? 'Trung bình' : 'Thấp'}
                </button>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    dueDate 
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  {dueDate ? format(new Date(dueDate), 'dd/MM/yyyy') : 'Thêm deadline'}
                </button>
                {showDatePicker && (
                  <div className="absolute top-full left-0 mt-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-3 z-10 min-w-[200px]">
                    <div className="space-y-1 mb-3">
                      {quickDates.map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            setDueDate(item.date.toISOString());
                            setShowDatePicker(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                    <input
                      type="date"
                      value={dueDate ? format(new Date(dueDate), 'yyyy-MM-dd') : ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          setDueDate(new Date(e.target.value).toISOString());
                        } else {
                          setDueDate('');
                        }
                        setShowDatePicker(false);
                      }}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                    {dueDate && (
                      <button
                        type="button"
                        onClick={() => {
                          setDueDate('');
                          setShowDatePicker(false);
                        }}
                        className="w-full mt-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        Xóa deadline
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Nhấn <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs">Enter</kbd> để tạo task
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={!title.trim() || isSubmitting}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Tạo task
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}