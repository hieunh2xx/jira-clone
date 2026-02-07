import { useMemo, useState, useRef, useEffect } from "react"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay } from "date-fns"
import { vi } from "date-fns/locale"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react"
import { UserTaskTimeline } from "./UserTaskTimelineChart"
interface GanttTaskData {
  userId: number
  userName: string
  tasks: UserTaskTimeline[]
}
interface GanttChartProps {
  data: GanttTaskData[]
  onTaskClick?: (task: UserTaskTimeline) => void
  selectedDate?: Date
}
const STATUS_COLOR: Record<string, string> = {
  todo: "#9CA3AF",
  in_progress: "#3B82F6",
  review: "#F59E0B",
  fix: "#F97316",
  done: "#10B981",
}
const DAY_WIDTH = 100
export default function GanttChart({ data, onTaskClick, selectedDate }: GanttChartProps) {
  const [currentWeek, setCurrentWeek] = useState(selectedDate || new Date())
  const [zoomLevel, setZoomLevel] = useState(1)
  const [expandedUsers, setExpandedUsers] = useState<Set<number>>(new Set())
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const today = selectedDate || new Date()
  const getDueAlert = (task: UserTaskTimeline) => {
    if (task.status === "done") return null
    if (task.isOverdue) return "overdue"
    if (task.isDueSoon) return "dueSoon"
    if (!task.dueDate) return null
    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const dueDate = new Date(task.dueDate)
    dueDate.setHours(0, 0, 0, 0)
    const diffDays = Math.floor((dueDate.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000))
    if (diffDays < 0) return "overdue"
    if (diffDays <= 3) return "dueSoon"
    return null
  }
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 })
  const startDate = weekStart
  const endDate = weekEnd
  const allDays = eachDayOfInterval({ start: startDate, end: endDate })
  const weekDays = useMemo(() => {
    return [allDays]
  }, [allDays])
  const allTasksWithUser = useMemo(() => {
    const result: Array<UserTaskTimeline & { userId: number; userName: string; userIndex: number; taskIndex: number }> = []
    data.forEach((userData, userIndex) => {
      userData.tasks.forEach((task, taskIndex) => {
        result.push({
          ...task,
          userId: userData.userId,
          userName: userData.userName,
          userIndex,
          taskIndex
        })
      })
    })
    return result
  }, [data])
  const dayWidth = DAY_WIDTH * zoomLevel
  const totalWidth = allDays.length * dayWidth
  const getTaskPosition = (task: UserTaskTimeline) => {
    const taskStart = new Date(task.createdAt)
    const taskEnd = task.dueDate ? new Date(task.dueDate) : task.updatedAt ? new Date(task.updatedAt) : new Date(taskStart.getTime() + 24 * 60 * 60 * 1000)
    const taskStartDay = new Date(taskStart)
    taskStartDay.setHours(0, 0, 0, 0)
    const taskEndDay = new Date(taskEnd)
    taskEndDay.setHours(23, 59, 59, 999)
    const weekStartDay = new Date(startDate)
    weekStartDay.setHours(0, 0, 0, 0)
    const weekEndDay = new Date(endDate)
    weekEndDay.setHours(23, 59, 59, 999)
    if (taskEndDay < weekStartDay || taskStartDay > weekEndDay) {
      return null
    }
    const displayStart = taskStartDay < weekStartDay ? weekStartDay : taskStartDay
    const displayEnd = taskEndDay > weekEndDay ? weekEndDay : taskEndDay
    let startIndex = -1
    let endIndex = -1
    for (let i = 0; i < allDays.length; i++) {
      const day = new Date(allDays[i])
      day.setHours(0, 0, 0, 0)
      if (startIndex === -1 && day >= displayStart) {
        startIndex = i
      }
      if (day <= displayEnd) {
        endIndex = i
      }
    }
    if (startIndex === -1) startIndex = 0
    if (endIndex === -1) endIndex = allDays.length - 1
    const dayPercentage = (100 / allDays.length)
    const leftPercent = startIndex * dayPercentage
    const baseWidthPercent = (endIndex - startIndex + 1) * dayPercentage
    const widthPercent = Math.min(Math.max(baseWidthPercent * zoomLevel, 5), 100)
    const left = startIndex * dayWidth
    const width = Math.max((endIndex - startIndex + 1) * dayWidth, 60)
    return { left, width, leftPercent, widthPercent, start: displayStart, end: displayEnd }
  }
  const filteredData = useMemo(() => {
    const result = data.map(userData => {
      const filteredTasks = userData.tasks.filter(task => {
        const taskStart = new Date(task.createdAt)
        taskStart.setHours(0, 0, 0, 0)
        const taskEnd = task.dueDate ? new Date(task.dueDate) : task.updatedAt ? new Date(task.updatedAt) : new Date(taskStart.getTime() + 24 * 60 * 60 * 1000)
        taskEnd.setHours(23, 59, 59, 999)
        const weekStartDay = new Date(startDate)
        weekStartDay.setHours(0, 0, 0, 0)
        const weekEndDay = new Date(endDate)
        weekEndDay.setHours(23, 59, 59, 999)
        const overlaps = taskEnd >= weekStartDay && taskStart <= weekEndDay
        return overlaps
      })
      return {
        ...userData,
        tasks: filteredTasks
      }
    })
    return result
  }, [data, startDate, endDate])
  const userTodayCounts = useMemo(() => {
    const counts: Record<number, number> = {}
    const todayStart = new Date(today)
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(today)
    todayEnd.setHours(23, 59, 59, 999)
    filteredData.forEach(userData => {
      const todayTasks = userData.tasks.filter(task => {
        if (task.dueDate) {
          const dueDate = new Date(task.dueDate)
          if (dueDate >= todayStart && dueDate <= todayEnd) return true
        }
        const startDate = new Date(task.createdAt)
        const endDate = task.dueDate ? new Date(task.dueDate) : task.updatedAt ? new Date(task.updatedAt) : null
        if (endDate) {
          return startDate <= todayEnd && endDate >= todayStart
        }
        return false
      })
      counts[userData.userId] = todayTasks.length
    })
    return counts
  }, [filteredData, today])
  const subtaskStatsByUser = useMemo(() => {
    const stats: Record<number, Record<number, { completed: number; total: number; percent: number }>> = {}
    filteredData.forEach(userData => {
      const subMap: Record<number, { completed: number; total: number; percent: number }> = {}
      const subtasksByParent = userData.tasks.reduce((acc, task) => {
        if (task.parentTaskId) {
          if (!acc[task.parentTaskId]) {
            acc[task.parentTaskId] = []
          }
          acc[task.parentTaskId].push(task)
        }
        return acc
      }, {} as Record<number, UserTaskTimeline[]>)
      Object.entries(subtasksByParent).forEach(([parentId, subtasks]) => {
        const completed = subtasks.filter(t => t.status === "done").length
        const total = subtasks.length
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0
        subMap[Number(parentId)] = { completed, total, percent }
      })
      stats[userData.userId] = subMap
    })
    return stats
  }, [filteredData])
  const toggleUser = (userId: number) => {
    setExpandedUsers(prev => {
      const next = new Set(prev)
      if (next.has(userId)) {
        next.delete(userId)
      } else {
        next.add(userId)
      }
      return next
    })
  }
  const isInitialMount = useRef(true)
  const prevUserIdsStr = useRef<string>('')
  useEffect(() => {
    if (filteredData.length > 0) {
      const allUserIds = new Set(filteredData.map(d => d.userId))
      const userIdsStr = Array.from(allUserIds).sort().join(',')
      if (isInitialMount.current || userIdsStr !== prevUserIdsStr.current) {
        setExpandedUsers(prev => {
          const next = new Set(prev)
          allUserIds.forEach(id => {
            if (!next.has(id)) {
              next.add(id)
            }
          })
          return new Set(Array.from(next).filter(id => allUserIds.has(id)))
        })
        prevUserIdsStr.current = userIdsStr
        isInitialMount.current = false
      }
    } else {
      if (prevUserIdsStr.current !== '') {
        setExpandedUsers(new Set())
        prevUserIdsStr.current = ''
        isInitialMount.current = true
      }
    }
  }, [filteredData])
  const userRowPositions = useMemo(() => {
    const positions: Record<number, { startRow: number; taskCount: number }> = {}
    let currentRow = 0
    filteredData.forEach(userData => {
      const isExpanded = expandedUsers.has(userData.userId)
      const taskCount = isExpanded ? userData.tasks.length : 0
      positions[userData.userId] = {
        startRow: currentRow,
        taskCount
      }
      currentRow += taskCount > 0 ? taskCount : 1
    })
    return positions
  }, [filteredData, expandedUsers])
  return (
    <div className="flex flex-col w-full">
      <div className="border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between bg-slate-50 dark:bg-slate-900 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            className="p-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded border border-slate-200 dark:border-slate-600"
          >
            <ChevronLeft className="w-4 h-4 text-slate-700 dark:text-slate-300" />
          </button>
          <span className="font-semibold text-slate-900 dark:text-slate-100 min-w-[200px] text-center">
            {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), 'dd MMM', { locale: vi })} - {format(endOfWeek(currentWeek, { weekStartsOn: 1 }), 'dd MMM yyyy', { locale: vi })}
          </span>
          <button
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            className="p-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded border border-slate-200 dark:border-slate-600"
          >
            <ChevronRight className="w-4 h-4 text-slate-700 dark:text-slate-300" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
            className="p-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded border border-slate-200 dark:border-slate-600"
          >
            <ZoomOut className="w-4 h-4 text-slate-700 dark:text-slate-300" />
          </button>
          <span className="text-sm text-slate-600 dark:text-slate-400 min-w-[60px] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
            className="p-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded border border-slate-200 dark:border-slate-600"
          >
            <ZoomIn className="w-4 h-4 text-slate-700 dark:text-slate-300" />
          </button>
        </div>
      </div>
      <div className="flex" ref={scrollContainerRef}>
        <div className="flex-shrink-0 w-56 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <div className="p-1.5 font-semibold text-xs text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-slate-50 dark:bg-slate-900 z-10">
            Công việc
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredData.map((userData) => {
              const isExpanded = expandedUsers.has(userData.userId)
              const todayCount = userTodayCounts[userData.userId] || 0
              const totalTasks = userData.tasks.length
              return (
                <div key={userData.userId}>
                  <div
                    onClick={() => toggleUser(userData.userId)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between transition-colors select-none"
                    title={isExpanded ? 'Click để ẩn tasks' : 'Click để hiện tasks'}
                  >
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 transition-transform">
                        {isExpanded ? '▼' : '▶'}
                      </span>
                      <span className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                        {userData.userName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 ml-1.5">
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold" title={`Tổng ${totalTasks} công việc${todayCount > 0 ? `, ${todayCount} công việc hôm nay` : ''}`}>
                        {totalTasks}
                      </span>
                      {todayCount > 0 && todayCount !== totalTasks && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400" title={`${todayCount} công việc hôm nay`}>
                          ({todayCount})
                        </span>
                      )}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="animate-in slide-in-from-top-1 duration-200">
                      {userData.tasks.map((task, idx) => {
                    const dueAlert = getDueAlert(task)
                    const subStats = !task.parentTaskId
                      ? subtaskStatsByUser[userData.userId]?.[task.taskId]
                      : undefined
                    const subPercent = subStats?.percent ?? task.subtaskPercent
                    return (
                    <div
                      key={`${task.taskId}-${idx}`}
                      onClick={() => onTaskClick?.(task)}
                      className={`pl-6 pr-1.5 py-1 cursor-pointer text-[11px] ${
                        dueAlert === "overdue"
                          ? "bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/40"
                          : dueAlert === "dueSoon"
                          ? "bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800"
                      } text-slate-700 dark:text-slate-300`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div
                        className={`font-medium truncate ${
                          dueAlert === "overdue"
                            ? "text-rose-600 dark:text-rose-300"
                            : dueAlert === "dueSoon"
                            ? "text-amber-600 dark:text-amber-300"
                            : ""
                        }`}
                      >
                        {task.taskKey} - {task.title}
                        </div>
                        {subPercent !== undefined && (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-300">
                            {subPercent}%
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {task.projectName}
                      </div>
                    </div>
                  )})}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 sticky top-0 z-20">
            <div className="flex w-full">
              {weekDays.map((week, weekIdx) => {
                const weekStart = week[0]
                const weekEnd = week[week.length - 1]
                const weekLabel = `${format(weekStart, 'dd MMM', { locale: vi })} - ${format(weekEnd, 'dd MMM', { locale: vi })}`
                const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
                return (
                  <div key={weekIdx} className="border-r border-slate-200 dark:border-slate-700 flex-1">
                    <div className="p-1.5 text-center font-semibold text-xs text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700">
                      {weekLabel}
                    </div>
                    <div className="flex">
                      {week.map((day, dayIdx) => {
                        const dayOfWeek = day.getDay()
                        const dayName = dayNames[dayOfWeek]
                        return (
                          <div
                            key={dayIdx}
                            className={`text-center py-1.5 border-r border-slate-200 dark:border-slate-700 flex-1 ${
                              isSameDay(day, today) 
                                ? 'bg-amber-100 dark:bg-amber-900/30 font-semibold text-amber-800 dark:text-amber-200' 
                                : 'text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <div className="font-medium mb-0.5 text-xs">{dayName}</div>
                            <div className="font-semibold text-base">{format(day, 'dd', { locale: vi })}</div>
                            <div className="text-[9px] opacity-75 mt-0.5">{format(day, 'MMM', { locale: vi })}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="relative w-full" style={{ minHeight: `${Object.values(userRowPositions).reduce((sum, pos) => sum + (pos.taskCount > 0 ? pos.taskCount : 1), 0) * 40 + 16}px` }}>
            {(() => {
              const todayIndex = allDays.findIndex(d => isSameDay(d, today))
              if (todayIndex === -1) return null
              const dayPercentage = (100 / allDays.length)
              return (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10 pointer-events-none"
                  style={{
                    left: `${(todayIndex + 0.5) * dayPercentage}%`
                  }}
                />
              )
            })()}
            {filteredData.map((userData) => {
              const isExpanded = expandedUsers.has(userData.userId)
              if (!isExpanded) return null
              const rowPos = userRowPositions[userData.userId]
              if (!rowPos) return null
              return userData.tasks.map((task, taskIndex) => {
                const position = getTaskPosition(task)
                if (!position) return null
                const dueAlert = getDueAlert(task)
                const statusColor =
                  dueAlert === "overdue"
                    ? "#EF4444"
                    : dueAlert === "dueSoon"
                    ? "#F59E0B"
                    : STATUS_COLOR[task.status] ?? "#6366F1"
                const leftPercent = position.leftPercent || 0
                const widthPercent = position.widthPercent || 5
                return (
                  <div
                    key={`${task.taskId}-${taskIndex}`}
                    onClick={() => onTaskClick?.(task)}
                    className="absolute cursor-pointer group"
                    style={{
                      top: `${rowPos.startRow * 40 + taskIndex * 40 + 8}px`,
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                      height: '32px',
                    }}
                  >
                    <div
                      className="h-full rounded px-1.5 py-0.5 flex items-center justify-between text-white text-[10px] shadow-sm hover:shadow-md transition-shadow"
                      style={{
                        backgroundColor: statusColor,
                        outline:
                          dueAlert === "overdue"
                            ? "2px solid #B91C1C"
                            : dueAlert === "dueSoon"
                            ? "2px solid #B45309"
                            : "none",
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate leading-tight">{task.taskKey}</div>
                        <div className="text-[9px] opacity-90 truncate leading-tight">{task.title}</div>
                      </div>
                      <div className="ml-1.5 text-right flex-shrink-0">
                        <div className="text-[9px] opacity-90 leading-tight">
                          {format(position.start, 'dd MMM', { locale: vi })}
                        </div>
                        {position.end && (
                          <div className="text-[9px] opacity-90 leading-tight">
                            - {format(position.end, 'dd MMM', { locale: vi })}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="absolute left-0 top-full mt-1 bg-slate-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none z-30 whitespace-nowrap">
                      <div className="font-semibold">{task.taskKey} - {task.title}</div>
                      <div>Dự án: {task.projectName}</div>
                      <div>Trạng thái: {task.statusName}</div>
                      <div>Người phụ trách: {task.assigneeNames.join(', ') || 'Không có'}</div>
                    </div>
                  </div>
                )
              })
            })}
          </div>
        </div>
      </div>
    </div>
  )
}