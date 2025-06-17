export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  dueDate: string;
  dueTime: string;
  completed: boolean;
  notes: string;
  subtasks: Subtask[];
  attachments?: string[];
  createdAt: string;
}


export interface Subtask {
  id: string
  title: string
  completed: boolean
}

export interface TaskFormData extends Omit<Task, 'id' | 'createdAt' | 'attachments'> {
  attachments?: File[]
}