import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Map database task fields to camelCase for frontend
 */
export function mapTaskToCamelCase(task: any) {
  return {
    ...task,
    dueDate: task.due_date,
    dueTime: task.due_time,
  }
}
