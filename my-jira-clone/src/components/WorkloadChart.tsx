import { useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts"
import { TaskDto } from "../interface/kanbanInterface"
import { format, isToday, parseISO } from "date-fns"
interface WorkloadChartProps {
  tasks: TaskDto[]
  onReassign?: (taskId: number, newAssigneeId: number) => void
}
export default function WorkloadChart({ tasks, onReassign }: WorkloadChartProps) {
  const workloadData = useMemo(() => {
    const today = new Date()
    const assigneeWorkload: Record<string, { name: string; todayTasks: number; totalTasks: number; overdueTasks: number }> = {}
    tasks.forEach(task => {
      if (task.status === 'done') return
      const isTaskToday = task.dueDate ? isToday(parseISO(task.dueDate)) : false
      const taskStatus = task.status as string;
      const isOverdue = task.dueDate ? new Date(task.dueDate) < today && taskStatus !== 'done' : false
      task.assigneeNames.forEach(name => {
        if (!assigneeWorkload[name]) {
          assigneeWorkload[name] = {
            name,
            todayTasks: 0,
            totalTasks: 0,
            overdueTasks: 0
          }
        }
        assigneeWorkload[name].totalTasks++
        if (isTaskToday) {
          assigneeWorkload[name].todayTasks++
        }
        if (isOverdue) {
          assigneeWorkload[name].overdueTasks++
        }
      })
    })
    return Object.values(assigneeWorkload).map(item => ({
      name: item.name,
      'Hôm nay': item.todayTasks,
      'Tổng công việc': item.totalTasks,
      'Quá hạn': item.overdueTasks
    })).sort((a, b) => b['Tổng công việc'] - a['Tổng công việc'])
  }, [tasks])
  const getBarColor = (value: number, maxValue: number) => {
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0
    if (percentage >= 80) return '#EF4444'
    if (percentage >= 60) return '#F59E0B'
    return '#10B981'
  }
  const maxValue = Math.max(...workloadData.map(d => d['Tổng công việc']), 1)
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
        Phân bổ công việc theo người dùng
      </h3>
      {workloadData.length === 0 ? (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          Không có dữ liệu công việc
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={workloadData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="name" 
              stroke="#6B7280"
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis stroke="#6B7280" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #E5E7EB',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar dataKey="Hôm nay" fill="#3B82F6" name="Hôm nay" />
            <Bar dataKey="Tổng công việc" name="Tổng công việc">
              {workloadData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getBarColor(entry['Tổng công việc'], maxValue)} 
                />
              ))}
            </Bar>
            <Bar dataKey="Quá hạn" fill="#EF4444" name="Quá hạn" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}