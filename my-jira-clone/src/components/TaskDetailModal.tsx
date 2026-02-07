import React, { useState, useEffect, useCallback, useRef } from "react";
import { X, Maximize2, Minimize2, Download, Image as ImageIcon, File as FileIcon } from "lucide-react";
import { isAdmin, getUserId, hasRole } from "../helper/auth";
import CommentSection from "./CommentSection";
import { CommentService, CommentDto } from "../service/comment";
import { TaskService } from "../service/task";
import { TaskDto } from "../interface/kanbanInterface";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { DashboardService } from "../service/dashboard";
import { UserDto } from "../interface/dto";
import AssigneeSelector from "./AssigneeSelector";
import { ProjectService } from "../service/project";
import { TeamService } from "../service/team";
import { getStatusLabel, getStatusValue } from "../helper/statusHelper";
interface TaskDetailModalProps {
  task: TaskDto;
  projectId: number;
  onClose: () => void;
  onUpdate?: () => void;
}
interface EditingField {
  [key: string]: boolean;
}
export default function TaskDetailModal({
  task,
  projectId,
  onClose,
  onUpdate,
}: TaskDetailModalProps) {
  const [editedTask, setEditedTask] = useState<TaskDto>(task);
  const [originalTask, setOriginalTask] = useState<TaskDto>(task);
  const [editingFields, setEditingFields] = useState<EditingField>({});
  const [isMaximized, setIsMaximized] = useState(false);
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [allUsers, setAllUsers] = useState<UserDto[]>([]);
  const [teamMemberIds, setTeamMemberIds] = useState<number[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
  const previousAssigneeIdsRef = useRef<number[]>([]);
  const isSystemAdmin = isAdmin();
  const currentUserId = getUserId();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const canDelete = () => {
    if (isSystemAdmin) return false;
    // Creator can delete
    if (currentUserId === editedTask.createdBy) return true;
    // Project leader can delete
    if (project && project.teamId) {
      // Check if user is team lead (we'll check this via project.teamLeadId or similar)
      // For now, allow team_lead role to delete
      if (hasRole('team_lead')) return true;
    }
    return false;
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        const projectData = await ProjectService.getById(projectId);
        setProject(projectData);
        const team = await TeamService.getById(projectData.teamId);
        setTeamMemberIds(team.memberIds || []);
        const users = await DashboardService.getAllUsers();
        setAllUsers(users);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Không thể tải dữ liệu");
      }
    };
    fetchData();
  }, [projectId]);
  useEffect(() => {
    loadComments();
  }, [task.id, projectId]);
  const loadComments = async () => {
    try {
      setLoadingComments(true);
      const loadedComments = await CommentService.getAll(projectId, task.id);
      setComments(loadedComments);
    } catch (error: any) {
      console.error("Error loading comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };
  const loadTaskDetail = useCallback(async () => {
    try {
      const taskDetail = await TaskService.getDetail(projectId, task.id);
      setEditedTask(taskDetail);
      setOriginalTask(taskDetail);
    } catch (error: any) {
      toast.error(error.message || "Không thể tải chi tiết task");
    }
  }, [projectId, task.id]);
  useEffect(() => {
    loadTaskDetail();
  }, [loadTaskDetail]);
  useEffect(() => {
    setEditedTask(task);
    setOriginalTask(task);
  }, [task.id]);
  const handleFieldClick = (fieldName: string) => {
    if (isSystemAdmin) return;
    setEditingFields({ ...editingFields, [fieldName]: true });
  };
  const handleFieldChange = (fieldName: string, value: any) => {
    if (isSystemAdmin) return;
    setEditedTask({ ...editedTask, [fieldName]: value });
  };
  const handleFieldSave = async (fieldName: string) => {
    if (isSystemAdmin) return;
    setEditingFields({ ...editingFields, [fieldName]: false });
    await saveTask();
  };
  const handleKeyDown = (e: React.KeyboardEvent, fieldName: string) => {
    if (e.key === "Enter" && fieldName !== "description") {
      e.preventDefault();
      handleFieldSave(fieldName);
    }
  };
  const toLocalDTValue = (iso: string | null | undefined): string => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    const hours = String(d.getUTCHours()).padStart(2, "0");
    const minutes = String(d.getUTCMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  const formatDueDate = (iso: string | null | undefined): string => {
    if (!iso) return "Chưa có hạn chót";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "Invalid date";
    const day = String(d.getUTCDate()).padStart(2, "0");
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const year = d.getUTCFullYear();
    const hours = String(d.getUTCHours()).padStart(2, "0");
    const minutes = String(d.getUTCMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };
  const getTimeOrNull = (iso: string | null | undefined): number | null => {
    if (!iso) return null;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d.getTime();
  };
  const saveTask = async () => {
    if (isSystemAdmin || isSaving) return;
    try {
      setIsSaving(true);
      const updateData: any = {};
      if (editedTask.title !== originalTask.title) updateData.title = editedTask.title;
      if (editedTask.description !== originalTask.description)
        updateData.description = editedTask.description;
      if (editedTask.priority !== originalTask.priority)
        updateData.priority = editedTask.priority;
      const originalDueDateTime = getTimeOrNull(originalTask.dueDate);
      const newDueDateTime = getTimeOrNull(editedTask.dueDate);
      if (originalDueDateTime !== newDueDateTime) {
        updateData.dueDate = editedTask.dueDate;
      }
      const originalAssigneeIds = (originalTask.assigneeIds || []).slice().sort((a, b) => a - b);
      const newAssigneeIds = (editedTask.assigneeIds || []).slice().sort((a, b) => a - b);
      const assigneeIdsChanged = 
        originalAssigneeIds.length !== newAssigneeIds.length ||
        !originalAssigneeIds.every((id, idx) => id === newAssigneeIds[idx]);
      if (assigneeIdsChanged) {
        updateData.assigneeIds = editedTask.assigneeIds || [];
      }
      if (Object.keys(updateData).length > 0) {
        await TaskService.update(projectId, task.id, updateData);
        toast.success("Đã cập nhật task");
        await loadTaskDetail();
        onUpdate?.();
      }
    } catch (error: any) {
      toast.error(error.message || "Không thể cập nhật task");
    } finally {
      setIsSaving(false);
    }
  };
  const handleClose = () => {
    onClose();
  };
  const priorityOptions = ["low", "medium", "high"];
  const statusOptions = ["Cần làm", "Đang làm", "Đang kiểm tra", "Đã hoàn thành"];
  const updateAssignees = useCallback(async (ids: number[]) => {
    if (isSystemAdmin || isSaving) return;
    setEditedTask((prev) => {
      previousAssigneeIdsRef.current = prev.assigneeIds || [];
      return {
        ...prev,
        assigneeIds: ids,
      };
    });
    try {
      setIsSaving(true);
      const updatedTask = await TaskService.update(projectId, task.id, { assigneeIds: ids });
      setEditedTask(updatedTask);
      setOriginalTask(updatedTask);
      toast.success("Đã cập nhật người phụ trách");
      loadTaskDetail().catch(() => {
      });
      if (onUpdate) {
        onUpdate();
      }
    } catch (error: any) {
      setEditedTask((prev) => ({
        ...prev,
        assigneeIds: previousAssigneeIdsRef.current,
      }));
      toast.error(error?.message || "Không thể cập nhật người phụ trách");
    } finally {
      setIsSaving(false);
    }
  }, [isSystemAdmin, isSaving, projectId, task.id, loadTaskDetail, onUpdate]);
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className={`bg-white border border-gray-300 rounded-lg shadow-lg ${isMaximized
            ? "w-full h-full max-w-none max-h-none rounded-none"
            : "w-full max-w-4xl max-h-[90vh]"
          } overflow-y-auto flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-300 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-black">Chi tiết công việc</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg"
            >
              {isMaximized ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={handleClose}
              className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề
            </label>
            {editingFields.title ? (
              <input
                type="text"
                value={editedTask.title}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                onBlur={() => handleFieldSave("title")}
                onKeyDown={(e) => handleKeyDown(e, "title")}
                autoFocus
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
            ) : (
              <p
                className={`text-black text-sm ${isSystemAdmin
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer hover:underline"
                  }`}
                onClick={() => handleFieldClick("title")}
              >
                {editedTask.title || "Chưa có tiêu đề"}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            {editingFields.description ? (
              <textarea
                value={editedTask.description || ""}
                onChange={(e) =>
                  handleFieldChange("description", e.target.value)
                }
                onBlur={() => handleFieldSave("description")}
                autoFocus
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
            ) : (
              <p
                className={`text-black text-sm whitespace-pre-wrap ${isSystemAdmin
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer hover:underline"
                  }`}
                onClick={() => handleFieldClick("description")}
              >
                {editedTask.description || "Chưa có mô tả"}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              value={getStatusLabel(editedTask.status || "todo")}
              onChange={async (e) => {
                if (isSystemAdmin) return;
                const previousStatus = editedTask.status;
                const newStatus = getStatusValue(e.target.value);
                setEditedTask((prev) => ({
                  ...prev,
                  status: newStatus as any,
                }));
                try {
                  setIsSaving(true);
                  await TaskService.update(projectId, task.id, {
                    status: newStatus,
                  });
                  toast.success("Đã cập nhật trạng thái");
                  await loadTaskDetail();
                  onUpdate?.();
                } catch (error: any) {
                  toast.error(error.message || "Không thể cập nhật trạng thái");
                  setEditedTask((prev) => ({ ...prev, status: previousStatus }));
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={isSystemAdmin || isSaving}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${isSystemAdmin ? "cursor-not-allowed opacity-60 bg-gray-100" : ""
                }`}
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Độ ưu tiên
            </label>
            <select
              value={editedTask.priority || "medium"}
              onChange={(e) => handleFieldChange("priority", e.target.value)}
              onBlur={() => handleFieldSave("priority")}
              disabled={isSystemAdmin}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${isSystemAdmin ? "cursor-not-allowed opacity-60 bg-gray-100" : ""
                }`}
            >
              <option value="low">Thấp</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deadline
            </label>
            {editingFields.dueDate ? (
              <input
                type="datetime-local"
                value={toLocalDTValue(editedTask.dueDate || undefined)}
                onChange={(e) => {
                  if (!e.target.value) {
                    handleFieldChange("dueDate", null);
                    return;
                  }
                  const isoString = `${e.target.value}:00.000Z`;
                  handleFieldChange("dueDate", isoString);
                }}
                onBlur={() => handleFieldSave("dueDate")}
                disabled={isSystemAdmin}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${isSystemAdmin
                    ? "cursor-not-allowed opacity-60 bg-gray-100"
                    : ""
                  }`}
              />
            ) : (
              <p
                className={`text-black text-sm ${isSystemAdmin
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer hover:underline"
                  }`}
                onClick={() => handleFieldClick("dueDate")}
              >
                {formatDueDate(editedTask.dueDate)}
              </p>
            )}
          </div>
          <AssigneeSelector
            key={`assignee-${task.id}-${(editedTask.assigneeIds || []).join(',')}`}
            allUsers={allUsers.filter(user => teamMemberIds.includes(user.id))}
            selectedIds={editedTask.assigneeIds || []}
            onChange={(ids) => {
              if (isSystemAdmin) return;
              updateAssignees(ids);
            }}
            disabled={isSystemAdmin || isSaving}
          />
          {editedTask.images && editedTask.images.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hình ảnh ({editedTask.images.length})
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {editedTask.images.map((img) => (
                  <div
                    key={img.id}
                    className="relative group cursor-pointer"
                    onClick={() => {
                      setSelectedImageUrl(img.imageUrl);
                      setShowImageModal(true);
                    }}
                  >
                    <div className="aspect-square rounded-lg overflow-hidden border border-gray-300 hover:border-blue-500 transition-colors">
                      <img
                        src={img.imageUrl}
                        alt={img.fileName || "Image"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EImage%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="mt-1 text-xs text-gray-600 truncate" title={img.fileName}>
                      {img.fileName}
                    </div>
                    <div className="text-xs text-gray-400">
                      {(img.fileSizeKb / 1024).toFixed(2)} MB
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {editedTask.files && editedTask.files.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tệp đính kèm ({editedTask.files.length})
              </label>
              <div className="space-y-2">
                {editedTask.files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate" title={file.fileName}>
                          {file.fileName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {(file.fileSizeKb / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const a = document.createElement("a");
                        a.href = file.fileUrl;
                        a.download = file.fileName;
                        a.target = "_blank";
                        a.click();
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Tải xuống
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <CommentSection
            projectId={projectId}
            taskId={task.id}
            comments={comments}
            onCommentsChange={loadComments}
          />
          {canDelete() && (
            <div className="mt-6 pt-6 border-t border-gray-300">
              <button
                onClick={async () => {
                  if (!confirm("Bạn có chắc chắn muốn xóa task này không? Hành động này không thể hoàn tác.")) {
                    return;
                  }
                  try {
                    setIsDeleting(true);
                    await TaskService.delete(projectId, task.id);
                    toast.success("Đã xóa task thành công");
                    onClose();
                  } catch (error: any) {
                    toast.error(error.message || "Không thể xóa task");
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                disabled={isDeleting}
                className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isDeleting ? "Đang xóa..." : "Xóa Task"}
              </button>
            </div>
          )}
        </div>
      </div>
      {showImageModal && selectedImageUrl && (
        <div
          className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
          onClick={() => {
            setShowImageModal(false);
            setSelectedImageUrl("");
          }}
        >
          <div className="relative max-w-full max-h-full">
            <button
              onClick={() => {
                setShowImageModal(false);
                setSelectedImageUrl("");
              }}
              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedImageUrl}
              alt="Full size"
              className="max-w-full max-h-[90vh] rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}