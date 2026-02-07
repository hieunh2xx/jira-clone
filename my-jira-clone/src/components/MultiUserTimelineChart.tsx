import { useMemo } from "react"
import { format, isSameDay, startOfDay, endOfDay } from "date-fns"
import { UserTaskTimeline } from "./UserTaskTimelineChart"
import GanttChart from "./GanttChart"
interface MultiUserTimelineData {
  userId: number
  userName: string
  tasks: UserTaskTimeline[]
}
interface MultiUserTimelineChartProps {
  data: MultiUserTimelineData[]
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
export default function MultiUserTimelineChart({ data, onTaskClick, selectedDate }: MultiUserTimelineChartProps) {
  const sortedData = useMemo(() => {
    const today = selectedDate || new Date()
    const todayStart = startOfDay(today)
    const todayEnd = endOfDay(today)
    return [...data].sort((a, b) => {
      const countA = a.tasks.filter(task => {
        if (task.dueDate) {
          const dueDate = new Date(task.dueDate)
          if (isSameDay(dueDate, today)) return true
        }
        const startDate = new Date(task.createdAt)
        const endDate = task.dueDate ? new Date(task.dueDate) : task.updatedAt ? new Date(task.updatedAt) : null
        if (endDate) {
          return startDate <= todayEnd && endDate >= todayStart
        }
        return false
      }).length
      const countB = b.tasks.filter(task => {
        if (task.dueDate) {
          const dueDate = new Date(task.dueDate)
          if (isSameDay(dueDate, today)) return true
        }
        const startDate = new Date(task.createdAt)
        const endDate = task.dueDate ? new Date(task.dueDate) : task.updatedAt ? new Date(task.updatedAt) : null
        if (endDate) {
          return startDate <= todayEnd && endDate >= todayStart
        }
        return false
      }).length
      if (countA !== countB) {
        return countB - countA
      }
      return b.tasks.length - a.tasks.length
    })
  }, [data, selectedDate])
  return (
    <GanttChart
      data={sortedData}
      onTaskClick={onTaskClick}
      selectedDate={selectedDate}
    />
  )
}