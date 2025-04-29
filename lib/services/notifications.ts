import { toast } from "@/hooks/use-toast"
import type { Todo } from "@/lib/types"

type NotificationType = 'upcoming' | 'due-today' | 'overdue'

export class NotificationService {
  private static instance: NotificationService
  private notifications: Map<string, NodeJS.Timeout> = new Map()
  private reminderIntervals: Map<string, NodeJS.Timeout> = new Map()

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  private async checkTasks(todos: Todo[]) {
    const now = new Date()
    
    todos.forEach(todo => {
      if (todo.completed || !todo.dueDate) return

      const dueDate = new Date(todo.dueDate)
      if (todo.dueTime) {
        const [hours, minutes] = todo.dueTime.split(":").map(Number)
        dueDate.setHours(hours, minutes)
      } else {
        dueDate.setHours(23, 59, 59, 999)
      }

      // Check for overdue tasks
      if (dueDate < now && !this.notifications.has(`${todo.id}-overdue`)) {
        this.notifyTask(todo, 'overdue')
      }
      // Check for tasks due today
      else if (this.isDueToday(dueDate) && !this.notifications.has(`${todo.id}-due-today`)) {
        this.notifyTask(todo, 'due-today')
      }
      // Check for upcoming tasks (within next 24 hours)
      else if (this.isUpcoming(dueDate) && !this.notifications.has(`${todo.id}-upcoming`)) {
        this.notifyTask(todo, 'upcoming')
      }
    })
  }

  private isDueToday(dueDate: Date): boolean {
    const today = new Date()
    return (
      dueDate.getDate() === today.getDate() &&
      dueDate.getMonth() === today.getMonth() &&
      dueDate.getFullYear() === today.getFullYear()
    )
  }

  private isUpcoming(dueDate: Date): boolean {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return dueDate > now && dueDate <= tomorrow
  }

  private notifyTask(todo: Todo, type: NotificationType) {
    const notificationId = `${todo.id}-${type}`
    const notificationConfig = {
      overdue: {
        title: "Task Overdue",
        description: `"${todo.title}" is overdue!`,
        variant: "destructive" as const,
      },
      'due-today': {
        title: "Task Due Today",
        description: `"${todo.title}" is due today!`,
        variant: "default" as const,
      },
      upcoming: {
        title: "Upcoming Task",
        description: `"${todo.title}" is due soon!`,
        variant: "default" as const,
      },
    }

    const config = notificationConfig[type]

    // Show toast notification
    toast({
      title: config.title,
      description: config.description,
      variant: config.variant,
    })

    // Send browser notification if supported
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(config.title, {
        body: config.description,
        icon: "/favicon.ico",
      })
    }

    // Store notification to prevent duplicates
    this.notifications.set(notificationId, setTimeout(() => {
      this.notifications.delete(notificationId)
    }, 24 * 60 * 60 * 1000)) // Clear after 24 hours
  }

  public startMonitoring(todos: Todo[]) {
    // Check immediately
    this.checkTasks(todos)

    // Set up interval to check every 5 minutes
    const interval = setInterval(() => {
      this.checkTasks(todos)
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }

  public async requestNotificationPermission() {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission()
      return permission === "granted"
    }
    return false
  }
} 