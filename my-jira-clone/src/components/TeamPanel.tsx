import { useState, useEffect } from "react"
import { TaskDto } from "../interface/kanbanInterface"
import { Plus, Trash2, Loader2, Shield, ShieldCheck } from "lucide-react"
import { ProjectService } from "../service/project"
import { toast } from "sonner"
import AddMemberDialog from "./AddMemberDialog"
import { getStatusLabel } from "../helper/statusHelper"
import { hasRole, getUserId } from "../helper/auth"
import type { UserDto } from "../service/auth"
interface TeamPanelProps {
  projectId: number
  teamMembers: string[]
  setTeamMembers: (members: string[]) => void
  tasks: TaskDto[]
}
interface ProjectMember {
  id: number
  name: string
  email: string
  projectRole?: string | null
}
export default function TeamPanel({ projectId, teamMembers, setTeamMembers, tasks }: TeamPanelProps) {
  const [showAddMember, setShowAddMember] = useState(false)
  const [projectMembersData, setProjectMembersData] = useState<ProjectMember[]>([])
  const [loading, setLoading] = useState(false)
  const [projectDetail, setProjectDetail] = useState<any>(null)
  const [updatingRoles, setUpdatingRoles] = useState<Set<number>>(new Set())
  
  // Check if current user can manage roles (admin or project creator/leader)
  const canManageRoles = hasRole('system_admin') || hasRole('tong_giam_doc') || 
    (projectDetail && projectDetail.createdBy === getUserId())
  
  useEffect(() => {
    if (projectId) {
      loadProjectMembers()
    }
  }, [projectId, tasks])
  
  const loadProjectMembers = async () => {
    if (!projectId) return
    try {
      setLoading(true)
      // Load project detail to get team lead info
      const project = await ProjectService.getById(projectId)
      setProjectDetail(project)
      
      // Load project members
      const members = await ProjectService.getMembers(projectId)
      const membersList: ProjectMember[] = members.map((m: UserDto) => ({
        id: m.id,
        name: m.fullName || m.username || 'Unknown',
        email: m.email || '',
        projectRole: m.projectRole || null
      }))
      setProjectMembersData(membersList)
      setTeamMembers(membersList.map(m => m.name))
    } catch (error: any) {
      toast.error(error.message || 'Không thể tải thông tin thành viên dự án')
    } finally {
      setLoading(false)
    }
  }
  
  const handleToggleKeyMain = async (memberId: number, isKeyMain: boolean) => {
    if (!projectId) return
    
    setUpdatingRoles(prev => new Set(prev).add(memberId))
    try {
      if (isKeyMain) {
        await ProjectService.revokeKeyMain(projectId, memberId)
        toast.success('Đã thu hồi quyền keymain')
      } else {
        await ProjectService.grantKeyMain(projectId, memberId)
        toast.success('Đã cấp quyền keymain')
      }
      await loadProjectMembers()
    } catch (error: any) {
      toast.error(error.message || 'Không thể cập nhật quyền keymain')
    } finally {
      setUpdatingRoles(prev => {
        const newSet = new Set(prev)
        newSet.delete(memberId)
        return newSet
      })
    }
  }
  const handleAddMember = async (userId: number) => {
    if (!projectId) {
      toast.error('Không có project ID')
      return
    }
    try {
      await ProjectService.addMember(projectId, userId)
      toast.success('Đã thêm thành viên vào dự án')
      await loadProjectMembers()
    } catch (error: any) {
      throw error
    }
  }
  const handleRemoveMember = async (memberId: number) => {
    if (!projectId) return
    try {
      await ProjectService.removeMember(projectId, memberId)
      toast.success('Đã xóa thành viên khỏi dự án')
      await loadProjectMembers()
    } catch (error: any) {
      toast.error(error.message || 'Không thể xóa thành viên')
    }
  }
  const getMemberTasks = (memberId: number) => {
    return tasks.filter((task) => task.assigneeIds && task.assigneeIds.includes(memberId))
  }
  const getMemberTaskStats = (memberId: number) => {
    const memberTasks = getMemberTasks(memberId)
    return {
      total: memberTasks.length,
      completed: memberTasks.filter((t) => t.status === "done").length,
      inProgress: memberTasks.filter((t) => t.status === "in_progress").length,
    }
  }
  const getInitial = (text: string) => text.substring(0, 2).toUpperCase()
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Team Members</h3>
        <button
          onClick={() => setShowAddMember(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Member
        </button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-slate-500 dark:text-slate-400">Đang tải...</span>
        </div>
      ) : !projectId ? (
        <div className="text-center py-12">
          <p className="text-slate-500 dark:text-slate-400">Project chưa có ID</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectMembersData.map((member) => {
              const stats = getMemberTaskStats(member.id)
              const memberTasks = getMemberTasks(member.id)
              return (
                <div
                  key={member.id}
                  className="border border-slate-300 dark:border-slate-600 rounded-lg p-4 bg-white dark:bg-slate-800"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-sm font-semibold text-white">
                        {getInitial(member.name)}
                      </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100">{member.name}</h4>
                      {member.projectRole === 'keymain' && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          Key Main
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {member.projectRole === 'keymain' ? 'Member chính' : 'Project Member'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {canManageRoles && (
                    <button
                      onClick={() => handleToggleKeyMain(member.id, member.projectRole === 'keymain')}
                      disabled={updatingRoles.has(member.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        member.projectRole === 'keymain'
                          ? 'text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                      title={member.projectRole === 'keymain' ? 'Thu hồi quyền keymain' : 'Cấp quyền keymain'}
                    >
                      {updatingRoles.has(member.id) ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Shield className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Xóa thành viên khỏi dự án"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-2 pb-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Total Tasks</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{stats.total}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-slate-400">In Progress</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{stats.inProgress}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Completed</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">{stats.completed}</span>
                </div>
              </div>
              <div className="mt-4">
                <h5 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">
                  Assigned Tasks
                </h5>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {memberTasks.length > 0 ? (
                    memberTasks.map((task) => (
                      <div
                        key={task.id}
                        className="text-xs p-2 rounded bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 line-clamp-1"
                      >
                        {task.title}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">No tasks assigned</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {projectMembersData.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500 dark:text-slate-400 mb-4">Chưa có thành viên nào trong dự án</p>
          <button
            onClick={() => setShowAddMember(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            Thêm thành viên đầu tiên
          </button>
        </div>
      )}
      <AddMemberDialog
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        onAddMember={handleAddMember}
        existingMemberIds={projectMembersData.map(m => m.id)}
      />
        </>
      )}
    </div>
  )
}