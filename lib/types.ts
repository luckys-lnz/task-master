export interface Todo {
  id: string
  title: string
  description: string
  category: string
  priority: string
  tags: string[]
  dueDate: string
  dueTime: string
  completed: boolean
  notes: string
  subtasks: SubTask[]
  createdAt: string
}

export interface SubTask {
  id: string
  title: string
  completed: boolean
}
