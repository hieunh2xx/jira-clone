import { useMemo, useState } from "react"
import { ChevronDown, ChevronRight, CheckCircle2, Circle, Calendar, Plus, GitBranch } from "lucide-react"
import { TaskDto } from "../interface/kanbanInterface"
import { differenceInCalendarDays, format } from "date-fns"
interface TaskListViewProps {
  tasks: TaskDto[]
  onTaskClick?: (task: TaskDto) => void
  onTaskReassign?: (taskId: number, newAssigneeId: number) => void
  onAddSubtask?: (parentTaskId: number) => void
}
export default function TaskListView({ tasks, onTaskClick, onTaskReassign, onAddSubtask }: TaskListViewProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set())
  const { mainTasks, subtasksByParent } = useMemo(() => {
    const main = tasks.filter(task => !task.parentTaskId)
    const subMap = tasks
      .filter(task => task.parentTaskId)
      .reduce((acc, task) => {
        const parentId = task.parentTaskId!
        if (!acc[parentId]) {
          acc[parentId] = []
        }
        acc[parentId].push(task)
        return acc
      }, {} as Record<number, TaskDto[]>)
    return { mainTasks: main, subtasksByParent: subMap }
  }, [tasks])
  const toggleExpand = (taskId: number) => {
    const newExpanded = new Set(expandedTasks)
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId)
    } else {
      newExpanded.add(taskId)
    }
    setExpandedTasks(newExpanded)
  }
  const getTaskProgress = (task: TaskDto): { completed: number; total: number; percentage: number } => {
    const subtasks = subtasksByParent[task.id] || []
    if (subtasks.length === 0) {
      return {
        completed: task.status === 'done' ? 1 : 0,
        total: 1,
        percentage: task.status === 'done' ? 100 : 0
      }
    }
    const completed = subtasks.filter(st => st.status === 'done').length
    const total = subtasks.length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
    return { completed, total, percentage }
  }
  const renderOverdueBadge = (task: TaskDto) => {
    if (!task.dueDate || task.status === 'done') return null
    const due = new Date(task.dueDate)
    const now = new Date()
    if (due < now) {
      const overdueDays = Math.abs(differenceInCalendarDays(now, due))
      return (
        <span className="text-xs font-semibold text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-200 px-2 py-0.5 rounded-full">
          Quá hạn {overdueDays} ngày
        </span>
      )
    }
    return (
      <span className="text-xs text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-200 px-2 py-0.5 rounded-full">
        Đúng tiến độ
      </span>
    )
  }
  const renderDuration = (task: TaskDto) => {
    const createdAt = task.createdAt ? new Date(task.createdAt) : null
    if (!createdAt) return null
    const now = new Date()
    const end = task.dueDate ? new Date(task.dueDate) : now
    const elapsed = Math.max(differenceInCalendarDays(now, createdAt) + 1, 0)
    const plannedRaw = task.dueDate ? differenceInCalendarDays(end, createdAt) + 1 : 0
    const planned = plannedRaw > 0 ? plannedRaw : null
    return (
      <span className="text-xs text-slate-500 dark:text-slate-400">
        Đã thực hiện {elapsed} ngày{planned !== null ? ` / Kế hoạch ${planned}` : ''}
      </span>
    )
  }
  return (
    <div className="space-y-2">
      {mainTasks.map((task) => {
        const subtasks = subtasksByParent[task.id] || []
        const hasSubtasks = subtasks.length > 0
        const isExpanded = expandedTasks.has(task.id)
        const progress = getTaskProgress(task)
        return (
          <div key={task.id} className="border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800">
            <div
              className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
              onClick={() => onTaskClick?.(task)}
            >
              <div className="flex items-start gap-3">
                {hasSubtasks && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleExpand(task.id)
                    }}
                    className="mt-0.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                )}
                {!hasSubtasks && <div className="w-4" />}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-medium text-blue-600">#{task.key}</span>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">{task.title}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      task.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      task.priority === 'low' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {task.priority}
                    </span>
                    {renderOverdueBadge(task)}
                    {onAddSubtask && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onAddSubtask?.(task.id)
                        }}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100 font-medium px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Thêm task con
                      </button>
                    )}
                  </div>
                  {hasSubtasks && (
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              progress.percentage === 100
                                ? 'bg-green-500'
                                : progress.percentage >= 50
                                ? 'bg-blue-500'
                                : 'bg-yellow-500'
                            }`}
                            style={{ width: `${progress.percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          {progress.completed}/{progress.total} hoàn thành ({progress.percentage}%)
                        </span>
                      </div>
                    </div>
                  )}
                  {!hasSubtasks && (
                    <div className="flex items-center gap-2 mt-2">
                      {task.status === 'done' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-400" />
                      )}
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        {task.status === 'done' ? 'Đã hoàn thành' : 'Chưa hoàn thành'}
                      </span>
                      {renderDuration(task)}
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-2">
                    {task.assigneeNames.length > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="flex -space-x-1">
                          {task.assigneeNames.slice(0, 3).map((name, i) => (
                            <div
                              key={i}
                              className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center border border-white"
                              title={name}
                            >
                              {name[0]?.toUpperCase() || ''}
                            </div>
                          ))}
                        </div>
                        <span className="text-xs text-slate-600 dark:text-slate-400 ml-1">
                          {task.assigneeNames.join(', ')}
                        </span>
                      </div>
                    )}
                    {task.dueDate && (
                      <div className={`flex items-center gap-1 text-xs ${
                        new Date(task.dueDate) < new Date() && task.status !== 'done'
                          ? 'text-red-600 font-semibold'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}>
                        <Calendar className="w-3 h-3" />
                        <span>Hạn: {format(new Date(task.dueDate), 'dd/MM/yyyy')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {hasSubtasks && isExpanded && (
              <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                {subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="p-3 pl-12 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors border-b border-slate-200 dark:border-slate-700 last:border-b-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      onTaskClick?.(subtask)
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {subtask.status === 'done' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-400" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <GitBranch className="w-3 h-3 text-blue-600" aria-label="Subtask" />
                          <span className="text-xs font-medium text-blue-600">#{subtask.key}</span>
                          <span className="text-sm text-slate-900 dark:text-slate-100">{subtask.title}</span>
                          <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                            Subtask
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            {subtask.assigneeNames.length > 0 && (
                              <span className="text-xs text-slate-600 dark:text-slate-400">
                                {subtask.assigneeNames.join(', ')}
                              </span>
                            )}
                            {renderOverdueBadge(subtask)}
                            {renderDuration(subtask)}
                          </div>
                          {subtask.dueDate && (
                            <span className={`text-xs ${
                              new Date(subtask.dueDate) < new Date() && subtask.status !== 'done'
                                ? 'text-red-600 font-semibold'
                                : 'text-slate-600 dark:text-slate-400'
                            }`}>
                              Hạn: {format(new Date(subtask.dueDate), 'dd/MM/yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}