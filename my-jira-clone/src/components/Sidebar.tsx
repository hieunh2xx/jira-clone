import type { Project } from "../interface/types"
import { BarChart3, Settings, Users, Plus, LogOut, Shield, Trash2, ChevronDown, ChevronUp, FolderKanban, Sun, Calendar, Mail, Menu, X, ChevronLeft } from "lucide-react"
import { 
  canManageTeam, 
  canCreateProject, 
  isAdmin, 
  canManageDepartment,
  getUserFullName,
  getUserRoles,
  logout,
  hasRole,
  canDeleteProject
} from "../helper/auth"
import { RoleGuard } from "./RoleGuard"
import AddUserDialog from "./AddUserDialog"
import EmailNotificationSettings from "./EmailNotificationSettings"
import NotificationBell from "./NotificationBell"
import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { ProjectService } from "../service/project"
import { toast } from "sonner"
interface SidebarProps {
  projects: Project[]
  selectedProject: number
  setSelectedProject: (id: number) => void
  onCreateProject?: () => void
  onProjectDeleted?: () => void
  departments?: string[]
  selectedDepartment?: string | null
  onDepartmentChange?: (department: string | null) => void
  disableNavigation?: boolean
  isOpen?: boolean
  onToggleSidebar?: () => void
}
export default function Sidebar({ 
  projects, 
  selectedProject, 
  setSelectedProject, 
  onCreateProject,
  onProjectDeleted,
  departments = [],
  selectedDepartment,
  onDepartmentChange,
  disableNavigation = false,
  isOpen = true,
  onToggleSidebar
}: SidebarProps) {
  const userRoles = getUserRoles()
  const fullName = getUserFullName()
  const [showAddUser, setShowAddUser] = useState(false)
  const [showEmailSettings, setShowEmailSettings] = useState(false)
  const [hoveredProjectId, setHoveredProjectId] = useState<number | null>(null)
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)
  const isLeader = hasRole('team_lead')
  const userIsAdmin = isAdmin()
  const navigate = useNavigate()
  const location = useLocation()
  const shouldNavigate = 
    !location.pathname.includes('/task/') &&
    (location.pathname === '/board' || 
     location.pathname === '/dashboard/users' ||
     location.pathname.startsWith('/board/') ||
     location.pathname === '/users' ||
     location.pathname === '/departments' ||
     location.pathname === '/teams' ||
     location.pathname === '/projects')
  const handleDeleteProject = async (projectId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa dự án này?')) {
      return
    }
    try {
      await ProjectService.delete(projectId)
      toast.success('Đã xóa dự án thành công')
      onProjectDeleted?.()
      if (selectedProject === projectId && projects.length > 1) {
        const remainingProjects = projects.filter(p => p.id !== projectId)
        if (remainingProjects.length > 0) {
          setSelectedProject(remainingProjects[0].id)
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Không thể xóa dự án')
    }
  }
  return (
    <aside className={`${isOpen ? 'w-64' : 'w-0'} bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300 ease-in-out overflow-hidden`}>
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 relative">
        <div className="flex items-center gap-2 mb-4 justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">QL công việc</h1>
          </div>
          <div className="flex items-center gap-2 relative z-50">
            <NotificationBell />
            <button
              onClick={onToggleSidebar}
              className="p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors flex-shrink-0"
              title="Ẩn sidebar"
              aria-label="Ẩn sidebar"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
        {fullName && (
          <div className="text-sm text-slate-600 dark:text-slate-400">
            <div className="font-medium text-slate-900 dark:text-slate-100">{fullName}</div>
            <div className="text-xs mt-1">
              {userRoles.map(role => (
                <span key={role} className="inline-block mr-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                  {role.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-auto p-4">
        {userIsAdmin && departments.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm"
            >
              <span className="font-medium">Lọc dự án</span>
              {isFilterExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {isFilterExpanded && (
              <div className="mt-2 px-3">
                <select
                  value={selectedDepartment || 'all'}
                  onChange={(e) => onDepartmentChange?.(e.target.value === 'all' ? null : e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">Tất cả phòng ban</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase px-2">Dự án</h3>
          <RoleGuard roles={['system_admin', 'department_manager', 'team_lead']}>
            {onCreateProject && (
              <button
                onClick={onCreateProject}
                className="p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                title="Tạo dự án"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </RoleGuard>
        </div>
        <nav className="space-y-2">
          {projects.map((project) => (
            <div
              key={project.id}
              className="relative group"
              onMouseEnter={() => setHoveredProjectId(project.id)}
              onMouseLeave={() => setHoveredProjectId(null)}
            >
              <button
                onClick={() => {
                  setSelectedProject(project.id);
                  if (shouldNavigate) {
                    navigate('/board', { state: { selectedProjectId: project.id } })
                  }
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedProject === project.id
                    ? "bg-blue-600 text-white"
                    : "text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{project.name}</div>
                    <div className={`text-xs ${selectedProject === project.id ? 'opacity-90' : 'opacity-75'}`}>
                      {project.tasks?.length || 0} công việc
                    </div>
                  </div>
                  {(isLeader || canDeleteProject()) && hoveredProjectId === project.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteProject(project.id)
                      }}
                      className={`p-1 rounded transition-colors ${
                        selectedProject === project.id
                          ? "text-white hover:bg-blue-700"
                          : "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      }`}
                      title="Xóa dự án"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </button>
            </div>
          ))}
        </nav>
      </div>
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
        <button
          onClick={() => navigate('/my-day')}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800"
        >
          <Sun className="w-4 h-4 text-amber-600" />
          <span className="text-amber-700 dark:text-amber-300">My Day</span>
        </button>
        <button
          onClick={() => navigate('/dashboard/users')}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
            location.pathname === '/dashboard/users'
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          {userIsAdmin || isLeader || hasRole('department_manager') ? 'Dashboard nhân viên' : 'Tasks của tôi'}
        </button>
        <RoleGuard roles={['system_admin']}>
          <button 
            onClick={() => navigate('/users')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
              location.pathname === '/users'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            Quản lý người dùng
          </button>
        </RoleGuard>
        <RoleGuard roles={['system_admin', 'team_lead']}>
          <button 
            onClick={() => navigate('/projects')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
              location.pathname === '/projects'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            Quản lý dự án
          </button>
        </RoleGuard>
        <RoleGuard roles={['system_admin', 'department_manager', 'team_lead']}>
          <button 
            onClick={() => navigate('/teams')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
              location.pathname === '/teams'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            Quản lý nhóm
          </button>
        </RoleGuard>
        <RoleGuard roles={['system_admin', 'department_manager']}>
          <button 
            onClick={() => navigate('/departments')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
              location.pathname === '/departments'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Shield className="w-4 h-4" />
            Quản lý phòng ban
          </button>
        </RoleGuard>
        <button 
          onClick={() => setShowEmailSettings(true)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm"
        >
          <Mail className="w-4 h-4" />
          Thông báo Email
        </button>
        <RoleGuard roles={['system_admin']}>
          <button 
            onClick={() => navigate('/system-settings')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
              location.pathname === '/system-settings'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Settings className="w-4 h-4" />
            Cài đặt hệ thống
          </button>
        </RoleGuard>
        <AddUserDialog
          isOpen={showAddUser}
          onClose={() => setShowAddUser(false)}
          onUserAdded={() => {
          }}
        />
        <EmailNotificationSettings
          isOpen={showEmailSettings}
          onClose={() => setShowEmailSettings(false)}
        />
        <button 
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm mt-4"
        >
          <LogOut className="w-4 h-4" />
          Đăng xuất
        </button>
      </div>
    </aside>
  )
}