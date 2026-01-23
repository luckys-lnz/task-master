"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useDatabaseTodos } from "@/hooks/use-db-tasks"
import { AnalyticsSection } from "./analytics-section"
import { PillFilters, type FilterType } from "./pill-filters"
import { EnhancedTaskCard } from "./enhanced-task-card"
import { AddTaskModal } from "./add-task-modal"
import { EditTaskModal } from "./edit-task-modal"
import { FloatingActionButton } from "./floating-action-button"
import { EnhancedEmptyState } from "@/components/enhanced-empty-state"
import { TaskSkeleton } from "@/components/task-skeleton"
import { OnboardingGreeting } from "./onboarding-greeting"
import { WelcomeMessage } from "./welcome-message"
import type { Task } from "@/lib/types"
import { isSameDay, isAfter, startOfDay } from "date-fns"
import { NotificationService } from "@/lib/services/notifications"

interface ComprehensiveDashboardProps {
  userName?: string
  dbConnected?: boolean
}

export function ComprehensiveDashboard({ userName }: ComprehensiveDashboardProps) {
  const {
    todos,
    isLoading,
    addTodo,
    updateTodo,
    deleteTodo,
  } = useDatabaseTodos()

  const [mounted, setMounted] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [duplicateTaskData, setDuplicateTaskData] = useState<{
    title?: string
    description?: string
    priority?: Task["priority"]
    subtasks?: Task["subtasks"]
    duplicatedFromTaskId?: string
  } | null>(null)
  const [isFiltering, setIsFiltering] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Initialize notification service
  useEffect(() => {
    if (!mounted || isLoading) return
    
    const notificationService = NotificationService.getInstance()
    
    // Request notification permission
    notificationService.requestNotificationPermission()
    
    // Start monitoring tasks with a function that gets fresh todos
    const cleanup = notificationService.startMonitoring(() => todos || [])
    
    return () => cleanup()
  }, [mounted, isLoading, todos])

  // Check if we should show onboarding after data loads
  useEffect(() => {
    if (!mounted || isLoading) return
    
    // Check if user is new (no tasks) or check URL params for new signup
    const urlParams = new URLSearchParams(window.location.search)
    const isNewSignup = urlParams.get("new") === "true"
    const hasNoTasks = todos && todos.length === 0
    
    // Show onboarding for new signups or users with no tasks (first time)
    if (isNewSignup || hasNoTasks) {
      setShowOnboarding(true)
      // Clean up URL param if present
      if (isNewSignup) {
        window.history.replaceState({}, '', '/dashboard')
      }
    }
  }, [mounted, isLoading, todos])

  // Handle filter change with smooth transition
  const handleFilterChange = (filter: FilterType) => {
    if (filter === activeFilter) return
    
    setIsFiltering(true)
    
    // Small delay to show transition state
    setTimeout(() => {
      setActiveFilter(filter)
      setTimeout(() => {
        setIsFiltering(false)
      }, 300)
    }, 50)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+N: New task
      if (e.altKey && e.key === "n") {
        e.preventDefault()
        setShowAddModal(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Filter tasks based on active filter
  const filteredTasks = useMemo(() => {
    if (!todos) return []

    let filtered = [...todos]

    switch (activeFilter) {
      case "today":
        filtered = filtered.filter(task => {
          if (!task.dueDate) return false
          return isSameDay(new Date(task.dueDate), new Date())
        })
        break
      case "upcoming":
        filtered = filtered.filter(task => {
          if (!task.dueDate) return false
          return isAfter(startOfDay(new Date(task.dueDate)), startOfDay(new Date()))
        })
        break
      case "inProgress":
        filtered = filtered.filter(task => task.status === "PENDING")
        break
      case "completed":
        filtered = filtered.filter(task => task.status === "COMPLETED")
        break
      case "overdue":
        filtered = filtered.filter(task => {
          if (!task.dueDate || task.status === "COMPLETED") return false
          const dueDate = new Date(task.dueDate)
          if (task.dueTime) {
            const [hours, minutes] = task.dueTime.split(":").map(Number)
            dueDate.setHours(hours, minutes, 0, 0)
          } else {
            dueDate.setHours(23, 59, 59, 999)
          }
          return dueDate < new Date()
        })
        break
      default:
        // "all" - no filtering
        break
    }

    // Sort tasks by timestamp (due date/time), with overdue and completed at bottom
    filtered.sort((a, b) => {
      // Helper function to get full timestamp (date + time)
      const getTimestamp = (task: Task): number => {
        if (!task.dueDate) return 0
        const date = new Date(task.dueDate)
        if (task.dueTime) {
          const [hours, minutes] = task.dueTime.split(":").map(Number)
          date.setHours(hours, minutes, 0, 0)
        } else {
          date.setHours(23, 59, 59, 999)
        }
        return date.getTime()
      }
      
      // Separate overdue and completed tasks - they go to the bottom
      const aIsOverdueOrCompleted = a.status === "OVERDUE" || a.status === "COMPLETED"
      const bIsOverdueOrCompleted = b.status === "OVERDUE" || b.status === "COMPLETED"
      
      // If one is overdue/completed and the other isn't, overdue/completed goes to bottom
      if (aIsOverdueOrCompleted && !bIsOverdueOrCompleted) return 1
      if (!aIsOverdueOrCompleted && bIsOverdueOrCompleted) return -1
      
      // If both are overdue/completed, sort them by timestamp (most recent first)
      if (aIsOverdueOrCompleted && bIsOverdueOrCompleted) {
        const aTimestamp = getTimestamp(a)
        const bTimestamp = getTimestamp(b)
        return bTimestamp - aTimestamp // Most recent first
      }
      
      // For active tasks, sort by due date/time (earliest first)
      // Tasks without due dates go to the end (but before overdue/completed)
      const aTimestamp = getTimestamp(a)
      const bTimestamp = getTimestamp(b)
      
      if (aTimestamp === 0 && bTimestamp === 0) return 0
      if (aTimestamp === 0) return 1
      if (bTimestamp === 0) return -1

      // Sort by date-time (earliest first)
      return aTimestamp - bTimestamp
    })

    return filtered
  }, [todos, activeFilter])

  const handleAddTask = async (task: Partial<Task>) => {
    const isDuplicate = !!(task as Task).duplicatedFromTaskId
    const newTask = await addTodo(task as Task, isDuplicate ? "Task duplicated successfully" : "Task added successfully")
    
    // Immediately update notification service for the new task
    if (newTask) {
      const notificationService = NotificationService.getInstance()
      notificationService.updateTaskNotifications(newTask)
    }
    
    setDuplicateTaskData(null) // Clear duplicate data after adding
  }

  const handleDuplicateTask = (task: Task) => {
    // Get uncompleted subtasks
    const uncompletedSubtasks = (task.subtasks || []).filter(st => !st.completed)
    
    // Set duplicate data and open add modal
    // Store the original task ID so we can track it
    setDuplicateTaskData({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      subtasks: uncompletedSubtasks.map(st => ({
        id: st.id,
        title: st.title,
        completed: false,
        task_id: ""
      })),
      duplicatedFromTaskId: task.id, // Track which task this was duplicated from
    })
    setShowAddModal(true)
  }

  // Track when duplicated tasks have subtasks completed to auto-mute original
  const handleTaskUpdate = async (id: string, updates: Partial<Task>, successMessage?: string) => {
    await updateTodo(id, updates, successMessage)
    
    // Immediately update notification service if any notification-related fields changed
    // This includes: time fields (startTime, endTime, dueDate, dueTime), notification settings, or status
    const shouldUpdateNotifications = 
      updates.notificationsMuted !== undefined || 
      updates.snoozedUntil !== undefined ||
      updates.startTime !== undefined ||
      updates.endTime !== undefined ||
      updates.dueDate !== undefined ||
      updates.dueTime !== undefined ||
      updates.notifyOnStart !== undefined ||
      updates.status !== undefined
    
    if (shouldUpdateNotifications) {
      // Use a small delay to ensure state has updated
      setTimeout(() => {
        const updatedTask = todos?.find(t => t.id === id)
        if (updatedTask) {
          const notificationService = NotificationService.getInstance()
          notificationService.updateTaskNotifications(updatedTask)
        }
      }, 200)
    }
    
    // Check if this is a duplicated task with completed subtasks
    // If so, mute notifications on the original task
    if (updates.subtasks && updates.subtasks.length > 0) {
      // Wait a bit for the update to complete, then check
      setTimeout(() => {
        const task = todos?.find(t => t.id === id)
        if (task?.duplicatedFromTaskId) {
          const completedCount = updates.subtasks!.filter(st => st.completed).length
          
          // If at least one subtask is completed, mute the original task
          if (completedCount > 0) {
            const originalTask = todos?.find(t => t.id === task.duplicatedFromTaskId)
            if (originalTask && !originalTask.notificationsMuted && !originalTask.partiallyResolved) {
              updateTodo(originalTask.id, {
                notificationsMuted: true,
                partiallyResolved: true,
              }, "Original task alerts muted (subtasks completed in duplicate)").then(() => {
                // Update notification service for the original task too
                setTimeout(() => {
                  const mutedTask = todos?.find(t => t.id === originalTask.id)
                  if (mutedTask) {
                    const notificationService = NotificationService.getInstance()
                    notificationService.updateTaskNotifications(mutedTask)
                  }
                }, 200)
              })
            }
          }
        }
      }, 200)
    }
  }

  // Determine if user is new (no tasks)
  const isNewUser = todos && todos.length === 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Onboarding Greeting */}
      {userName && showOnboarding && (
        <OnboardingGreeting
          userName={userName}
          isNewUser={isNewUser}
          onDismiss={() => setShowOnboarding(false)}
        />
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 pt-24 pb-20 sm:pb-24">
        <div className="space-y-8">
          {/* Welcome Message */}
          {userName && (
            <WelcomeMessage userName={userName} />
          )}

          {/* Analytics Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
          >
            <AnalyticsSection tasks={todos || []} />
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
          >
            <PillFilters
              activeFilter={activeFilter}
              onFilterChange={handleFilterChange}
            />
          </motion.div>

          {/* Task List with Enhanced Animations */}
          <motion.div
            key={activeFilter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative"
          >
            {/* Transition Overlay */}
            <AnimatePresence>
              {isFiltering && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 rounded-lg pointer-events-none"
                />
              )}
            </AnimatePresence>

            {isLoading ? (
              <TaskSkeleton />
            ) : filteredTasks.length > 0 ? (
              <motion.div
                layout
                className="space-y-3"
                initial={false}
              >
                <AnimatePresence mode="popLayout">
                  {filteredTasks.map((task, index) => (
                    <motion.div
                      key={`${activeFilter}-${task.id}`}
                      layout
                      initial={{ 
                        opacity: 0, 
                        y: 20,
                        scale: 0.95
                      }}
                      animate={{ 
                        opacity: 1, 
                        y: 0,
                        scale: 1
                      }}
                      exit={{ 
                        opacity: 0, 
                        y: -10,
                        scale: 0.95,
                        transition: { duration: 0.2 }
                      }}
                      transition={{
                        layout: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                        opacity: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
                        y: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                        scale: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
                        delay: index * 0.03
                      }}
                      style={{ originX: 0.5, originY: 0 }}
                    >
                      <EnhancedTaskCard
                        task={task}
                        onUpdate={handleTaskUpdate}
                        onDelete={deleteTodo}
                        onEdit={(task) => {
                          setEditingTask(task)
                          setShowEditModal(true)
                        }}
                        onDuplicate={handleDuplicateTask}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                key={`empty-${activeFilter}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              >
                <EnhancedEmptyState
                  variant={activeFilter !== "all" ? "filtered" : "tasks"}
                  filterType={activeFilter}
                  onAction={() => setShowAddModal(true)}
                  actionLabel="Create Your First Task"
                />
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton onClick={() => setShowAddModal(true)} />

      {/* Add Task Modal */}
      <AddTaskModal
        open={showAddModal}
        onOpenChange={(open) => {
          setShowAddModal(open)
          if (!open) setDuplicateTaskData(null) // Clear duplicate data when modal closes
        }}
        onAdd={handleAddTask}
        initialData={duplicateTaskData || undefined}
      />

      {/* Edit Task Modal */}
      <EditTaskModal
        open={showEditModal}
        onOpenChange={(open) => {
          setShowEditModal(open)
          if (!open) setEditingTask(null)
        }}
        task={editingTask}
        onUpdate={updateTodo}
      />
    </div>
  )
}
