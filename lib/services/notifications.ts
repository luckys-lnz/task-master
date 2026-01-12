import { toast } from "@/components/ui/use-toast"
import type { Task } from "@/lib/types"
import { format } from "date-fns"


export class NotificationService {
  private static instance: NotificationService
  private notifications: Map<string, NodeJS.Timeout> = new Map()
  private scheduled: Map<string, NodeJS.Timeout[]> = new Map()

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  private clearScheduled(taskId: string) {
    const timeouts = this.scheduled.get(taskId)
    if (timeouts) {
      timeouts.forEach(clearTimeout)
      this.scheduled.delete(taskId)
    }
  }

  private scheduleNotificationsForTask(todo: Task) {
    if (todo.status === "COMPLETED" || !todo.dueDate) return
    this.clearScheduled(todo.id)

    const dueDate = new Date(todo.dueDate)
    if (todo.dueTime) {
      const [hours, minutes] = todo.dueTime.split(":").map(Number)
      dueDate.setHours(hours, minutes, 0, 0)
    } else {
      dueDate.setHours(23, 59, 59, 999)
    }
    const now = new Date()
    const timeToDue = dueDate.getTime() - now.getTime()
    const timeTo30MinBefore = timeToDue - 30 * 60 * 1000

    const timeouts: NodeJS.Timeout[] = []

    // 30 minutes before due
    if (timeTo30MinBefore > 0) {
      timeouts.push(setTimeout(() => {
        this.notifyTodoistStyle(todo, "due-soon")
      }, timeTo30MinBefore))
    }
    // At due time
    if (timeToDue > 0) {
      timeouts.push(setTimeout(() => {
        this.notifyTodoistStyle(todo, "due-now")
      }, timeToDue))
    }
    // Overdue (if not completed)
    if (timeToDue < 0) {
      this.notifyTodoistStyle(todo, "overdue")
    } else {
      // Schedule overdue notification right after due time
      timeouts.push(setTimeout(() => {
        this.notifyTodoistStyle(todo, "overdue")
      }, Math.max(timeToDue, 0) + 1000))
    }
    this.scheduled.set(todo.id, timeouts)
  }

  private playNotificationSound() {
    try {
      const audio = new Audio("/notification.wav");
      audio.play();
    } catch {
      // Fail silently if sound can't play
    }
  }

  private notifyTodoistStyle(todo: Task, type: "due-soon" | "due-now" | "overdue") {
    const notificationId = `${todo.id}-${type}`
    if (this.notifications.has(notificationId)) return

    let title = ""
    let description = ""
    let variant: "default" | "destructive" = "default"
    const dueDateStr = todo.dueDate ? format(new Date(todo.dueDate), "MMM d, yyyy") : ""
    const dueTimeStr = todo.dueTime ? `at ${todo.dueTime}` : ""
    const fullDue = [dueDateStr, dueTimeStr].filter(Boolean).join(" ")

    if (type === "due-soon") {
      title = "Due soon"
      description = `"${todo.title}" is due in 30 minutes (${fullDue})`
    } else if (type === "due-now") {
      title = "Due now"
      description = `"${todo.title}" is due now (${fullDue})`
    } else if (type === "overdue") {
      title = "Overdue"
      description = `"${todo.title}" was due ${fullDue}`
      variant = "destructive"
    }

    this.playNotificationSound();
    toast({
      title,
      description,
      variant,
    })

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body: description,
        icon: "/favicon.ico",
      })
    }

    this.notifications.set(notificationId, setTimeout(() => {
      this.notifications.delete(notificationId)
    }, 24 * 60 * 60 * 1000))
  }

  public startMonitoring(todos: Task[]) {
    // Clear all scheduled notifications
    this.scheduled.forEach((timeouts) => {
      timeouts.forEach(clearTimeout)
    })
    this.scheduled.clear()
    this.notifications.clear()

    // Schedule notifications for all tasks
    todos.forEach(todo => this.scheduleNotificationsForTask(todo))

    // Re-schedule every 5 minutes in case tasks change
    const interval = setInterval(() => {
      todos.forEach(todo => this.scheduleNotificationsForTask(todo))
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