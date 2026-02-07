import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import KanbanBoard from "../components/KanbanBoard"
import TaskDialog from "./TaskDialog"
import TaskDetailModal from "./TaskDetailModal"
import TeamPanel from "./TeamPanel"
import ActivityTimeline from "../components/ActivityTimeline"
import TaskListView from "./TaskListView"
import TaskTimelineChart from "./TaskTimelineChart"
import ContributionPieChart from "./ContributionPieChart"
import ProjectEvaluationsBoardView from "./ProjectEvaluation/ProjectEvaluationsBoardView"
import ProjectEvaluationsViewTab from "./ProjectEvaluation/ProjectEvaluationsViewTab"
import PowerBIDataSourceDialog from "./PowerBIDataSourceDialog"
import type { Activity } from "../interface/types"
import { Plus, Users, LayoutGrid, History, Loader2, List, BarChart3, Zap, Star, FileDown } from "lucide-react"
import QuickAddTask from "./QuickAddTask"
import SprintManagement, { Sprint } from "./SprintManagement"
import { BoardService, TaskService } from "../service"
import { ProjectService } from "../service/project"
import { ProjectEvaluationService } from "../service/projectEvaluation"
import { CommentService } from "../service/comment"
import { KanbanBoardDto, TaskDto } from "../interface/kanbanInterface"
import { toast } from "sonner"
import { getUserRoles, hasRole, getUserId } from "../helper/auth"
import { RoleGuard } from "./RoleGuard"
import { startOfMonth } from "date-fns"
interface ProjectDashboardProps {
  projectId: number
  projectName: string
  initialViewMode?: "board" | "list" | "team" | "activity" | "dashboard" | "sprint" | "evaluation"
  isSidebarOpen?: boolean
}
export default function ProjectDashboard({ projectId, projectName, initialViewMode, isSidebarOpen = true }: ProjectDashboardProps) {
  const userRoles = getUserRoles()
  const hasDashboardAccess = userRoles.some(role =>
    ["system_admin", "department_manager", "team_lead"].includes(role)
  )
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [initialTaskStatus, setInitialTaskStatus] = useState<string | undefined>(undefined)
  const [kanbanBoard, setKanbanBoard] = useState<KanbanBoardDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [teamMembers, setTeamMembers] = useState<string[]>([])
  const [teamId, setTeamId] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<"board" | "list" | "team" | "activity" | "dashboard" | "sprint" | "evaluation">(
    initialViewMode || (hasDashboardAccess ? "dashboard" : "board")
  )
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskDto | null>(null)
  const [showPowerBIExport, setShowPowerBIExport] = useState(false)
  const [sprints, setSprints] = useState<Sprint[]>(() => {
    const saved = localStorage.getItem(`sprints_${projectId}`)
    return saved ? JSON.parse(saved) : []
  })
  const [selectedParentForSubtask, setSelectedParentForSubtask] = useState<number | null>(null)
  const [selectedAssignee, setSelectedAssignee] = useState<string>("all")
  const [selectedMainTask, setSelectedMainTask] = useState<number | "all">("all")
  const navigate = useNavigate()
  const [activityLog, setActivityLog] = useState<Activity[]>([])
  const [project, setProject] = useState<any>(null)
  const [evaluationStatus, setEvaluationStatus] = useState<any>(null)
  const [projectMembers, setProjectMembers] = useState<number[]>([])
  const [showEvaluationModal, setShowEvaluationModal] = useState(false)
  const timelineMonth = useMemo(() => startOfMonth(new Date()), [])
  
  // Check if user is leader
  const isLeader = hasRole('team_lead') || hasRole('system_admin') || 
    (project && project.createdBy === getUserId())
  
  // Check if user is project member (from project team or added as member)
  const currentUserId = getUserId()
  const isProjectMember = projectMembers.length > 0 && currentUserId && projectMembers.includes(currentUserId)
  
  // Check if project is completed and readonly
  // When isCompleted = true, project is readonly for non-leaders
  const isProjectCompleted = project?.isCompleted === true
  const isReadOnly = isProjectCompleted && !isLeader
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const projectData = await ProjectService.getById(projectId)
        setProject(projectData)
        setTeamId(projectData.teamId)
        
        // Load project members
        try {
          const members = await ProjectService.getMembers(projectId)
          const memberIds = members.map((m: any) => m.id)
          setProjectMembers(memberIds)
        } catch (error) {
          console.error("Error loading project members:", error)
        }
        
        // Load evaluation status if project is completed
        if (projectData.isCompleted) {
          try {
            const evalStatus = await ProjectEvaluationService.getEvaluationStatus(projectId)
            setEvaluationStatus(evalStatus)
            
            // Check if user needs to evaluate
            // Member from different team (not project member) must evaluate
            const userIsLeader = hasRole('team_lead') || hasRole('system_admin') || 
              (projectData.createdBy === getUserId())
            const userId = getUserId()
            const isMember = userId && projectMembers.includes(userId)
            
            if (evalStatus && evalStatus.requiresEvaluation && !evalStatus.hasEvaluated) {
              // Project leader doesn't need to evaluate
              // Only non-leader members from different team need to evaluate
              if (!userIsLeader && !isMember) {
                // Show modal/toast and redirect
                toast.error("Bạn cần đánh giá dự án này trước khi xem board", {
                  duration: 5000,
                  action: {
                    label: "Đi đến đánh giá",
                    onClick: () => navigate(`/projects/${projectId}/evaluation`)
                  }
                })
                setTimeout(() => {
                  navigate(`/projects/${projectId}/evaluation`)
                }, 2000)
                return
              }
            }
          } catch (error) {
            console.error("Error loading evaluation status:", error)
          }
        }
        
        const board = await TaskService.getKanban(projectId)
        setKanbanBoard(board)
        const members = new Set<string>()
        board.columns.forEach(col => {
          col.tasks.forEach(task => {
            task.assigneeNames.forEach(name => members.add(name))
          })
        })
        setTeamMembers(Array.from(members))
        generateActivities(board)
      } catch (error: any) {
        toast.error(error.message || 'Không thể tải dữ liệu')
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [projectId, navigate])
  const generateActivities = async (board: KanbanBoardDto) => {
    const activities: Activity[] = []
    for (const col of board.columns) {
      for (const task of col.tasks) {
        activities.push({
          id: task.id,
          type: 'task_created',
          user: task.createdByName || 'Unknown',
          description: `Created task "${task.title}"`,
          timestamp: new Date(task.createdAt)
        })
        if (task.updatedAt && task.updatedAt !== task.createdAt) {
          activities.push({
            id: task.id * 1000,
            type: 'task_updated',
            user: task.createdByName || 'Unknown',
            description: `Updated task "${task.title}"`,
            timestamp: new Date(task.updatedAt)
          })
        }
        if (task.status === 'done') {
          activities.push({
            id: task.id * 2000,
            type: 'task_completed',
            user: task.createdByName || 'Unknown',
            description: `Completed task "${task.title}"`,
            timestamp: new Date(task.updatedAt || task.createdAt)
          })
        }
        try {
          const comments = await CommentService.getAll(projectId, task.id)
          comments.forEach((comment) => {
            activities.push({
              id: task.id * 3000 + comment.id,
              type: 'task_updated',
              user: comment.fullName || comment.username || 'Unknown',
              description: `Commented on task "${task.title}": ${comment.content.substring(0, 50)}${comment.content.length > 50 ? '...' : ''}`,
              timestamp: new Date(comment.createdAt)
            })
          })
        } catch (error) {
        }
      }
    }
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    setActivityLog(activities)
  }
  const allTasks: TaskDto[] = useMemo(() => {
    if (!kanbanBoard) return []
    const map = new Map<number, TaskDto>()
    kanbanBoard.columns.forEach(col => {
      col.tasks.forEach(task => {
        map.set(task.id, task)
      })
    })
    return Array.from(map.values())
  }, [kanbanBoard])
  const taskHierarchy: TaskWithChildren[] = useMemo(() => {
    if (allTasks.length === 0) return []
    const subtasksByParent = allTasks.reduce((acc, task) => {
      if (task.parentTaskId) {
        if (!acc[task.parentTaskId]) {
          acc[task.parentTaskId] = []
        }
        acc[task.parentTaskId].push(task)
      }
      return acc
    }, {} as Record<number, TaskDto[]>)
    return allTasks
      .filter(task => !task.parentTaskId)
      .map(mainTask => ({
        mainTask,
        subtasks: subtasksByParent[mainTask.id] || []
      }))
  }, [allTasks])
  const assigneeOptions = useMemo(() => {
    const set = new Set<string>()
    taskHierarchy.forEach(({ mainTask, subtasks }) => {
      mainTask.assigneeNames.forEach(name => name && set.add(name))
      subtasks.forEach(sub => sub.assigneeNames.forEach(name => name && set.add(name)))
    })
    return Array.from(set)
  }, [taskHierarchy])
  const filteredHierarchy = useMemo(() => {
    return taskHierarchy.filter(({ mainTask, subtasks }) => {
      const matchesMain = selectedMainTask === "all" || mainTask.id === selectedMainTask
      if (!matchesMain) return false
      if (selectedAssignee === "all") return true
      if (mainTask.assigneeNames.includes(selectedAssignee)) return true
      return subtasks.some(sub => sub.assigneeNames.includes(selectedAssignee))
    })
  }, [taskHierarchy, selectedAssignee, selectedMainTask])
  const filteredTasks = useMemo(() => {
    const tasks = filteredHierarchy.flatMap(item => [item.mainTask, ...item.subtasks])
    const map = new Map<number, TaskDto>()
    tasks.forEach(task => map.set(task.id, task))
    return Array.from(map.values())
  }, [filteredHierarchy])
  const hasFilter = selectedAssignee !== "all" || selectedMainTask !== "all"
  const statusSummary = useMemo(() => {
    const source = hasFilter ? filteredTasks : allTasks
    const total = source.length || 1
    const statuses = [
      { key: "todo", label: "Cần làm", bg: "bg-slate-100 dark:bg-slate-800/60", text: "text-slate-700 dark:text-slate-200" },
      { key: "in_progress", label: "Đang làm", bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-700 dark:text-blue-200" },
      { key: "review", label: "Đang kiểm tra", bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-200" },
      { key: "done", label: "Đã hoàn thành", bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-200" },
    ]
    const items = statuses.map(status => {
      const value = source.filter(task => task.status === status.key).length
      const percentage = Math.round((value / total) * 100)
      return { ...status, value, percentage: Number.isNaN(percentage) ? 0 : percentage }
    })
    const overdue = source.filter(task => task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done").length
    return { items, overdue }
  }, [hasFilter, filteredTasks, allTasks])
  const handleAddTask = async (newTask: any) => {
    if (isProjectCompleted && !isLeader) {
      toast.error('Dự án đã hoàn thành, không thể thêm task mới')
      return
    }
    try {
      const userId = parseInt(localStorage.getItem('userId') || '1')
      await TaskService.create(projectId, {
        title: newTask.title,
        description: newTask.description,
        status: newTask.status || 'todo',
        priority: newTask.priority || 'medium',
        dueDate: newTask.dueDate,
        createdBy: userId,
        parentTaskId: newTask.parentTaskId,
        assigneeIds: newTask.assigneeIds || [],
        images: newTask.images && newTask.images.length > 0 ? newTask.images : undefined,
        files: newTask.files && newTask.files.length > 0 ? newTask.files : undefined,
      })
      toast.success('Tạo task thành công')
      setIsDialogOpen(false)
      setSelectedParentForSubtask(null)
      const board = await TaskService.getKanban(projectId)
      setKanbanBoard(board)
      await generateActivities(board)
    } catch (error: any) {
      toast.error(error.message || 'Không thể tạo task')
    }
  }
  const handleTaskMove = async (
    taskId: number,
    newStatus: TaskDto['status'],
    position: number,
    columnId?: number
  ) => {
    if (isProjectCompleted && !isLeader) {
      toast.error('Dự án đã hoàn thành, không thể chỉnh sửa task')
      return
    }
    try {
      const userId = parseInt(localStorage.getItem('userId') || '1')
      let updated = false
      if (columnId) {
        try {
          await BoardService.updateTaskPosition({ taskId, columnId, position })
          updated = true
        } catch (error) {
          updated = false
        }
      }
      if (!updated) {
        await TaskService.updateStatus(projectId, taskId, newStatus, userId)
      }
      const board = await TaskService.getKanban(projectId)
      setKanbanBoard(board)
      await generateActivities(board)
    } catch (error: any) {
      toast.error(error.message || 'Không thể di chuyển task')
    }
  }
  const handleQuickAddTask = async (task: { title: string; priority: string; dueDate?: string }) => {
    const userId = parseInt(localStorage.getItem('userId') || '1')
    await TaskService.create(projectId, {
      title: task.title,
      priority: task.priority,
      dueDate: task.dueDate,
      createdBy: userId,
      status: 'todo',
    })
    toast.success('Tạo task thành công')
    const board = await TaskService.getKanban(projectId)
    setKanbanBoard(board)
    await generateActivities(board)
  }
  const saveSprints = (newSprints: Sprint[]) => {
    setSprints(newSprints)
    localStorage.setItem(`sprints_${projectId}`, JSON.stringify(newSprints))
  }
  const handleCreateSprint = (sprint: Omit<Sprint, "id" | "createdAt">) => {
    const newSprint: Sprint = {
      ...sprint,
      id: `sprint_${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    saveSprints([...sprints, newSprint])
    toast.success('Tạo sprint thành công')
  }
  const handleUpdateSprint = (sprint: Sprint) => {
    saveSprints(sprints.map(s => s.id === sprint.id ? sprint : s))
    toast.success('Cập nhật sprint thành công')
  }
  const handleDeleteSprint = (sprintId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa sprint này?')) {
      saveSprints(sprints.filter(s => s.id !== sprintId))
      toast.success('Đã xóa sprint')
    }
  }
  const handleStartSprint = (sprintId: string) => {
    saveSprints(sprints.map(s => ({
      ...s,
      status: s.id === sprintId ? 'active' as const : s.status === 'active' ? 'planning' as const : s.status
    })))
    toast.success('Đã bắt đầu sprint')
  }
  const handleCompleteSprint = (sprintId: string) => {
    saveSprints(sprints.map(s => s.id === sprintId ? { ...s, status: 'completed' as const } : s))
    toast.success('Đã hoàn thành sprint')
  }
  const handleAddTaskToSprint = (sprintId: string, taskId: number) => {
    saveSprints(sprints.map(s => 
      s.id === sprintId 
        ? { ...s, taskIds: [...s.taskIds, taskId] }
        : s
    ))
    toast.success('Đã thêm task vào sprint')
  }
  const handleRemoveTaskFromSprint = (sprintId: string, taskId: number) => {
    saveSprints(sprints.map(s => 
      s.id === sprintId 
        ? { ...s, taskIds: s.taskIds.filter(id => id !== taskId) }
        : s
    ))
    toast.success('Đã xóa task khỏi sprint')
  }
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        setShowQuickAdd(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Đang tải board...</span>
      </div>
    )
  }
  if (!kanbanBoard) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy board</h2>
        </div>
      </div>
    )
  }
  return (
    <div className="flex flex-col h-full">
      <div className={`p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 ${!isSidebarOpen ? 'pl-16' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{projectName}</h2>
          </div>
          <RoleGuard roles={['system_admin', 'department_manager', 'team_lead']}>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowQuickAdd(true)}
                className="flex items-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="Ctrl+N"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Thêm nhanh</span>
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-xs bg-slate-200 dark:bg-slate-600 rounded">
                  Ctrl+N
                </kbd>
              </button>
              <button
                onClick={() => {
                  setInitialTaskStatus(undefined)
                  setIsDialogOpen(true)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Thêm công việc
              </button>
            </div>
          </RoleGuard>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setViewMode("board")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
              viewMode === "board"
                ? "bg-blue-600 text-white"
                : "text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Bảng
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
              viewMode === "list"
                ? "bg-blue-600 text-white"
                : "text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            <List className="w-4 h-4" />
            Danh sách
          </button>
          <button
            onClick={() => setViewMode("dashboard")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
              viewMode === "dashboard"
                ? "bg-blue-600 text-white"
                : "text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Bảng điều khiển
          </button>
          <button
            onClick={() => setViewMode("team")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
              viewMode === "team"
                ? "bg-blue-600 text-white"
                : "text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            <Users className="w-4 h-4" />
            Nhóm
          </button>
          <button
            onClick={() => setViewMode("sprint")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
              viewMode === "sprint"
                ? "bg-purple-600 text-white"
                : "text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            <Zap className="w-4 h-4" />
            Sprint
          </button>
          <button
            onClick={() => setViewMode("activity")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
              viewMode === "activity"
                ? "bg-blue-600 text-white"
                : "text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            <History className="w-4 h-4" />
            Hoạt động
          </button>
          <button
            onClick={() => setShowPowerBIExport(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 border border-gray-300 dark:border-slate-600"
            title="Xuất dữ liệu Power BI"
          >
            <FileDown className="w-4 h-4" />
            Xuất Excel Power BI
          </button>
          <button
            onClick={() => setViewMode("evaluation")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
              viewMode === "evaluation"
                ? "bg-purple-600 text-white dark:bg-purple-600"
                : "text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            <Star className="w-4 h-4" />
            Đánh giá
          </button>
        </div>
      </div>
      {viewMode === "dashboard" && (
        <div className="px-6 pb-2">
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                Lọc theo người phụ trách
              </label>
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả</option>
                {assigneeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                Lọc theo task chính
              </label>
              <select
                value={selectedMainTask}
                onChange={(e) =>
                  setSelectedMainTask(e.target.value === "all" ? "all" : Number(e.target.value))
                }
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả</option>
                {taskHierarchy.map(({ mainTask }) => (
                  <option key={mainTask.id} value={mainTask.id}>
                    {mainTask.key} - {mainTask.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-900">
        {viewMode === "board" ? (
          <KanbanBoard
            columns={kanbanBoard.columns}
            onTaskMove={handleTaskMove}
            onTaskClick={(task) => {
              setSelectedTask(task)
            }}
            onAddTask={(status) => {
              setInitialTaskStatus(status)
              setIsDialogOpen(true)
            }}
          />
        ) : viewMode === "list" ? (
          <div className="p-6">
            <TaskListView
              tasks={allTasks}
              onTaskClick={(task) => {
                setSelectedTask(task)
              }}
              onAddSubtask={(taskId) => {
                setSelectedParentForSubtask(taskId)
                setIsDialogOpen(true)
              }}
            />
          </div>
        ) : viewMode === "dashboard" ? (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {statusSummary.items.map((item) => (
                <div
                  key={item.key}
                  className={`${item.bg} ${item.text} rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm`}
                >
                  <div className="text-xs uppercase font-semibold tracking-wide opacity-70">
                    {item.label}
                  </div>
                  <div className="mt-2 text-2xl font-bold">{item.value}</div>
                  <div className="text-xs opacity-70 mt-1">
                    {item.percentage}% tổng số task
                  </div>
                </div>
              ))}
              <div className="bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-200 rounded-xl border border-rose-200 dark:border-rose-800 p-4 shadow-sm">
                <div className="text-xs uppercase font-semibold tracking-wide opacity-80">
                  Quá hạn
                </div>
                <div className="mt-2 text-2xl font-bold">{statusSummary.overdue}</div>
                <div className="text-xs opacity-70 mt-1">
                  Task cần ưu tiên xử lý
                </div>
              </div>
            </div>
            <ContributionPieChart
              tasks={hasFilter ? filteredTasks : allTasks}
            />
            <TaskTimelineChart
              data={hasFilter ? filteredHierarchy : taskHierarchy}
              month={timelineMonth}
            />
            <div className="grid grid-cols-1">
              <TaskListView
                tasks={(hasFilter ? filteredHierarchy : taskHierarchy).flatMap(item => [item.mainTask, ...item.subtasks])}
                onTaskClick={(task) => {
                  setSelectedTask(task)
                }}
                onAddSubtask={(taskId) => {
                  setSelectedParentForSubtask(taskId)
                  setIsDialogOpen(true)
                }}
              />
            </div>
          </div>
        ) : viewMode === "sprint" ? (
          <div className="p-6">
            <SprintManagement
              sprints={sprints}
              tasks={allTasks}
              onCreateSprint={handleCreateSprint}
              onUpdateSprint={handleUpdateSprint}
              onDeleteSprint={handleDeleteSprint}
              onStartSprint={handleStartSprint}
              onCompleteSprint={handleCompleteSprint}
              onAddTaskToSprint={handleAddTaskToSprint}
              onRemoveTaskFromSprint={handleRemoveTaskFromSprint}
            />
          </div>
        ) : viewMode === "team" ? (
          <TeamPanel 
            projectId={projectId}
            teamMembers={teamMembers} 
            setTeamMembers={setTeamMembers} 
            tasks={allTasks} 
          />
        ) : viewMode === "evaluation" ? (
          <div className="p-6">
            <ProjectEvaluationsViewTab projectId={projectId} />
          </div>
        ) : (
          <ActivityTimeline activities={activityLog} />
        )}
      </div>
      <TaskDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          setSelectedParentForSubtask(null)
          setInitialTaskStatus(undefined)
        }}
        onAddTask={handleAddTask}
        teamMembers={teamMembers}
        initialStatus={initialTaskStatus}
        parentOptions={taskHierarchy.map(({ mainTask }) => ({
          id: mainTask.id,
          title: mainTask.title,
          key: mainTask.key,
        }))}
        defaultParentId={selectedParentForSubtask}
        />
      <QuickAddTask
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onSubmit={handleQuickAddTask}
      />
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          projectId={projectId}
          onClose={() => {
            setSelectedTask(null)
          }}
          onUpdate={async () => {
            try {
              const board = await TaskService.getKanban(projectId)
              setKanbanBoard(board)
              await generateActivities(board)
              const updatedTask = board.columns
                .flatMap(col => col.tasks)
                .find(t => t.id === selectedTask.id)
              if (updatedTask) {
                setSelectedTask(updatedTask)
              }
            } catch (error: any) {
              console.error('Error reloading board:', error)
            }
          }}
        />
      )}

      {/* Power BI Data Source Dialog */}
      <PowerBIDataSourceDialog
        isOpen={showPowerBIExport}
        onClose={() => setShowPowerBIExport(false)}
        projectId={projectId}
      />
    </div>
  )
}