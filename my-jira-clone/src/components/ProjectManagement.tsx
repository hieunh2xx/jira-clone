import { useState, useEffect } from "react"
import { X, Plus, Edit2, Trash2, Loader2, Search } from "lucide-react"
import { ProjectService } from "../service/project"
import { toast } from "sonner"
import type { ProjectDto } from "../service/project"
import CreateProjectDialog from "./CreateProjectDialog"
interface ProjectManagementProps {
  isOpen: boolean
  onClose: () => void
  onProjectUpdated?: () => void
}
export default function ProjectManagement({ isOpen, onClose, onProjectUpdated }: ProjectManagementProps) {
  const [projects, setProjects] = useState<ProjectDto[]>([])
  const [loading, setLoading] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectDto | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState("")
  useEffect(() => {
    if (isOpen) {
      loadProjects()
    }
  }, [isOpen])
  const loadProjects = async () => {
    try {
      setLoading(true)
      const data = await ProjectService.getAll()
      setProjects(Array.isArray(data) ? data : [])
    } catch (error: any) {
      toast.error(error.message || 'Không thể tải danh sách dự án')
    } finally {
      setLoading(false)
    }
  }
  const handleDelete = async (projectId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa dự án này?')) {
      return
    }
    try {
      await ProjectService.delete(projectId)
      toast.success('Đã xóa dự án thành công')
      loadProjects()
      onProjectUpdated?.()
    } catch (error: any) {
      toast.error(error.message || 'Không thể xóa dự án')
    }
  }
  const handleCreateProject = async (data: { code: string; name: string; description?: string; teamId: number; memberIds?: number[]; departmentId?: number }) => {
    try {
      await ProjectService.create(data)
      toast.success('Tạo dự án thành công!')
      setShowCreateDialog(false)
      loadProjects()
      onProjectUpdated?.()
    } catch (error: any) {
      toast.error(error.message || 'Không thể tạo dự án')
      throw error
    }
  }
  const filteredProjects = projects.filter(project => {
    if (!searchKeyword) return true
    const keyword = searchKeyword.toLowerCase()
    return (
      project.name?.toLowerCase().includes(keyword) ||
      project.code?.toLowerCase().includes(keyword) ||
      project.description?.toLowerCase().includes(keyword) ||
      project.teamName?.toLowerCase().includes(keyword) ||
      project.departmentName?.toLowerCase().includes(keyword)
    )
  })
  if (!isOpen) return null
  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Quản lý dự án</h2>
            <button
              onClick={onClose}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 flex-1 overflow-auto">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Tìm kiếm dự án..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => setShowCreateDialog(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Tạo dự án mới
              </button>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-slate-100">Mã dự án</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-slate-100">Tên dự án</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-slate-100">Mô tả</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-slate-100">Nhóm</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-slate-100">Phòng ban</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-slate-100">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-500 dark:text-slate-400">
                          {searchKeyword ? 'Không tìm thấy dự án' : 'Chưa có dự án nào'}
                        </td>
                      </tr>
                    ) : (
                      filteredProjects.map((project) => (
                        <tr key={project.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                          <td className="py-3 px-4 text-sm text-slate-900 dark:text-slate-100">{project.code || '-'}</td>
                          <td className="py-3 px-4 text-sm text-slate-900 dark:text-slate-100 font-medium">{project.name || '-'}</td>
                          <td className="py-3 px-4 text-sm text-slate-900 dark:text-slate-100">{project.description || '-'}</td>
                          <td className="py-3 px-4 text-sm text-slate-900 dark:text-slate-100">{project.teamName || '-'}</td>
                          <td className="py-3 px-4 text-sm text-slate-900 dark:text-slate-100">{project.departmentName || '-'}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingProject(project)
                                  setShowCreateDialog(true)
                                }}
                                className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                title="Sửa"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(project.id)}
                                className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                title="Xóa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      <CreateProjectDialog
        isOpen={showCreateDialog}
        onClose={() => {
          setShowCreateDialog(false)
          setEditingProject(null)
        }}
        onCreateProject={handleCreateProject}
      />
    </>
  )
}