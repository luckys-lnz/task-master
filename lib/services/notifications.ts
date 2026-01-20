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
    
    // Calculate times for each notification
    const timeTo30MinBefore = timeToDue - 30 * 60 * 1000
    const timeTo15MinBefore = timeToDue - 15 * 60 * 1000
    const timeTo5MinBefore = timeToDue - 5 * 60 * 1000

    const timeouts: NodeJS.Timeout[] = []

    // 30 minutes before due
    if (timeTo30MinBefore > 0) {
      timeouts.push(setTimeout(() => {
        this.notifyTodoistStyle(todo, "30min-before")
      }, timeTo30MinBefore))
    }
    
    // 15 minutes before due
    if (timeTo15MinBefore > 0) {
      timeouts.push(setTimeout(() => {
        this.notifyTodoistStyle(todo, "15min-before")
      }, timeTo15MinBefore))
    }
    
    // 5 minutes before due
    if (timeTo5MinBefore > 0) {
      timeouts.push(setTimeout(() => {
        this.notifyTodoistStyle(todo, "5min-before")
      }, timeTo5MinBefore))
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
    // Use HTML5 Audio which works better for notifications
    // It doesn't require user gesture when triggered by browser notifications
    try {
      // Try to use the notification.wav file if available
      const audio = new Audio("/notification.wav")
      audio.volume = 0.6
      audio.play().catch(() => {
        // If file doesn't exist or fails, use fallback
        this.playFallbackSound()
      })
    } catch {
      this.playFallbackSound()
    }
  }

  private playFallbackSound() {
    try {
      // Use a simple beep sound via data URL
      // This works without user gesture when triggered by scheduled notifications
      const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi77+efTRAMUKfj8LZjHAY4kdfyzHksBSR3x/DdkEAKFF606euoVRQKRp/g8r5sIQUrgc7y2Yk2CBlou+/nn00QDFCn4/C2YxwGOJHX8sx5LAUkd8fw3ZBACg==")
      audio.volume = 0.5
      audio.play().catch(() => {
        // Fail silently if sound can't play
      })
    } catch {
      // Fail silently if sound can't play
    }
  }

  private notifyTodoistStyle(todo: Task, type: "30min-before" | "15min-before" | "5min-before" | "due-now" | "overdue") {
    const notificationId = `${todo.id}-${type}`
    if (this.notifications.has(notificationId)) return

    let title = ""
    let description = ""
    let variant: "default" | "destructive" = "default"
    const dueDateStr = todo.dueDate ? format(new Date(todo.dueDate), "MMM d, yyyy") : ""
    const dueTimeStr = todo.dueTime || (todo.dueDate ? format(new Date(todo.dueDate), "h:mm a") : "")
    const fullDue = [dueDateStr, dueTimeStr ? `at ${dueTimeStr}` : ""].filter(Boolean).join(" ")

    if (type === "30min-before") {
      title = "Task Due Soon"
      description = `"${todo.title}" is due in 30 minutes (${fullDue})`
    } else if (type === "15min-before") {
      title = "Task Due Soon"
      description = `"${todo.title}" is due in 15 minutes (${fullDue})`
    } else if (type === "5min-before") {
      title = "Task Due Soon"
      description = `"${todo.title}" is due in 5 minutes (${fullDue})`
    } else if (type === "due-now") {
      title = "Task Due Now"
      description = `"${todo.title}" is due now (${fullDue})`
      variant = "destructive"
    } else if (type === "overdue") {
      title = "Task Overdue"
      description = `"${todo.title}" was due ${fullDue}`
      variant = "destructive"
    }

    // Show toast notification
    toast({
      title,
      description,
      variant,
    })

    // Show browser notification and play sound when notification is shown
    if ("Notification" in window && Notification.permission === "granted") {
      const notification = new Notification(title, {
        body: description,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: notificationId,
        requireInteraction: false,
        silent: false, // Allow browser to play default notification sound
      })
      
      // Play custom sound when notification is shown
      // This works because showing a notification is considered a user interaction
      notification.onclick = () => {
        window.focus()
      }
      
      // Try to play sound after notification is created
      // The notification API allows sounds when triggered by scheduled notifications
      setTimeout(() => {
        this.playNotificationSound()
      }, 100)
    } else {
      // If notifications aren't available, try to play sound anyway
      // This might fail due to autoplay policy, but we try
      this.playNotificationSound()
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