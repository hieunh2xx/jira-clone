import ReactECharts from "echarts-for-react"
import { TaskDto } from "../interface/kanbanInterface"
import { useMemo } from "react"
import { endOfMonth, format, isBefore, max, min, startOfMonth } from "date-fns"
interface TaskWithChildren {
  mainTask: TaskDto
  subtasks: TaskDto[]
}
interface TaskTimelineChartProps {
  data: TaskWithChildren[]
  month?: Date
}
export default function TaskTimelineChart({ data, month = new Date() }: TaskTimelineChartProps) {
  const timeline = useMemo(() => {
    if (data.length === 0) {
      return { option: null, hasData: false }
    }
    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(month)
    const today = new Date()
    const formattedData = data
      .map(({ mainTask }) => {
        const createdAt = mainTask.createdAt ? new Date(mainTask.createdAt) : null
        const dueDate = mainTask.dueDate ? new Date(mainTask.dueDate) : null
        if (!createdAt) return null
        const clampedStart = max([createdAt, monthStart])
        const clampedEnd = dueDate ? min([dueDate, monthEnd]) : monthEnd
        return {
          name: `${mainTask.key} - ${mainTask.title}`,
          originalStart: createdAt,
          originalEnd: dueDate,
          start: clampedStart,
          end: clampedEnd,
          isOverdue: dueDate ? isBefore(dueDate, today) && mainTask.status !== "done" : false,
        }
      })
      .filter(Boolean) as {
        name: string
        originalStart: Date
        originalEnd: Date | null
        start: Date
        end: Date
        isOverdue: boolean
      }[]
    if (formattedData.length === 0) {
      return { option: null, hasData: false }
    }
    const option = {
      tooltip: {
        formatter: (params: any) => {
          const data = params.data
          const startDate = format(data.originalStart, "dd/MM/yyyy")
          const endDate = data.originalEnd ? format(data.originalEnd, "dd/MM/yyyy") : "Chưa xác định"
          return `
            <div class="text-sm">
              <strong>${data.name}</strong><br />
              Bắt đầu: ${startDate}<br />
              Kết thúc: ${endDate}<br />
              Trạng thái: ${data.isOverdue ? "Quá hạn" : "Đang thực hiện"}
            </div>
          `
        },
      },
      grid: {
        left: 140,
        right: 30,
        top: 40,
        bottom: 40,
      },
      xAxis: {
        type: "time",
        min: monthStart,
        max: monthEnd,
        axisLabel: {
          formatter: (value: number) => format(new Date(value), "dd/MM"),
        },
        splitLine: {
          show: true,
        },
      },
      yAxis: {
        type: "category",
        inverse: true,
        data: formattedData.map((item) => item.name),
      },
      series: [
        {
          type: "custom",
          renderItem: (params: any, api: any) => {
            const categoryIndex = api.value(0)
            const start = api.coord([api.value(1), categoryIndex])
            const end = api.coord([api.value(2), categoryIndex])
            const height = api.size([0, 1])[1] * 0.6
            return {
              type: "rect",
              shape: {
                x: start[0],
                y: start[1] - height / 2,
                width: Math.max(end[0] - start[0], 2),
                height,
              },
              style: api.style({
                fill: api.value(3) ? "#EF4444" : "#3B82F6",
              }),
            }
          },
          encode: {
            x: [1, 2],
            y: 0,
          },
          data: formattedData.map((item, index) => ({
            value: [index, item.start.getTime(), item.end.getTime(), item.isOverdue],
            name: item.name,
            originalStart: item.originalStart,
            originalEnd: item.originalEnd,
            isOverdue: item.isOverdue,
          })),
          markLine: {
            symbol: "none",
            data: [
              {
                xAxis: today,
                lineStyle: {
                  color: "#F59E0B",
                  type: "dashed",
                },
                label: {
                  formatter: "Hôm nay",
                  color: "#F59E0B",
                },
              },
            ],
          },
        },
      ],
    }
    return {
      hasData: true,
      option,
    }
  }, [data, month])
  if (!timeline.hasData || !timeline.option) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 text-center text-slate-500 dark:text-slate-400">
        Không có dữ liệu timeline trong tháng này
      </div>
    )
  }
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
        Timeline công việc (tháng {format(month, "MM/yyyy")})
      </h3>
      <ReactECharts option={timeline.option} style={{ height: 360 }} />
    </div>
  )
}