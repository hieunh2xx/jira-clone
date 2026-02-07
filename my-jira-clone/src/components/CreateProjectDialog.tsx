import { useState, useEffect } from "react"
import { X, Loader2, Users, Building2 } from "lucide-react"
import { isAdmin, getUserId, canCreateProject } from "../helper/auth"
import { TeamService } from "../service/team"
import { DepartmentService } from "../service/department"
import { DashboardService } from "../service/dashboard"
import type { ProjectDto } from "../service/project"
import type { UserDto } from "../service/auth"
import type { DepartmentDto } from "../service/department"
interface CreateProjectDialogProps {
  isOpen: boolean
  onClose: () => void
  onCreateProject: (data: { code: string; name: string; description?: string; teamId: number; memberIds?: number[]; departmentId?: number }) => Promise<void>
  editingProject?: ProjectDto | null
}
interface TeamOption {
  id: number
  name: string
}
export default function CreateProjectDialog({ isOpen, onClose, onCreateProject, editingProject }: CreateProjectDialogProps) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    teamId: 0,
    memberIds: [] as number[],
    departmentId: undefined as number | undefined,
    selectionMode: "team" as "team" | "members" | "department"
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [teams, setTeams] = useState<TeamOption[]>([])
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [users, setUsers] = useState<UserDto[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [departments, setDepartments] = useState<DepartmentDto[]>([])
  const [loadingDepartments, setLoadingDepartments] = useState(false)
  const userIsAdmin = isAdmin()
  const userId = getUserId()
  useEffect(() => {
    if (isOpen && canCreateProject()) {
      loadTeams()
      if (formData.selectionMode === "members") {
        loadUsers()
      }
      if (formData.selectionMode === "department") {
        loadDepartments()
      }
    }
  }, [isOpen, formData.selectionMode])
  useEffect(() => {
    if (editingProject) {
      setFormData({
        code: editingProject.code || "",
        name: editingProject.name || "",
        description: editingProject.description || "",
        teamId: editingProject.teamId || 0
      })
    } else {
      setFormData({ code: "", name: "", description: "", teamId: 0, memberIds: [], departmentId: undefined, selectionMode: "team" })
    }
  }, [editingProject])
  const loadTeams = async () => {
    try {
      setLoadingTeams(true)
      const teamsData = await TeamService.getAll()
      let filteredTeams = teamsData
      if (!userIsAdmin && userId) {
        filteredTeams = teamsData.filter(t => t.leadId === userId)
      }
      setTeams(filteredTeams.map(t => ({ id: t.id, name: t.name })))
      if (filteredTeams.length > 0 && formData.teamId === 0) {
        setFormData(prev => ({ ...prev, teamId: filteredTeams[0].id }))
      }
    } catch (error) {
      console.error('Error loading teams:', error)
    } finally {
      setLoadingTeams(false)
    }
  }
  const loadUsers = async () => {
    try {
      setLoadingUsers(true)
      const usersData = await DashboardService.getAllUsers()
      setUsers(usersData || [])
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }
  const loadDepartments = async () => {
    try {
      setLoadingDepartments(true)
      const departmentsData = await DepartmentService.getAll()
      setDepartments(departmentsData || [])
    } catch (error) {
      console.error('Error loading departments:', error)
    } finally {
      setLoadingDepartments(false)
    }
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.code.trim() || !formData.name.trim()) {
      return
    }
    if (formData.teamId === 0) {
      return
    }
    setIsSubmitting(true)
    try {
      await onCreateProject({
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        teamId: formData.teamId,
        memberIds: formData.selectionMode === "members" && formData.memberIds.length > 0 ? formData.memberIds : undefined,
        departmentId: formData.selectionMode === "department" && formData.departmentId ? formData.departmentId : undefined
      })
      setFormData({ code: "", name: "", description: "", teamId: 0, memberIds: [], departmentId: undefined, selectionMode: "team" })
      onClose()
    } catch (error) {
    } finally {
      setIsSubmitting(false)
    }
  }
  const toggleUserSelection = (userId: number) => {
    setFormData(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(userId)
        ? prev.memberIds.filter(id => id !== userId)
        : [...prev.memberIds, userId]
    }))
  }
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {editingProject ? 'Chỉnh sửa dự án' : 'Tạo dự án mới'}
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 block mb-2">
              Mã dự án <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ví dụ: PROJ-001"
              disabled={isSubmitting}
              maxLength={50}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Mã dự án duy nhất (tự động chuyển thành chữ hoa)
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 block mb-2">
              Tên dự án <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập tên dự án"
              disabled={isSubmitting}
              maxLength={200}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 block mb-2">
              Nhóm <span className="text-red-500">*</span>
            </label>
            {loadingTeams ? (
              <div className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-slate-500 dark:text-slate-400">Đang tải nhóm...</span>
              </div>
            ) : teams.length === 0 ? (
              <div className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                {userIsAdmin ? "Không có nhóm nào" : "Bạn chưa là trưởng nhóm của nhóm nào"}
              </div>
            ) : (
              <select
                required
                value={formData.teamId}
                onChange={(e) => setFormData({ ...formData, teamId: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                <option value={0}>Chọn nhóm...</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {userIsAdmin ? "Chọn nhóm để gán dự án này" : "Chọn nhóm mà bạn là trưởng nhóm"}
            </p>
          </div>
          
          {!editingProject && (
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100 block mb-2">
                Chọn thành viên cho dự án
              </label>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, selectionMode: "team", memberIds: [], departmentId: undefined }))}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.selectionMode === "team"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                  }`}
                >
                  Tự động (nhóm)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, selectionMode: "members", departmentId: undefined }))
                    if (users.length === 0) loadUsers()
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.selectionMode === "members"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                  }`}
                >
                  <Users className="w-4 h-4 inline mr-1" />
                  Chọn thành viên
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, selectionMode: "department", memberIds: [] }))
                    if (departments.length === 0) loadDepartments()
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.selectionMode === "department"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                  }`}
                >
                  <Building2 className="w-4 h-4 inline mr-1" />
                  Chọn phòng ban
                </button>
              </div>
              
              {formData.selectionMode === "members" && (
                <div className="border border-slate-300 dark:border-slate-600 rounded-lg p-3 max-h-60 overflow-y-auto bg-slate-50 dark:bg-slate-700">
                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                    </div>
                  ) : users.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Không có người dùng nào</p>
                  ) : (
                    <div className="space-y-2">
                      {users.map(user => (
                        <label key={user.id} className="flex items-center gap-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.memberIds.includes(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-slate-900 dark:text-slate-100">
                            {user.fullName || user.username} {user.email && `(${user.email})`}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {formData.selectionMode === "department" && (
                <div>
                  {loadingDepartments ? (
                    <div className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-slate-500 dark:text-slate-400">Đang tải phòng ban...</span>
                    </div>
                  ) : (
                    <select
                      value={formData.departmentId || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, departmentId: e.target.value ? Number(e.target.value) : undefined }))}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isSubmitting}
                    >
                      <option value="">Chọn phòng ban...</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name} ({dept.totalUsers} người)
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Tất cả thành viên trong phòng ban sẽ được thêm vào dự án
                  </p>
                </div>
              )}
              
              {formData.selectionMode === "team" && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Tất cả thành viên trong nhóm sẽ được tự động thêm vào dự án
                </p>
              )}
            </div>
          )}
          
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 block mb-2">
              Mô tả
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Nhập mô tả dự án (tùy chọn)"
              rows={4}
              disabled={isSubmitting}
              maxLength={1000}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.code.trim() || !formData.name.trim() || formData.teamId === 0}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {editingProject ? 'Đang cập nhật...' : 'Đang tạo...'}
                </>
              ) : (
                editingProject ? 'Cập nhật' : 'Tạo dự án'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}