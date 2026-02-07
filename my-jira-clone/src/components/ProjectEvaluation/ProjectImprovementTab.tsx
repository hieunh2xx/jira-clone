import { useState, useEffect } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { ProjectEvaluationService } from "../../service/projectEvaluation";
import { toast } from "sonner";
import type { ProjectImprovementDto } from "../../service/projectEvaluation";

interface ProjectImprovementTabProps {
  projectId: number;
  readonly?: boolean;
}

export default function ProjectImprovementTab({ projectId, readonly = false }: ProjectImprovementTabProps) {
  const [beforeAdvantages, setBeforeAdvantages] = useState<ProjectImprovementDto[]>([]);
  const [beforeDisadvantages, setBeforeDisadvantages] = useState<ProjectImprovementDto[]>([]);
  const [afterAdvantages, setAfterAdvantages] = useState<ProjectImprovementDto[]>([]);
  const [afterDisadvantages, setAfterDisadvantages] = useState<ProjectImprovementDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [addingItem, setAddingItem] = useState<{ type: "before" | "after", category: "advantage" | "disadvantage" } | null>(null);
  const [newItemContent, setNewItemContent] = useState("");

  useEffect(() => {
    loadImprovements();
  }, [projectId]);

  const loadImprovements = async () => {
    try {
      setLoading(true);
      // Load current user's improvements only
      const { getUserId } = await import("../../helper/auth");
      const userId = getUserId();
      
      const improvements = await ProjectEvaluationService.getImprovements(projectId, undefined, userId);
      const improvementsList = Array.isArray(improvements) ? improvements : [];
      
      setBeforeAdvantages(improvementsList.filter(i => i.type === "before" && i.category === "advantage"));
      setBeforeDisadvantages(improvementsList.filter(i => i.type === "before" && i.category === "disadvantage"));
      setAfterAdvantages(improvementsList.filter(i => i.type === "after" && i.category === "advantage"));
      setAfterDisadvantages(improvementsList.filter(i => i.type === "after" && i.category === "disadvantage"));
    } catch (error: any) {
      console.error("Error loading improvements:", error);
      toast.error("Không thể tải dữ liệu cải tiến");
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = (type: "before" | "after", category: "advantage" | "disadvantage") => {
    setAddingItem({ type, category });
    setNewItemContent("");
  };

  const handleSaveNewItem = async () => {
    if (!addingItem || !newItemContent.trim()) {
      setAddingItem(null);
      setNewItemContent("");
      return;
    }

    try {
      await ProjectEvaluationService.createImprovement({
        projectId,
        type: addingItem.type,
        category: addingItem.category,
        content: newItemContent.trim(),
        orderIndex: 0,
      });
      toast.success("Thêm thành công");
      setAddingItem(null);
      setNewItemContent("");
      await loadImprovements();
    } catch (error: any) {
      console.error("Error adding improvement:", error);
      toast.error("Không thể thêm");
    }
  };

  const handleCancelAdd = () => {
    setAddingItem(null);
    setNewItemContent("");
  };

  const handleDelete = async (id: number) => {
    try {
      await ProjectEvaluationService.deleteImprovement(id);
      toast.success("Xóa thành công");
      await loadImprovements();
    } catch (error: any) {
      console.error("Error deleting improvement:", error);
      toast.error("Không thể xóa");
    }
  };

  const handleEdit = (improvement: ProjectImprovementDto) => {
    setEditingId(improvement.id);
    setEditingContent(improvement.content);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    
    const improvement = [...beforeAdvantages, ...beforeDisadvantages, ...afterAdvantages, ...afterDisadvantages]
      .find(i => i.id === editingId);
    
    if (!improvement) return;

    try {
      await ProjectEvaluationService.updateImprovement(editingId, {
        projectId,
        type: improvement.type,
        category: improvement.category,
        content: editingContent,
        orderIndex: improvement.orderIndex,
      });
      toast.success("Cập nhật thành công");
      setEditingId(null);
      setEditingContent("");
      await loadImprovements();
    } catch (error: any) {
      console.error("Error updating improvement:", error);
      toast.error("Không thể cập nhật");
    }
  };

  const ImprovementCard = ({ 
    title, 
    items, 
    onAddAdvantage, 
    onAddDisadvantage,
    onDelete, 
    onEdit,
    readonly = false,
    cardType,
    addingItem,
    newItemContent,
    onNewItemContentChange,
    onSaveNewItem,
    onCancelAdd
  }: { 
    title: string;
    items: ProjectImprovementDto[];
    onAddAdvantage: () => void;
    onAddDisadvantage: () => void;
    onDelete: (id: number) => void;
    onEdit: (item: ProjectImprovementDto) => void;
    readonly?: boolean;
    cardType: "before" | "after";
    addingItem: { type: "before" | "after", category: "advantage" | "disadvantage" } | null;
    newItemContent: string;
    onNewItemContentChange: (content: string) => void;
    onSaveNewItem: () => void;
    onCancelAdd: () => void;
  }) => (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">{title}</h3>
      
      <div className="space-y-4 mb-4">
        <div>
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Ưu điểm / メリット</h4>
          {items.filter(i => i.category === "advantage").map((item) => (
            <div key={item.id} className="flex items-start gap-2 mb-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="flex-1 text-slate-900 dark:text-slate-100">{item.content}</span>
              {!readonly && (
                <>
                  <button
                    onClick={() => onEdit(item)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          ))}
          {!readonly && (
            <>
              {addingItem?.type === cardType && addingItem?.category === "advantage" ? (
                <div className="mt-2 p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg">
                  <textarea
                    value={newItemContent}
                    onChange={(e) => onNewItemContentChange(e.target.value)}
                    placeholder="Nhập nội dung ưu điểm..."
                    className="w-full h-24 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y mb-2"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={onSaveNewItem}
                      className="px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={onCancelAdd}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={onAddAdvantage}
                  className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mt-2"
                >
                  <Plus className="h-4 w-4" />
                  Thêm ưu điểm
                </button>
              )}
            </>
          )}
        </div>

        <div>
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nhược điểm / デメリット</h4>
          {items.filter(i => i.category === "disadvantage").map((item) => (
            <div key={item.id} className="flex items-start gap-2 mb-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <span className="flex-1 text-slate-900 dark:text-slate-100">{item.content}</span>
              {!readonly && (
                <>
                  <button
                    onClick={() => onEdit(item)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          ))}
          {!readonly && (
            <>
              {addingItem?.type === cardType && addingItem?.category === "disadvantage" ? (
                <div className="mt-2 p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg">
                  <textarea
                    value={newItemContent}
                    onChange={(e) => onNewItemContentChange(e.target.value)}
                    placeholder="Nhập nội dung nhược điểm..."
                    className="w-full h-24 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y mb-2"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={onSaveNewItem}
                      className="px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={onCancelAdd}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={onAddDisadvantage}
                  className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mt-2"
                >
                  <Plus className="h-4 w-4" />
                  Thêm nhược điểm
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {editingId && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Chỉnh sửa</h3>
          <textarea
            value={editingContent}
            onChange={(e) => setEditingContent(e.target.value)}
            className="w-full h-32 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 mb-4"
            disabled={readonly}
            readOnly={readonly}
          />
          <div className="flex gap-2">
          {!readonly && (
            <button
              onClick={handleSaveEdit}
              className="px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600"
            >
              Lưu
            </button>
          )}
            <button
              onClick={() => {
                setEditingId(null);
                setEditingContent("");
              }}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ImprovementCard
          title="Trước cải tiến / 改善前"
          items={[...beforeAdvantages, ...beforeDisadvantages]}
          onAddAdvantage={() => handleAddClick("before", "advantage")}
          onAddDisadvantage={() => handleAddClick("before", "disadvantage")}
          onDelete={handleDelete}
          onEdit={handleEdit}
          readonly={readonly}
          cardType="before"
          addingItem={addingItem}
          newItemContent={newItemContent}
          onNewItemContentChange={setNewItemContent}
          onSaveNewItem={handleSaveNewItem}
          onCancelAdd={handleCancelAdd}
        />
        <ImprovementCard
          title="Sau cải tiến / 改善後"
          items={[...afterAdvantages, ...afterDisadvantages]}
          onAddAdvantage={() => handleAddClick("after", "advantage")}
          onAddDisadvantage={() => handleAddClick("after", "disadvantage")}
          onDelete={handleDelete}
          onEdit={handleEdit}
          readonly={readonly}
          cardType="after"
          addingItem={addingItem}
          newItemContent={newItemContent}
          onNewItemContentChange={setNewItemContent}
          onSaveNewItem={handleSaveNewItem}
          onCancelAdd={handleCancelAdd}
        />
      </div>
    </div>
  );
}
