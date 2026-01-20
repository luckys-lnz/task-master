"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, Calendar, Clock, Edit, Trash2, Copy } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Task } from "@/lib/types"
import { EnhancedSubtaskList } from "@/components/enhanced-subtask-list"
import { DeleteTaskDialog } from "./delete-task-dialog"

interface EnhancedTaskCardProps {
  task: Task
  onUpdate: (id: string, updates: Partial<Task>) => void
  onDelete: (id: string) => void
  onEdit?: (task: Task) => void
  onDuplicate?: (task: Task) => void
}

export function EnhancedTaskCard({ task, onUpdate, onDelete, onEdit, onDuplicate }: EnhancedTaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isOverdue, setIsOverdue] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Calculate progress
  const subtasks = task.subtasks || []
  const completedSubtasks = subtasks.filter(st => st.completed).length
  const totalSubtasks = subtasks.length
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0
  const incompleteSubtasks = subtasks.filter(st => !st.completed)
  const hasIncompleteSubtasks = incompleteSubtasks.length > 0

  // Check if overdue and update status automatically
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

    const isOverdueNow = dueDate < new Date()
    setIsOverdue(isOverdueNow)

    // Automatically move overdue tasks to OVERDUE status
    // Use setTimeout to avoid updating during render
    if (isOverdueNow && task.status !== "COMPLETED" && task.status !== "OVERDUE") {
      const timeoutId = setTimeout(() => {
        onUpdate(task.id, {
          status: "OVERDUE",
          overdueAt: new Date().toISOString(),
        })
      }, 0)
      
      return () => clearTimeout(timeoutId)
    }
  }, [task.dueDate, task.dueTime, task.status, task.id, onUpdate])

  const getStatusBadge = () => {
    if (task.status === "COMPLETED") {
      return (
        <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30 dark:bg-accent/20 dark:text-accent dark:border-accent/40 text-xs font-semibold">
          Completed
        </Badge>
      )
    }
    if (isOverdue) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800 text-xs font-semibold">
          Overdue
        </Badge>
      )
    }
    if (task.status === "PENDING") {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 text-xs font-semibold">
          Pending
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 text-xs font-semibold">
        In Progress
      </Badge>
    )
  }

  const handleSubtaskToggle = (subtaskId: string, completed: boolean) => {
    const updatedSubtasks = (task.subtasks || []).map(subtask =>
      subtask.id === subtaskId
        ? { ...subtask, completed, task_id: task.id }
        : { ...subtask, task_id: task.id }
    )
    
    // Check if all subtasks are completed
    const allCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every(st => st.completed)
    
    // If all subtasks are completed and task is not already completed, mark task as completed
    const updates: Partial<Task> = { subtasks: updatedSubtasks }
    if (allCompleted && task.status !== "COMPLETED") {
      updates.status = "COMPLETED"
      updates.completedAt = new Date().toISOString()
    }
    
    onUpdate(task.id, updates)
  }

  const handleSubtaskAdd = (subtask: any) => {
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

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isOverdue && onEdit) {
      onEdit(task)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = () => {
    onDelete(task.id)
  }

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDuplicate) {
      onDuplicate(task)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ 
        layout: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
        opacity: { duration: 0.25 },
        y: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
        scale: { duration: 0.25 }
      }}
      className="relative"
    >
      <Card
        className={cn(
          "rounded-xl border-2 transition-all duration-300 hover:shadow-lg relative",
          isOverdue && "border-red-400 dark:border-red-600",
          task.status === "COMPLETED" && "opacity-75"
        )}
      >
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <div className="p-4 overflow-visible">
            {/* Header Section */}
            <div className="flex items-start gap-3 mb-3">
              {/* Task Content - Clickable */}
              <CollapsibleTrigger asChild>
                <div className="flex-1 min-w-0 space-y-2 cursor-pointer">
                  {/* Title and Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <h3
                      className={cn(
                        "font-bold text-lg leading-tight text-foreground flex-1",
                        task.status === "COMPLETED" && "line-through text-muted-foreground",
                        isOverdue && "text-red-600 dark:text-red-400 font-semibold"
                      )}
                    >
                      {task.title}
                    </h3>
                    {getStatusBadge()}
                  </div>

                  {/* Description */}
                  {task.description && (
                    <p className="text-sm font-medium text-muted-foreground line-clamp-2 leading-relaxed">
                      {task.description}
                    </p>
                  )}

                  {/* Mini Progress Bar */}
                  {totalSubtasks > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                        <span className="uppercase tracking-wide">Subtasks</span>
                        <span className="font-bold tabular-nums">{completedSubtasks}/{totalSubtasks}</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-accent to-accent/80 rounded-full"
                        />
                      </div>
                    </div>
                  )}

                  {/* Due Date */}
                  {task.dueDate && (
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{format(new Date(task.dueDate), "MMM d, yyyy")}</span>
                      {task.dueTime && (
                        <>
                          <Clock className="h-3.5 w-3.5 ml-1 flex-shrink-0" />
                          <span className="font-semibold">{task.dueTime}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </CollapsibleTrigger>

              {/* Chevron - Explicitly Clickable Button */}
              <CollapsibleTrigger asChild>
                <motion.button
                  type="button"
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0 p-1.5 rounded-md hover:bg-muted active:bg-muted/80 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 touch-manipulation flex items-center"
                  aria-label={isExpanded ? "Collapse subtasks" : "Expand subtasks"}
                  aria-expanded={isExpanded}
                >
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                </motion.button>
              </CollapsibleTrigger>
            </div>

            {/* Action Buttons - Bottom Right (Outside CollapsibleTrigger) */}
            <div className="flex items-center justify-end gap-2 sm:gap-2.5 pt-3 sm:pt-2 border-t border-border/50 relative z-10">
              {/* Duplicate Button - Show when overdue with incomplete subtasks */}
              {onDuplicate && isOverdue && hasIncompleteSubtasks && (
                <motion.button
                  type="button"
                  onClick={handleDuplicate}
                  className={cn(
                    "relative h-11 w-11 sm:h-9 sm:w-9 rounded-lg flex items-center justify-center",
                    "bg-muted/50 hover:bg-accent text-muted-foreground hover:text-accent-foreground",
                    "transition-all duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2",
                    "cursor-pointer group touch-manipulation"
                  )}
                  whileHover={{ 
                    scale: 1.1,
                    y: -2,
                    transition: { 
                      type: "spring",
                      stiffness: 400,
                      damping: 15
                    }
                  }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Duplicate task"
                  title="Duplicate task with uncompleted subtasks"
                >
                  {/* Pulsing glow effect */}
                  <motion.div
                    className="absolute inset-0 rounded-lg bg-accent/20"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  <motion.div
                    whileHover={{
                      rotate: [0, 180, 360],
                      transition: { duration: 0.6 }
                    }}
                    className="relative z-10"
                  >
                    <Copy className="h-4 w-4 sm:h-4 sm:w-4" strokeWidth={2.5} />
                  </motion.div>
                  {/* Shine effect on hover */}
                  <motion.div
                    className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-0 group-hover:opacity-100"
                    transition={{ duration: 0.3 }}
                  />
                </motion.button>
              )}

              {/* Edit Button */}
              {onEdit && (
                <motion.button
                  type="button"
                  onClick={handleEdit}
                  disabled={isOverdue}
                  className={cn(
                    "relative h-11 w-11 sm:h-9 sm:w-9 rounded-lg flex items-center justify-center",
                    "transition-all duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2",
                    "touch-manipulation",
                    isOverdue
                      ? "opacity-40 cursor-not-allowed bg-muted/50"
                      : "bg-muted/50 hover:bg-accent text-muted-foreground hover:text-accent-foreground cursor-pointer group"
                  )}
                  whileHover={!isOverdue ? { 
                    scale: 1.1,
                    y: -2,
                    transition: { 
                      type: "spring",
                      stiffness: 400,
                      damping: 15
                    }
                  } : {}}
                  whileTap={!isOverdue ? { 
                    scale: 0.95,
                    y: 0
                  } : {}}
                  aria-label="Edit task"
                  title={isOverdue ? "Cannot edit overdue tasks" : "Edit task"}
                >
                  {/* Pulsing glow effect */}
                  {!isOverdue && (
                    <motion.div
                      className="absolute inset-0 rounded-lg bg-accent/20"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  )}
                  <motion.div
                    whileHover={!isOverdue ? {
                      rotate: [0, -10, 10, -10, 0],
                      transition: { duration: 0.4 }
                    } : {}}
                    className="relative z-10"
                  >
                    <Edit className="h-4 w-4 sm:h-4 sm:w-4" strokeWidth={2.5} />
                  </motion.div>
                  {/* Shine effect on hover */}
                  {!isOverdue && (
                    <motion.div
                      className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-0 group-hover:opacity-100"
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </motion.button>
              )}

              {/* Delete Button with Enhanced Vibrate Animation */}
              <motion.button
                type="button"
                onClick={handleDelete}
                className={cn(
                  "relative h-11 w-11 sm:h-9 sm:w-9 rounded-lg flex items-center justify-center",
                  "bg-muted/50 hover:bg-red-500 text-muted-foreground hover:text-white",
                  "transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
                  "cursor-pointer group touch-manipulation",
                  "z-10"
                )}
                whileHover={{
                  scale: 1.15,
                  x: [0, -4, 4, -4, 4, -4, 0],
                  y: [0, -2, 2, -2, 2, -2, 0],
                  rotate: [0, -5, 5, -5, 5, -5, 0],
                  transition: { 
                    duration: 0.25, 
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatType: "reverse"
                  }
                }}
                whileTap={{ scale: 0.9 }}
                aria-label="Delete task"
                title="Delete task"
              >
                {/* Pulsing red glow effect on hover */}
                <motion.div
                  className="absolute inset-0 rounded-lg bg-red-500/30"
                  initial={{ scale: 0, opacity: 0 }}
                  whileHover={{
                    scale: [1, 1.4, 1],
                    opacity: [0.3, 0.7, 0.3],
                    transition: {
                      duration: 0.6,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }
                  }}
                />
                <motion.div
                  className="relative z-10"
                  whileHover={{
                    scale: [1, 1.15, 1],
                    rotate: [0, -8, 8, -8, 8, 0],
                    transition: {
                      duration: 0.3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 sm:h-4 sm:w-4" strokeWidth={2.5} />
                </motion.div>
              </motion.button>
            </div>
          </div>

          {/* Expanded Content */}
          <CollapsibleContent>
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 border-t border-border/50 pt-4">
                <EnhancedSubtaskList
                  subtasks={subtasks}
                  onToggle={handleSubtaskToggle}
                  onAdd={handleSubtaskAdd}
                  onDelete={handleSubtaskDelete}
                  variant="premium-modern"
                />
              </div>
            </motion.div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteTaskDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        taskTitle={task.title}
        onConfirm={handleConfirmDelete}
      />
    </motion.div>
  )
}
