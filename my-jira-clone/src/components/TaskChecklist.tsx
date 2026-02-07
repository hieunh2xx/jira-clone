
import { useState, useRef, useEffect } from "react";
import { 
  CheckSquare, 
  Square, 
  Plus, 
  Trash2, 
  GripVertical,
  MoreHorizontal,
  Check,
  X
} from "lucide-react";
export interface ChecklistItem {
  id: string;
  title: string;
  isCompleted: boolean;
  createdAt: string;
  completedAt?: string;
}
interface TaskChecklistProps {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
  disabled?: boolean;
}
export default function TaskChecklist({ items, onChange, disabled }: TaskChecklistProps) {
  const [newItemTitle, setNewItemTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);
  const completedCount = items.filter(item => item.isCompleted).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;
  const addItem = () => {
    if (!newItemTitle.trim() || disabled) return;
    const newItem: ChecklistItem = {
      id: `checklist_${Date.now()}`,
      title: newItemTitle.trim(),
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };
    onChange([...items, newItem]);
    setNewItemTitle("");
    inputRef.current?.focus();
  };
  const toggleItem = (id: string) => {
    if (disabled) return;
    const updatedItems = items.map(item => {
      if (item.id === id) {
        return {
          ...item,
          isCompleted: !item.isCompleted,
          completedAt: !item.isCompleted ? new Date().toISOString() : undefined,
        };
      }
      return item;
    });
    onChange(updatedItems);
  };
  const deleteItem = (id: string) => {
    if (disabled) return;
    onChange(items.filter(item => item.id !== id));
  };
  const startEditing = (item: ChecklistItem) => {
    if (disabled) return;
    setEditingId(item.id);
    setEditingTitle(item.title);
  };
  const saveEdit = () => {
    if (!editingTitle.trim() || !editingId) {
      setEditingId(null);
      return;
    }
    const updatedItems = items.map(item => {
      if (item.id === editingId) {
        return { ...item, title: editingTitle.trim() };
      }
      return item;
    });
    onChange(updatedItems);
    setEditingId(null);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditingTitle("");
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem();
    }
  };
  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };
  const handleDragStart = (id: string) => {
    if (disabled) return;
    setDraggedItem(id);
  };
  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId || disabled) return;
    const draggedIndex = items.findIndex(item => item.id === draggedItem);
    const targetIndex = items.findIndex(item => item.id === targetId);
    if (draggedIndex === -1 || targetIndex === -1) return;
    const newItems = [...items];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, removed);
    onChange(newItems);
  };
  const handleDragEnd = () => {
    setDraggedItem(null);
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-slate-900 dark:text-white">
            Checklist
          </span>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            ({completedCount}/{items.length})
          </span>
        </div>
        {items.length > 0 && (
          <span className="text-sm font-medium text-blue-600">
            {Math.round(progress)}%
          </span>
        )}
      </div>
      {items.length > 0 && (
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      <div className="space-y-1">
        {items.map((item) => (
          <div
            key={item.id}
            draggable={!disabled && !editingId}
            onDragStart={() => handleDragStart(item.id)}
            onDragOver={(e) => handleDragOver(e, item.id)}
            onDragEnd={handleDragEnd}
            className={`group flex items-center gap-2 p-2 rounded-lg transition-colors ${
              draggedItem === item.id 
                ? 'opacity-50 bg-blue-50 dark:bg-blue-900/20' 
                : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            {!disabled && (
              <div className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-4 h-4 text-slate-400" />
              </div>
            )}
            <button
              onClick={() => toggleItem(item.id)}
              disabled={disabled}
              className={`flex-shrink-0 transition-colors ${
                disabled ? 'cursor-not-allowed opacity-50' : ''
              }`}
            >
              {item.isCompleted ? (
                <CheckSquare className="w-5 h-5 text-green-600" />
              ) : (
                <Square className="w-5 h-5 text-slate-400 hover:text-blue-600" />
              )}
            </button>
            {editingId === item.id ? (
              <div className="flex-1 flex items-center gap-2">
                <input
                  ref={editInputRef}
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  onBlur={saveEdit}
                  className="flex-1 px-2 py-1 text-sm border border-blue-500 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
                <button
                  onClick={saveEdit}
                  className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={cancelEdit}
                  className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <span
                onClick={() => startEditing(item)}
                className={`flex-1 text-sm cursor-pointer ${
                  item.isCompleted 
                    ? 'line-through text-slate-400 dark:text-slate-500' 
                    : 'text-slate-700 dark:text-slate-300'
                } ${disabled ? 'cursor-default' : 'hover:text-blue-600'}`}
              >
                {item.title}
              </span>
            )}
            {!disabled && !editingId && (
              <button
                onClick={() => deleteItem(item.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
      {!disabled && (
        <div className="flex items-center gap-2 pt-2">
          <Plus className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Thêm mục mới..."
            className="flex-1 px-2 py-1.5 text-sm bg-transparent border-b border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
          />
          {newItemTitle.trim() && (
            <button
              onClick={addItem}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Thêm
            </button>
          )}
        </div>
      )}
      {items.length === 0 && (
        <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
          Chưa có mục nào trong checklist
        </p>
      )}
    </div>
  );
}