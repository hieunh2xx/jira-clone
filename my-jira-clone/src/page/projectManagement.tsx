import { useState, useEffect } from "react"
import { Plus, Edit2, Trash2, Loader2, Search, FolderKanban, Calendar, Users, Building2, MoreVertical, Eye, Menu, ChevronLeft, ChevronRight, FileText, CheckCircle2, RotateCcw, Settings } from "lucide-react"
import { ProjectService } from "../service/project"
import { TaskService } from "../service/task"
import { toast } from "sonner"
import type { ProjectDto } from "../service/project"
import CreateProjectDialog from "../components/CreateProjectDialog"
import Sidebar from "../components/Sidebar"
import { useSidebar } from "../hooks/useSidebar"
import type { Project } from "../interface/types"
import { useNavigate } from "react-router-dom"
import { hasRole, getUserId } from "../helper/auth"
export default function ProjectManagementPage() {
  const [projects, setProjects] = useState<ProjectDto[]>([])
  const [sidebarProjects, setSidebarProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectDto | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState("")
  const [selectedProject, setSelectedProject] = useState<number>(0)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [projectTaskCounts, setProjectTaskCounts] = useState<Record<number, number>>({})
  const { isOpen, toggleSidebar } = useSidebar()
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [usePagination, setUsePagination] = useState(false)
  const [statusUpdateProject, setStatusUpdateProject] = useState<ProjectDto | null>(null)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  
  // Check if user is team leader
  const isLeader = hasRole('team_lead') || hasRole('system_admin')
  
  const loadTaskCounts = async (projectsList: ProjectDto[]) => {
    const counts: Record<number, number> = {}
    try {
      await Promise.all(
        projectsList.map(async (project) => {
          try {
            const board = await TaskService.getKanban(project.id)
            const totalTasks = board.columns.reduce((sum, col) => sum + col.tasks.length, 0)
            counts[project.id] = totalTasks
          } catch (error) {
            counts[project.id] = 0
          }
        })
      )
      setProjectTaskCounts(counts)
      updateSidebarProjects(projectsList, counts)
    } catch (error) {
      // Error loading task counts
    }
  }
  const updateSidebarProjects = (projectsList: ProjectDto[], counts: Record<number, number>) => {
    const sidebarFormat: Project[] = projectsList.map(p => ({
      id: p.id,
      name: p.name || '',
      description: p.description || '',
      tasks: Array(counts[p.id] || 0).fill(null),
      teamMembers: []
    }))
    setSidebarProjects(sidebarFormat)
  }
  const loadProjects = async () => {
    try {
      setLoading(true)
      if (usePagination) {
        const result = await ProjectService.getAllPaged(searchKeyword || undefined, currentPage, pageSize)
        const projectList = Array.isArray(result?.Items) 
          ? result.Items 
          : (Array.isArray(result?.items) 
            ? result.items 
            : (Array.isArray(result) ? result : []))
        setProjects(projectList)
        setTotalPages(result?.TotalPages || result?.totalPages || 1)
        setTotalCount(result?.TotalCount || result?.totalCount || 0)
        await loadTaskCounts(projectList)
        if (projectList.length > 0 && selectedProject === 0) {
          setSelectedProject(projectList[0].id)
        }
      } else {
        const data = await ProjectService.getAll(searchKeyword || undefined)
        let projectList: ProjectDto[] = []
        if (Array.isArray(data)) {
          projectList = data
        } else if (data && typeof data === 'object') {
          const dataObj = data as any
          if ('data' in dataObj && Array.isArray(dataObj.data)) {
            projectList = dataObj.data
          } else if ('items' in dataObj && Array.isArray(dataObj.items)) {
            projectList = dataObj.items
          }
        }
        setProjects(projectList)
        setTotalPages(1)
        setTotalCount(projectList.length)
        await loadTaskCounts(projectList)
        if (projectList.length > 0 && selectedProject === 0) {
          setSelectedProject(projectList[0].id)
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Không thể tải danh sách dự án')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    if (usePagination) {
      setCurrentPage(1)
    }
  }, [searchKeyword])
  useEffect(() => {
    loadProjects()
  }, [currentPage, searchKeyword, usePagination])
  const handleDelete = async (projectId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa dự án này? Tất cả tasks trong dự án cũng sẽ bị xóa.')) {
      return
    }
    try {
      await ProjectService.delete(projectId)
      toast.success('Đã xóa dự án thành công')
      loadProjects()
    } catch (error: any) {
      toast.error(error.message || 'Không thể xóa dự án')
    }
  }
  const handleCreateProject = async (data: { code: string; name: string; description?: string; teamId: number; memberIds?: number[]; departmentId?: number }) => {
    try {
      if (editingProject) {
        await ProjectService.update(editingProject.id, data)
        toast.success('Cập nhật dự án thành công!')
      } else {
        await ProjectService.create(data)
        toast.success('Tạo dự án thành công!')
      }
      setShowCreateDialog(false)
      setEditingProject(null)
      loadProjects()
    } catch (error: any) {
      toast.error(error.message || 'Không thể thực hiện thao tác')
      throw error
    }
  }
  
  const handleCompleteProject = async (project: ProjectDto) => {
    if (!confirm('Bạn có chắc chắn muốn đóng dự án này? Tất cả thành viên sẽ cần đánh giá trước khi xem thông tin dự án.')) {
      return
    }
    try {
      await ProjectService.complete(project.id)
      toast.success('Đã đóng dự án thành công. Tất cả thành viên cần đánh giá.')
      loadProjects()
    } catch (error: any) {
      toast.error(error.message || 'Không thể đóng dự án')
    }
  }
  
  const handleReopenProject = async (project: ProjectDto) => {
    if (!confirm('Bạn có chắc chắn muốn mở lại dự án này? Dự án có thể tiếp tục được chỉnh sửa.')) {
      return
    }
    try {
      await ProjectService.reopen(project.id)
      toast.success('Đã mở lại dự án thành công.')
      loadProjects()
    } catch (error: any) {
      toast.error(error.message || 'Không thể mở lại dự án')
    }
  }
  
  const handleUpdateStatus = async (project: ProjectDto, newStatus: string) => {
    try {
      await ProjectService.update(project.id, { 
        name: project.name,
        description: project.description,
        status: newStatus
      } as any)
      toast.success('Cập nhật trạng thái thành công!')
      setShowStatusDialog(false)
      setStatusUpdateProject(null)
      loadProjects()
    } catch (error: any) {
      toast.error(error.message || 'Không thể cập nhật trạng thái')
    }
  }
  const filteredProjects = usePagination ? projects : projects.filter(project => {
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
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'on_hold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
    }
  }
  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'active': return 'Đang hoạt động'
      case 'completed': return 'Hoàn thành'
      case 'on_hold': return 'Tạm dừng'
      default: return 'Chưa xác định'
    }
  }
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar
        projects={sidebarProjects}
        selectedProject={selectedProject}
        setSelectedProject={setSelectedProject}
        onProjectDeleted={loadProjects}
        disableNavigation={true}
        isOpen={isOpen}
        onToggleSidebar={toggleSidebar}
      />
      <main className="flex-1 overflow-hidden flex flex-col relative">
        {!isOpen && (
          <button
            onClick={toggleSidebar}
            className="absolute top-4 left-4 z-40 p-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
            title="Hiện sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <FolderKanban className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Quản lý dự án</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Quản lý tất cả các dự án trong hệ thống
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingProject(null)
                setShowCreateDialog(true)
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl font-medium"
            >
              <Plus className="w-5 h-5" />
              Tạo dự án mới
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm kiếm dự án theo tên, mã, mô tả..."
                className="w-full pl-12 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Bảng
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Lưới
              </button>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : viewMode === 'table' ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600 dark:text-slate-300">Mã dự án</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600 dark:text-slate-300">Tên dự án</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600 dark:text-slate-300">Mô tả</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600 dark:text-slate-300">Nhóm</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600 dark:text-slate-300">Phòng ban</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600 dark:text-slate-300">Trạng thái</th>
                    <th className="text-center py-4 px-6 text-sm font-semibold text-slate-600 dark:text-slate-300">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16">
                        <FolderKanban className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">
                          {searchKeyword ? 'Không tìm thấy dự án phù hợp' : 'Chưa có dự án nào'}
                        </p>
                        {!searchKeyword && (
                          <button
                            onClick={() => setShowCreateDialog(true)}
                            className="mt-4 text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                          >
                            Tạo dự án đầu tiên
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((project) => (
                      <tr 
                        key={project.id} 
                        className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg text-sm font-mono font-medium">
                            {project.code || '-'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-medium text-slate-900 dark:text-white">{project.name || '-'}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2">
                            {project.description || '-'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-700 dark:text-slate-300 text-sm">{project.teamName || '-'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-700 dark:text-slate-300 text-sm">{project.departmentName || '-'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                            {getStatusLabel(project.status)}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => navigate(`/board`, { state: { selectedProjectId: project.id } })}
                              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                              title="Xem board"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => navigate(`/projects/${project.id}/evaluation`)}
                              className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              title="Đánh giá dự án"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            {isLeader && (
                              <>
                                {!project.isCompleted ? (
                                  <button
                                    onClick={() => handleCompleteProject(project)}
                                    className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                                    title="Hoàn thành dự án"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleReopenProject(project)}
                                    className="p-2 text-slate-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                                    title="Mở lại dự án"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setStatusUpdateProject(project)
                                    setShowStatusDialog(true)
                                  }}
                                  className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                                  title="Cập nhật trạng thái"
                                >
                                  <Settings className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => {
                                setEditingProject(project)
                                setShowCreateDialog(true)
                              }}
                              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Sửa"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(project.id)}
                              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.length === 0 ? (
                <div className="col-span-full text-center py-16">
                  <FolderKanban className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">
                    {searchKeyword ? 'Không tìm thấy dự án phù hợp' : 'Chưa có dự án nào'}
                  </p>
                </div>
              ) : (
                filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all group"
                  >
                    <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <span className="inline-flex items-center px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded text-xs font-mono font-medium mb-2">
                            {project.code || 'N/A'}
                          </span>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {project.name}
                          </h3>
                        </div>
                        <div className="relative">
                          <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                        {project.description || 'Chưa có mô tả'}
                      </p>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600 dark:text-slate-400">{project.teamName || 'Chưa có nhóm'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600 dark:text-slate-400">{project.departmentName || 'Chưa có phòng ban'}</span>
                        </div>
                        {project.startDate && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600 dark:text-slate-400">
                              {new Date(project.startDate).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                          {getStatusLabel(project.status)}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => navigate(`/board`, { state: { selectedProjectId: project.id } })}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                            title="Xem board"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/projects/${project.id}/evaluation`)}
                            className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="Đánh giá dự án"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingProject(project)
                              setShowCreateDialog(true)
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(project.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          {!loading && usePagination && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Hiển thị {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalCount)} / {totalCount} dự án
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-slate-200 dark:border-slate-600"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Trước
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                          currentPage === pageNum
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-slate-200 dark:border-slate-600"
                >
                  Sau
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          {!loading && !usePagination && filteredProjects.length > 0 && (
            <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
              Hiển thị {filteredProjects.length} / {projects.length} dự án
            </div>
          )}
        </div>
      </main>
      <CreateProjectDialog
        isOpen={showCreateDialog}
        onClose={() => {
          setShowCreateDialog(false)
          setEditingProject(null)
        }}
        onCreateProject={handleCreateProject}
        editingProject={editingProject}
      />
      
      {/* Status Update Dialog */}
      {showStatusDialog && statusUpdateProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              Cập nhật trạng thái dự án
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Dự án: <span className="font-medium">{statusUpdateProject.name}</span>
            </p>
            <div className="space-y-3 mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Trạng thái mới
              </label>
              <select
                defaultValue={statusUpdateProject.status || 'planning'}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                id="status-select"
              >
                <option value="planning">Lập kế hoạch</option>
                <option value="active">Đang hoạt động</option>
                <option value="on_hold">Tạm dừng</option>
                <option value="completed">Hoàn thành</option>
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowStatusDialog(false)
                  setStatusUpdateProject(null)
                }}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  const select = document.getElementById('status-select') as HTMLSelectElement
                  if (select && statusUpdateProject) {
                    handleUpdateStatus(statusUpdateProject, select.value)
                  }
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}