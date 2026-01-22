import { toast } from "@/components/ui/use-toast"
import type { Task } from "@/lib/types"
import { format } from "date-fns"


export class NotificationService {
  private static instance: NotificationService
  private notifications: Map<string, NodeJS.Timeout> = new Map()
  private scheduled: Map<string, NodeJS.Timeout[]> = new Map()
  private currentTodos: Task[] = [] // Store current todos for state checks in timeouts
  private getFreshTodos: (() => Task[]) | null = null // Function to get fresh todos

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

  private shouldSkipNotifications(todo: Task): boolean {
    // Skip if notifications are muted
    if (todo.notificationsMuted) return true
    
    // Skip if snoozed and snooze hasn't expired
    if (todo.snoozedUntil) {
      const snoozeDate = new Date(todo.snoozedUntil)
      if (snoozeDate > new Date()) {
        return true // Still snoozed
      }
    }
    
    return false
  }

  private scheduleNotificationsForTask(todo: Task) {
    if (todo.status === "COMPLETED" || !todo.dueDate) return
    
    // Skip notifications if muted or snoozed
    if (this.shouldSkipNotifications(todo)) return
    
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
        const currentTask = this.currentTodos.find(t => t.id === todo.id) || todo
        this.notifyTodoistStyle(currentTask, "30min-before")
      }, timeTo30MinBefore))
    }
    
    // 15 minutes before due
    if (timeTo15MinBefore > 0) {
      timeouts.push(setTimeout(() => {
        const currentTask = this.currentTodos.find(t => t.id === todo.id) || todo
        this.notifyTodoistStyle(currentTask, "15min-before")
      }, timeTo15MinBefore))
    }
    
    // 5 minutes before due
    if (timeTo5MinBefore > 0) {
      timeouts.push(setTimeout(() => {
        const currentTask = this.currentTodos.find(t => t.id === todo.id) || todo
        this.notifyTodoistStyle(currentTask, "5min-before")
      }, timeTo5MinBefore))
    }
    
    // At due time
    if (timeToDue > 0) {
      timeouts.push(setTimeout(() => {
        const currentTask = this.currentTodos.find(t => t.id === todo.id) || todo
        this.notifyTodoistStyle(currentTask, "due-now")
      }, timeToDue))
    }
    
    // Overdue (if not completed)
    // Only notify about overdue tasks once per day to avoid spam
    // But skip if muted or snoozed
    if (timeToDue < 0) {
      // Get fresh task state to check snooze/mute
      let currentTask = this.currentTodos.find(t => t.id === todo.id)
      if (!currentTask && this.getFreshTodos) {
        const freshTodos = this.getFreshTodos()
        currentTask = freshTodos.find(t => t.id === todo.id)
        if (currentTask) {
          const index = this.currentTodos.findIndex(t => t.id === todo.id)
          if (index >= 0) {
            this.currentTodos[index] = currentTask
          } else {
            this.currentTodos.push(currentTask)
          }
        }
      }
      const taskToCheck = currentTask || todo
      
      // Skip if muted or snoozed - check current state
      if (this.shouldSkipNotifications(taskToCheck)) {
        // Task is muted/snoozed, don't notify
        return
      }
      
      // Check if we've already notified about this overdue task today
      const today = new Date().toDateString()
      
      // Check localStorage to see if we've notified today
      if (typeof window !== 'undefined') {
        const lastNotifiedDate = localStorage.getItem(`overdue-notified-${taskToCheck.id}`)
        if (lastNotifiedDate === today) {
          // Already notified today, skip
          return
        }
      }
      
      // Notify and mark as notified for today
      this.notifyTodoistStyle(taskToCheck, "overdue")
      if (typeof window !== 'undefined') {
        localStorage.setItem(`overdue-notified-${taskToCheck.id}`, today)
      }
    } else {
      // Schedule overdue notification right after due time
      timeouts.push(setTimeout(() => {
        // Get fresh task state (in case it was muted/snoozed in the meantime)
        let currentTask = this.currentTodos.find(t => t.id === todo.id)
        
        // If not found in currentTodos, try to get fresh todos
        if (!currentTask && this.getFreshTodos) {
          const freshTodos = this.getFreshTodos()
          currentTask = freshTodos.find(t => t.id === todo.id)
          // Update currentTodos with fresh data
          if (currentTask) {
            const index = this.currentTodos.findIndex(t => t.id === todo.id)
            if (index >= 0) {
              this.currentTodos[index] = currentTask
            } else {
              this.currentTodos.push(currentTask)
            }
          }
        }
        
        const taskToNotify = currentTask || todo
        
        // Check again when notification fires - this is critical!
        if (this.shouldSkipNotifications(taskToNotify)) {
          // Task was muted/snoozed, don't notify
          return
        }
        
        // Check if we've already notified today
        if (typeof window !== 'undefined') {
          const today = new Date().toDateString()
          const lastNotifiedDate = localStorage.getItem(`overdue-notified-${taskToNotify.id}`)
          if (lastNotifiedDate === today) {
            // Already notified today, skip
            return
          }
          // Mark as notified when it becomes overdue
          localStorage.setItem(`overdue-notified-${taskToNotify.id}`, today)
        }
        
        this.notifyTodoistStyle(taskToNotify, "overdue")
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
    // Final check: skip if muted or snoozed
    if (this.shouldSkipNotifications(todo)) return
    
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

  public startMonitoring(todos: Task[] | (() => Task[])) {
    // Clear all scheduled notifications
    this.scheduled.forEach((timeouts) => {
      timeouts.forEach(clearTimeout)
    })
    this.scheduled.clear()
    this.notifications.clear()

    // Clean up old overdue notification tracking (older than today)
    if (typeof window !== 'undefined') {
      const today = new Date().toDateString()
      const keysToRemove: string[] = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('overdue-notified-')) {
          const notifiedDate = localStorage.getItem(key)
          // Remove if it's from a previous day
          if (notifiedDate && notifiedDate !== today) {
            keysToRemove.push(key)
          }
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key))
    }

    // Store function to get fresh todos
    if (typeof todos === 'function') {
      this.getFreshTodos = todos
      this.currentTodos = todos()
    } else {
      this.currentTodos = todos
      this.getFreshTodos = () => todos
    }

    // Schedule notifications for all tasks
    this.currentTodos.forEach(todo => this.scheduleNotificationsForTask(todo))

    // Re-schedule every 5 minutes in case tasks change
    const interval = setInterval(() => {
      if (this.getFreshTodos) {
        const freshTodos = this.getFreshTodos()
        this.currentTodos = freshTodos
        freshTodos.forEach(todo => this.scheduleNotificationsForTask(todo))
      }
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }

  // Method to immediately update notifications for a specific task
  public updateTaskNotifications(task: Task) {
    // Clear existing notifications for this task
    this.clearScheduled(task.id)
    
    // Update currentTodos with the new task state
    const taskIndex = this.currentTodos.findIndex(t => t.id === task.id)
    if (taskIndex >= 0) {
      this.currentTodos[taskIndex] = task
    } else {
      this.currentTodos.push(task)
    }
    
    // Re-schedule notifications for this task
    this.scheduleNotificationsForTask(task)
  }

  public async requestNotificationPermission() {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission()
      return permission === "granted"
    }
    return false
  }
} 