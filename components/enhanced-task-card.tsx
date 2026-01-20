"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { Task, Subtask } from "@/lib/types"
import { 
  ChevronDown, 
  Edit, 
  Trash2, 
  Calendar,
  Clock,
  AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { CircularProgress } from "@/components/circular-progress"
import { EnhancedSubtaskList } from "@/components/enhanced-subtask-list"
import { TaskDetailSheet } from "@/components/task-detail-sheet"
import { SwipeableTaskCard } from "@/components/swipeable-task-card"

export type TaskCardVariant = "ultra-minimal" | "premium-modern" | "dark-mode"

interface EnhancedTaskCardProps {
  task: Task
  onUpdate: (id: string, updates: Partial<Task>) => void
  onDelete: (id: string) => void
  variant?: TaskCardVariant
}

export function EnhancedTaskCard({ 
  task, 
  onUpdate, 
  onDelete,
  variant = "premium-modern"
}: EnhancedTaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isOverdue, setIsOverdue] = useState(false)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [showDetailSheet, setShowDetailSheet] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Calculate progress percentage
  const subtasks = task.subtasks || []
  const completedSubtasks = subtasks.filter(st => st.completed).length
  const totalSubtasks = subtasks.length
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0
  const isFullyCompleted = totalSubtasks > 0 && completedSubtasks === totalSubtasks

  // Check if task is overdue
  useEffect(() => {
    if (!task.dueDate || task.status === "COMPLETED") {
      setIsOverdue(false)
      return
    }

    const dueDate = new Date(task.dueDate)
    if (task.dueTime) {
      const [hours, minutes] = task.dueTime.split(":").map(Number)
      dueDate.setHours(hours, minutes, 0, 0)
    } else {
      dueDate.setHours(23, 59, 59, 999)
    }

    setIsOverdue(dueDate < new Date())
  }, [task.dueDate, task.dueTime, task.status])

  // Update task status when all subtasks are completed
  useEffect(() => {
    if (isFullyCompleted && task.status !== "COMPLETED" && totalSubtasks > 0) {
      onUpdate(task.id, { status: "COMPLETED" })
    }
  }, [isFullyCompleted, task.status, task.id, onUpdate, totalSubtasks])

  // Long press handler
  const handleLongPressStart = useCallback(() => {
    const timer = setTimeout(() => {
      setShowDetailSheet(true)
    }, 500) // 500ms long press
    setLongPressTimer(timer)
  }, [])

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }, [longPressTimer])

  // Get status badge
  const getStatusBadge = () => {
    if (task.status === "COMPLETED") {
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">Completed</Badge>
    }
    if (isOverdue) {
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">Overdue</Badge>
    }
    if (task.status === "PENDING") {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">Pending</Badge>
    }
    return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800">In Progress</Badge>
  }

  // Variant-specific styles
  const getVariantStyles = () => {
    switch (variant) {
      case "ultra-minimal":
        return {
          card: "border-0 shadow-none bg-transparent",
          content: "px-0 py-2",
        }
      case "premium-modern":
        return {
          card: "shadow-soft-md border border-border/50 bg-card/50 backdrop-blur-sm",
          content: "px-4 py-3",
        }
      case "dark-mode":
        return {
          card: "shadow-soft-lg border border-border bg-card",
          content: "px-4 py-3",
        }
      default:
        return {
          card: "shadow-soft-md border border-border/50 bg-card/50",
          content: "px-4 py-3",
        }
    }
  }

  const variantStyles = getVariantStyles()

  const handleSubtaskToggle = (subtaskId: string, completed: boolean) => {
    const updatedSubtasks = (task.subtasks || []).map(subtask =>
      subtask.id === subtaskId
        ? { ...subtask, completed, task_id: task.id }
        : { ...subtask, task_id: task.id }
    )
    onUpdate(task.id, { subtasks: updatedSubtasks })
  }

  const handleSubtaskAdd = (subtask: Subtask) => {
    const subtaskToAdd = { ...subtask, task_id: task.id }
    onUpdate(task.id, {
      subtasks: [
        ...(task.subtasks || []).map(st => ({ ...st, task_id: task.id })),
        subtaskToAdd,
      ],
    })
  }

  const handleSubtaskDelete = (subtaskId: string) => {
    onUpdate(task.id, {
      subtasks: (task.subtasks || []).filter(subtask => subtask.id !== subtaskId),
    })
  }

  return (
    <>
      <SwipeableTaskCard
        onSwipeLeft={() => {}}
        onEdit={() => setShowDetailSheet(true)}
        onDelete={() => onDelete(task.id)}
      >
        <Card
          ref={cardRef}
          className={cn(
            "rounded-xl transition-all duration-300",
            variantStyles.card,
            isOverdue && "border-amber-400 dark:border-amber-600",
            task.status === "COMPLETED" && "opacity-75",
            variant === "ultra-minimal" && "hover:bg-muted/30"
          )}
          onMouseDown={handleLongPressStart}
          onMouseUp={handleLongPressEnd}
          onMouseLeave={handleLongPressEnd}
          onTouchStart={handleLongPressStart}
          onTouchEnd={handleLongPressEnd}
        >
          <div className={cn("transition-all duration-300", variantStyles.content)}>
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer min-h-[44px]">
                  {/* Circular Progress Indicator */}
                  <div className="flex-shrink-0">
                    <CircularProgress
                      value={progress}
                      size={40}
                      strokeWidth={3}
                      className={cn(
                        "transition-all duration-500",
                        isFullyCompleted && "text-emerald-500"
                      )}
                    />
                  </div>

                  {/* Task Title and Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className={cn(
                          "font-semibold text-base leading-tight",
                          task.status === "COMPLETED" && "line-through text-muted-foreground",
                          isOverdue && "text-amber-600 dark:text-amber-400"
                        )}
                      >
                        {task.title}
                      </h3>
                      {getStatusBadge()}
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {task.description}
                      </p>
                    )}
                    {(task.dueDate || task.priority) && (
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {task.dueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(task.dueDate), "MMM d")}</span>
                            {task.dueTime && (
                              <>
                                <Clock className="h-3 w-3 ml-1" />
                                <span>{task.dueTime}</span>
                              </>
                            )}
                          </div>
                        )}
                        {isOverdue && (
                          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                            <AlertCircle className="h-3 w-3" />
                            <span>Overdue</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Chevron Icon */}
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  </motion.div>
                </div>
              </CollapsibleTrigger>

              {/* Subtasks Content */}
              <CollapsibleContent>
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <EnhancedSubtaskList
                      subtasks={subtasks}
                      onToggle={handleSubtaskToggle}
                      onAdd={handleSubtaskAdd}
                      onDelete={handleSubtaskDelete}
                      variant={variant}
                    />
                  </div>
                </motion.div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </Card>
      </SwipeableTaskCard>

      {/* Task Detail Sheet */}
      <TaskDetailSheet
        task={task}
        open={showDetailSheet}
        onOpenChange={setShowDetailSheet}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </>
  )
}
