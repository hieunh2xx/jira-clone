import ReactECharts from "echarts-for-react"
import { TaskDto } from "../interface/kanbanInterface"
import { useMemo, useEffect, useState } from "react"
export interface TaskWithChildren {
  mainTask: TaskDto
  subtasks: TaskDto[]
}
interface TaskAssignmentChartProps {
  data: TaskWithChildren[]
}
export default function TaskAssignmentChart({ data }: TaskAssignmentChartProps) {
  const [isDarkMode, setIsDarkMode] = useState(false)
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDarkMode(isDark)
    }
    checkDarkMode()
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', checkDarkMode)
    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', checkDarkMode)
    }
  }, [])
  const chartData = useMemo(() => {
    if (data.length === 0) {
      return {
        option: null,
        hasData: false,
      }
    }
    const assigneeSet = new Set<string>()
    data.forEach(({ mainTask, subtasks }) => {
      mainTask.assigneeNames.forEach((name) => assigneeSet.add(name))
      subtasks.forEach((sub) => sub.assigneeNames.forEach((name) => assigneeSet.add(name)))
    })
    const assignees = Array.from(assigneeSet).filter(Boolean)
    if (assignees.length === 0) {
      return {
        option: null,
        hasData: false,
      }
    }
    const categories = data.map(({ mainTask }) => `${mainTask.key} - ${mainTask.title}`)
    const series = assignees.map((assignee) => ({
      name: assignee,
      type: "bar",
      stack: "tasks",
      emphasis: {
        focus: "series",
      },
      data: data.map(({ mainTask, subtasks }) => {
        const relevantSubtasks = subtasks.filter((sub) => sub.assigneeNames.includes(assignee))
        const hasMain = mainTask.assigneeNames.includes(assignee)
        const total = relevantSubtasks.length + (hasMain ? 1 : 0)
        return total
      }),
    }))
    const textColor = isDarkMode ? '#ffffff' : '#1e293b'
    const axisLineColor = isDarkMode ? '#ffffff' : '#64748b'
    const splitLineColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
    const tooltipBg = isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)'
    const tooltipBorder = isDarkMode ? '#475569' : '#e2e8f0'
    return {
      hasData: true,
      option: {
        textStyle: {
          color: textColor,
        },
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
          backgroundColor: tooltipBg,
          borderColor: tooltipBorder,
          textStyle: {
            color: textColor,
          },
        },
        legend: {
          data: assignees,
          textStyle: {
            color: textColor,
          },
        },
        grid: {
          left: "3%",
          right: "4%",
          bottom: "3%",
          containLabel: true,
        },
        xAxis: {
          type: "value",
          name: "Số lượng công việc",
          nameTextStyle: {
            color: textColor,
          },
          axisLabel: {
            color: textColor,
          },
          axisLine: {
            lineStyle: {
              color: axisLineColor,
            },
          },
          splitLine: {
            lineStyle: {
              color: splitLineColor,
            },
          },
        },
        yAxis: {
          type: "category",
          data: categories,
          axisLabel: {
            color: textColor,
          },
          axisLine: {
            lineStyle: {
              color: axisLineColor,
            },
          },
        },
        series,
      },
    }
  }, [data, isDarkMode])
  if (!chartData.hasData || !chartData.option) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 text-center text-slate-500 dark:text-slate-400">
        Không có dữ liệu công việc để hiển thị
      </div>
    )
  }
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
        Phân bổ công việc theo người phụ trách
      </h3>
      <ReactECharts option={chartData.option} style={{ height: 320 , color: 'white'}} />
    </div>
  )
}