export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "LOW"| "MEDIUM"| "HIGH"| "URGENT";
  tags: string[];
  dueDate: string;
  dueTime: string;
  completed: boolean;
  notes: string;
  subtasks?: {
    id: string;
    title: string;
    completed: boolean;
    task_id: string;
  }[];
  attachments?: string[];
  createdAt: string;
  updatedAt?: string;
}


export interface Subtask {
  id: string
  title: string
  completed: boolean
}

export interface TaskFormData extends Omit<Task, 'id' | 'createdAt' | 'attachments'> {
  attachments?: File[]
}