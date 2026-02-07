import { CheckCircle, Plus, Edit3, Users } from "lucide-react"
import { formatTime } from "../helper/data-helper"
import type { Activity } from "../interface/types"
interface ActivityTimelineProps {
  activities: Activity[]
}
export default function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "task_created":
        return <Plus className="w-4 h-4" />
      case "task_updated":
        return <Edit3 className="w-4 h-4" />
      case "task_completed":
        return <CheckCircle className="w-4 h-4" />
      case "member_added":
        return <Users className="w-4 h-4" />
      default:
        return <Plus className="w-4 h-4" />
    }
  }
  const getActivityColor = (type: string) => {
    switch (type) {
      case "task_created":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
      case "task_updated":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
      case "task_completed":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
      case "member_added":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
      case "project_created":
        return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300"
    }
  }
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">Project Activity</h3>
      <div className="space-y-4">
        {activities.length > 0 ? (
          activities.map((activity, index) => (
            <div key={activity.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}
                >
                  {getActivityIcon(activity.type)}
                </div>
                {index < activities.length - 1 && <div className="w-0.5 h-12 bg-slate-200 dark:bg-slate-700 mt-2" />}
              </div>
              <div className="flex-1 pt-1 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-medium text-white">
                        {activity.user.substring(0, 1).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{activity.user}</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{activity.description}</p>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 ml-2 whitespace-nowrap">
                    {formatTime(activity.timestamp)}
                  </span>
                </div>
                <div className="mt-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {activity.type.replace(/_/g, " ").toUpperCase()}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400">No activity yet</p>
          </div>
        )}
      </div>
    </div>
  )
}