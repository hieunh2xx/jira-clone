import { useMemo } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { TaskDto } from "../interface/kanbanInterface"

interface ContributionPieChartProps {
  tasks: TaskDto[]
}

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
]

export default function ContributionPieChart({ tasks }: ContributionPieChartProps) {
  const contributionData = useMemo(() => {
    const assigneeStats: Record<string, { name: string; completed: number; total: number }> = {}
    
    tasks.forEach(task => {
      task.assigneeNames.forEach(name => {
        if (!assigneeStats[name]) {
          assigneeStats[name] = {
            name,
            completed: 0,
            total: 0
          }
        }
        assigneeStats[name].total++
        if (task.status === 'done') {
          assigneeStats[name].completed++
        }
      })
    })
    
    const totalCompleted = Object.values(assigneeStats).reduce((sum, stat) => sum + stat.completed, 0)
    
    if (totalCompleted === 0) {
      return []
    }
    
    return Object.values(assigneeStats)
      .map(stat => ({
        name: stat.name,
        value: stat.completed,
        percentage: totalCompleted > 0 ? Math.round((stat.completed / totalCompleted) * 100) : 0
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [tasks])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-slate-900 dark:text-slate-100">{data.name}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Đã hoàn thành: <span className="font-semibold">{data.value}</span> task
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Đóng góp: <span className="font-semibold text-blue-600 dark:text-blue-400">{data.payload.percentage}%</span>
          </p>
        </div>
      )
    }
    return null
  }

  if (contributionData.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Đóng góp của thành viên
        </h3>
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          Chưa có task nào được hoàn thành
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
        Đóng góp của thành viên (% task đã hoàn thành)
      </h3>
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={contributionData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percentage }) => `${name}: ${percentage}%`}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {contributionData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry: any) => `${value} (${entry.payload.percentage}%)`}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {contributionData.map((item, index) => (
          <div key={item.name} className="flex items-center gap-2 text-sm">
            <div 
              className="w-4 h-4 rounded" 
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-slate-700 dark:text-slate-300 truncate">{item.name}</span>
            <span className="text-slate-500 dark:text-slate-400 font-semibold">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
