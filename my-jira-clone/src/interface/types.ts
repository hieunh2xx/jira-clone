export interface Comment {
  id: number
  author: string
  content: string
  image?: string
  files?: string[]
  createdAt: string
  replies?: Comment[]
}
export type TaskStatus = "To Do" | "In Progress" | "Review" | "Done"
export interface Task {
  id: number
  title: string
  description: string
  status: TaskStatus
  priority: "low" | "medium" | "high"
  assignee: string
  dueDate: string
  labels?: string[]
  comments?: Comment[]
}
export interface Project {
  id: number
  name: string
  description: string
  tasks: Task[]
  teamMembers: string[]
}
export interface Activity {
  id: number
  type: "task_created" | "task_updated" | "task_completed" | "member_added" | "project_created"
  user: string
  description: string
  timestamp: Date
}