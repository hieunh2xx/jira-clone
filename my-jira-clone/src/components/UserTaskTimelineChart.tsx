import { useMemo } from "react"
import ReactECharts from "echarts-for-react"
import { format } from "date-fns"
export interface UserTaskTimeline {
  taskId: number
  taskKey: string
  title: string
  status: string
  statusName: string
  priority: string
  dueDate?: string | null
  isOverdue?: boolean
  isDueSoon?: boolean
  subtaskPercent?: number
  createdAt: string
  updatedAt?: string | null
  assignedAt?: string | null
  parentTaskId?: number | null
  parentTaskTitle?: string | null
  projectId: number
  projectName: string
  projectCode: string
  assigneeNames: string[]
}
interface UserTaskTimelineChartProps {
  tasks: UserTaskTimeline[]
  onTaskClick?: (task: UserTaskTimeline) => void
}
const STATUS_COLOR: Record<string, string> = {
  todo: "#9CA3AF",
  in_progress: "#3B82F6",
  review: "#F59E0B",
  fix: "#F97316",
  done: "#10B981",
}
export default function UserTaskTimelineChart({ tasks, onTaskClick }: UserTaskTimelineChartProps) {
  const option = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return null
    }
    const sortedTasks = [...tasks].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    const data = sortedTasks.map((task, idx) => {
      const start = new Date(task.createdAt)
      const end = task.dueDate
        ? new Date(task.dueDate)
        : task.updatedAt
        ? new Date(task.updatedAt)
        : new Date(start.getTime() + 24 * 60 * 60 * 1000)
      const safeEnd = end < start ? new Date(start.getTime() + 24 * 60 * 60 * 1000) : end
      const now = new Date()
      const todayStart = new Date(now)
      todayStart.setHours(0, 0, 0, 0)
      const dueAlert = (() => {
        if (task.status === "done") return null
        if (task.isOverdue) return "overdue"
        if (task.isDueSoon) return "dueSoon"
        if (!task.dueDate) return null
        const dueDate = new Date(task.dueDate)
        dueDate.setHours(0, 0, 0, 0)
        const diffDays = Math.floor((dueDate.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000))
        if (diffDays < 0) return "overdue"
        if (diffDays <= 3) return "dueSoon"
        return null
      })()
      return {
        value: [idx, start.getTime(), safeEnd.getTime(), task.status, dueAlert],
        task,
      }
    })
    return {
      tooltip: {
        trigger: "item",
        formatter: (params: any) => {
          const task: UserTaskTimeline = params.data.task
          const start = format(new Date(task.createdAt), "dd/MM/yyyy")
          const due = task.dueDate ? format(new Date(task.dueDate), "dd/MM/yyyy") : "Chưa đặt"
          const assignees = task.assigneeNames.length > 0 ? task.assigneeNames.join(", ") : "Không rõ"
          return `
            <div class="text-xs">
              <strong>${task.taskKey} - ${task.title}</strong><br/>
              Trạng thái: ${task.statusName}<br/>
              Bắt đầu: ${start}<br/>
              Hạn: ${due}<br/>
              Dự án: ${task.projectName}<br/>
              Người phụ trách: ${assignees}
            </div>
          `
        },
      },
      grid: {
        left: 160,
        right: 30,
        top: 20,
        bottom: 20,
      },
      xAxis: {
        type: "time",
        axisLabel: {
          formatter: (value: number) => format(new Date(value), "dd/MM"),
        },
        splitLine: { show: true },
      },
      yAxis: {
        type: "category",
        inverse: true,
        data: sortedTasks.map((task) => `${task.taskKey} - ${task.title}`),
        axisLabel: { interval: 0 },
      },
      series: [
        {
          type: "custom",
          renderItem: (params: any, api: any) => {
            const categoryIndex = api.value(0)
            const startCoord = api.coord([api.value(1), categoryIndex])
            const endCoord = api.coord([api.value(2), categoryIndex])
            const height = api.size([0, 1])[1] * 0.6
            const status = api.value(3) as string
            const dueAlert = api.value(4) as string | null
            return {
              type: "rect",
              shape: {
                x: startCoord[0],
                y: startCoord[1] - height / 2,
                width: Math.max(endCoord[0] - startCoord[0], 2),
                height,
              },
              style: {
                fill:
                  dueAlert === "overdue"
                    ? "#EF4444"
                    : dueAlert === "dueSoon"
                    ? "#F59E0B"
                    : STATUS_COLOR[status] ?? "#6366F1",
                opacity: 0.85,
                stroke:
                  dueAlert === "overdue"
                    ? "#B91C1C"
                    : dueAlert === "dueSoon"
                    ? "#B45309"
                    : undefined,
                lineWidth: dueAlert ? 2 : 0,
              },
            }
          },
          encode: { x: [1, 2], y: 0 },
          data,
        },
      ],
    }
  }, [tasks])
  if (!option) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 text-center text-sm text-slate-500 dark:text-slate-400">
        Không có task nào được chỉ định
      </div>
    )
  }
  return (
    <ReactECharts
      option={option}
      style={{ height: Math.max(240, tasks.length * 48) }}
      onEvents={
        onTaskClick
          ? {
              click: (params: any) => {
                const task: UserTaskTimeline | undefined = params?.data?.task
                if (task) {
                  onTaskClick(task)
                }
              },
            }
          : undefined
      }
    />
  )
}