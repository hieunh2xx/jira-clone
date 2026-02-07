import type React from "react"
import { useState, useEffect, useRef } from "react"
import { X, Image as ImageIcon, File, Trash2 } from "lucide-react"
import AssigneeSelector from "./AssigneeSelector"
import { UserDto } from "../interface/dto"
import { DashboardService } from "../service/dashboard"
interface FilePreview {
  file: File
  preview: string
  type: 'image' | 'file'
}
interface TaskDialogProps {
  isOpen: boolean
  onClose: () => void
  onAddTask: (task: any) => void
  teamMembers?: string[]
  initialStatus?: string
  parentOptions?: { id: number; title: string; key?: string }[]
  defaultParentId?: number | null
}
export default function TaskDialog({
  isOpen,
  onClose,
  onAddTask,
  teamMembers = [],
  initialStatus,
  parentOptions = [],
  defaultParentId = null
}: TaskDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assigneeIds: [] as number[],
    priority: "medium",
    dueDate: new Date().toISOString().split("T")[0],
    labels: [] as string[],
    status: initialStatus || "todo",
    parentTaskId: defaultParentId ? defaultParentId.toString() : ""
  })
  const [uploadedFiles, setUploadedFiles] = useState<FilePreview[]>([])
  const [allUsers, setAllUsers] = useState<UserDto[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (isOpen) {
      loadUsers()
    }
  }, [isOpen])
  const loadUsers = async () => {
    try {
      setLoadingUsers(true)
      const users = await DashboardService.getAllUsers()
      setAllUsers(users)
    } catch (error: any) {
      console.error('Error loading users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: "",
        description: "",
        assigneeIds: [],
        priority: "medium",
        dueDate: new Date().toISOString().split("T")[0],
        labels: [],
        status: initialStatus || "todo",
        parentTaskId: defaultParentId ? defaultParentId.toString() : ""
      })
      setUploadedFiles([])
    }
  }, [initialStatus, isOpen, teamMembers, defaultParentId])
  const handleFileAdd = (files: File[]) => {
    files.forEach((file) => {
      const isImage = file.type.startsWith('image/')
      const preview: FilePreview = {
        file,
        preview: isImage ? URL.createObjectURL(file) : '',
        type: isImage ? 'image' : 'file'
      }
      setUploadedFiles((prev) => [...prev, preview])
    })
  }
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleFileAdd(files)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleFileAdd(files)
    }
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
  }
  const removeFile = (index: number) => {
    setUploadedFiles((prev) => {
      const removed = prev[index]
      if (removed.preview) {
        URL.revokeObjectURL(removed.preview)
      }
      return prev.filter((_, i) => i !== index)
    })
  }
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.title.trim()) {
      const images = uploadedFiles.filter(f => f.type === 'image').map(f => f.file)
      const files = uploadedFiles.filter(f => f.type === 'file').map(f => f.file)
      onAddTask({
        ...formData,
        status: formData.status || "todo",
        parentTaskId: formData.parentTaskId ? Number(formData.parentTaskId) : undefined,
        images: images.length > 0 ? images : undefined,
        files: files.length > 0 ? files : undefined,
      })
      setFormData({
        title: "",
        description: "",
        assigneeIds: [],
        priority: "medium",
        dueDate: new Date().toISOString().split("T")[0],
        labels: [],
        status: initialStatus || "todo",
        parentTaskId: defaultParentId ? defaultParentId.toString() : ""
      })
      uploadedFiles.forEach(f => {
        if (f.preview) {
          URL.revokeObjectURL(f.preview)
        }
      })
      setUploadedFiles([])
      onClose()
    }
  }
  if (!isOpen) return null
  const images = uploadedFiles.filter(f => f.type === 'image')
  const files = uploadedFiles.filter(f => f.type === 'file')
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Tạo công việc mới</h2>
          <button
            onClick={onClose}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 block mb-2">Tiêu đề công việc</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập tiêu đề công việc"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 block mb-2">Mô tả</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập mô tả công việc"
              rows={3}
            />
          </div>
          <div>
            {loadingUsers ? (
              <div className="text-sm text-slate-500 dark:text-slate-400">Đang tải danh sách người dùng...</div>
            ) : (
              <AssigneeSelector
                allUsers={allUsers}
                selectedIds={formData.assigneeIds}
                onChange={(ids) => setFormData({ ...formData, assigneeIds: ids })}
              />
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 block mb-2">Độ ưu tiên</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Thấp</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 block mb-2">Hạn chót</label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {parentOptions.length > 0 && (
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100 block mb-2">
                Thuộc task chính
              </label>
              <select
                value={formData.parentTaskId}
                onChange={(e) => setFormData({ ...formData, parentTaskId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">(Task độc lập)</option>
                {parentOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.key ? `${option.key} - ${option.title}` : option.title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Chọn task chính để tạo task con.
              </p>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 block mb-2">
              Tệp đính kèm
            </label>
            <div className="flex gap-2 mb-2">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
              />
            </div>
            {images.length > 0 && (
              <div className="mb-2">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Hình ảnh ({images.length})</div>
                <div className="flex flex-wrap gap-2">
                  {images.map((item, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={item.preview}
                        alt={item.file.name}
                        className="w-20 h-20 object-cover rounded border border-slate-300 dark:border-slate-600"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(uploadedFiles.indexOf(item))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                        {item.file.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {files.length > 0 && (
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Tệp ({files.length})</div>
                <div className="space-y-1">
                  {files.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <File className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                        <span className="text-sm text-slate-900 dark:text-slate-100 truncate">
                          {item.file.name}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                          ({(item.file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(uploadedFiles.indexOf(item))}
                        className="ml-2 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              Tạo công việc
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}