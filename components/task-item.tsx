"use client"

import { useState, useEffect, useRef } from "react"
import * as React from "react"
import { format } from "date-fns"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { Task, Subtask as BaseSubtask } from "@/lib/types"
import { Calendar, Trash2, Edit, ChevronDown, ChevronUp, GripVertical, Plus } from "lucide-react"
import { TaskEditor } from "@/components/task-editor"
import {SubtaskList} from "@/components/subtask-list"
import { cn } from "@/lib/utils"
import { Confetti } from "@/components/confetti"

type SubtaskWithTaskId = BaseSubtask & { task_id: string }

interface TodoItemProps {
  todo: Task
  onUpdate: (id: string, updates: Partial<Task>, successMessage?: string) => void
  onDelete: (id: string) => void
}

export function TodoItem({ todo, onUpdate, onDelete }: TodoItemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isExpired, setIsExpired] = useState(false)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")
  const [justCompleted, setJustCompleted] = React.useState(false)
  const [showConfetti, setShowConfetti] = React.useState(false)
  const notificationRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const prevCompletedRef = React.useRef(todo.status === "COMPLETED")

  // Check if task is expired
  useEffect(() => {
    if (!todo.dueDate || todo.status === "COMPLETED") {
      setIsExpired(false)
      return undefined
    }

    const dueDate = new Date(todo.dueDate)
    if (todo.dueTime) {
      const [hours, minutes] = todo.dueTime.split(":").map(Number)
      dueDate.setHours(hours, minutes)
    } else {
      dueDate.setHours(23, 59, 59, 999)
    }

    const now = new Date()
    setIsExpired(dueDate < now)

    if (dueDate > now) {
      const timeUntilExpiry = dueDate.getTime() - now.getTime()
      const expiryTimeout = setTimeout(() => {
        setIsExpired(true)
      }, timeUntilExpiry)

      return () => clearTimeout(expiryTimeout)
    }

    return undefined
  }, [todo])

  // Notification for due tasks
  useEffect(() => {
    if (!todo.dueDate || todo.status === "COMPLETED") {
      return undefined
    }

    if (Notification.permission !== "granted") {
      Notification.requestPermission()
    }

    const now = new Date()
    const due = new Date(todo.dueDate)

    if (todo.dueTime) {
      const [hours, minutes] = todo.dueTime.split(":").map(Number)
      due.setHours(hours, minutes, 0, 0)
    } else {
      due.setHours(23, 59, 59, 999)
    }

    const diff = due.getTime() - now.getTime()

    if (diff > 0 && diff <= 15 * 60 * 1000) {
      const timeout = setTimeout(() => {
        if (Notification.permission === "granted") {
          new Notification("Task Due Soon!", {
            body: `${todo.title} is due at ${todo.dueTime || format(due, "p")}`,
          })
        }
      }, diff)

      notificationRef.current = timeout

      return () => {
        if (notificationRef.current) {
          clearTimeout(notificationRef.current)
          notificationRef.current = undefined
        }
      }
    }

    return undefined
  }, [todo.dueDate, todo.dueTime, todo.status, todo.title])

  const priorityColors = {
    LOW: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    HIGH: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  }

  const handleSubtaskToggle = (subtaskId: string, completed: boolean) => {
    const updatedSubtasks: SubtaskWithTaskId[] = (todo.subtasks ?? []).map((subtask) =>
      subtask.id === subtaskId
        ? { ...subtask, completed, task_id: todo.id }
        : { ...subtask, task_id: todo.id }
    ) as SubtaskWithTaskId[];
    onUpdate(todo.id, { subtasks: updatedSubtasks })
  }

  const handleSubtaskAdd = (subtask: BaseSubtask) => {
    const subtaskToAdd = { ...subtask, task_id: todo.id }
    onUpdate(todo.id, {
      subtasks: [
        ...(todo.subtasks || []).map(st => ({
          ...st,
          task_id: todo.id
        })),
        subtaskToAdd,
      ],
    })
  }

  const handleSubtaskDelete = (subtaskId: string) => {
    onUpdate(todo.id, {
      subtasks: (todo.subtasks ?? []).filter((subtask) => subtask.id !== subtaskId),
    })
  }

  React.useEffect(() => {
    if (!prevCompletedRef.current && todo.status === "COMPLETED") {
      setJustCompleted(true)
      setShowConfetti(true)
      setTimeout(() => {
        setJustCompleted(false)
        setShowConfetti(false)
      }, 600)
    }
    prevCompletedRef.current = todo.status === "COMPLETED"
  }, [todo.status])

  if (isEditing) {
    return (
      <TaskEditor
        task={todo}
        onSave={(updatedTodo: Partial<Task>) => {
          onUpdate(todo.id, updatedTodo)
          setIsEditing(false)
        }}
        onCancel={() => setIsEditing(false)}
      />
    )
  }

  return (
    <>
      <Confetti trigger={showConfetti} duration={1500} particleCount={30} />
      <Card 
        className={cn(
          "shadow-sm transition-spring hover-lift group",
          isExpired && "border-red-500 dark:border-red-700",
          todo.status === "COMPLETED" && "opacity-75",
          justCompleted && "animate-in fade-in slide-in-from-bottom-2"
        )}
        style={{
          transitionTimingFunction: "var(--spring-ease-out)",
        }}
      >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="flex items-center h-5 mt-0.5 sm:mt-1 flex-shrink-0">
            <GripVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground mr-1 sm:mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            <Checkbox
              checked={todo.status === "COMPLETED"}
              onCheckedChange={(checked) => {
                onUpdate(todo.id, {
                  status: checked ? "COMPLETED" : "PENDING",
                  completedAt: checked ? new Date().toISOString() : undefined
                }, checked ? "Task completed successfully" : "Task reopened successfully");
              }}
              id={`todo-${todo.id}`}
              className={cn(
                "transition-spring-fast",
                "hover:scale-110 active:scale-95",
                todo.status === "COMPLETED" && "data-[state=checked]:spring-bounce"
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-2 sm:gap-3">
              {/* Title and Badges Row */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor={`todo-${todo.id}`}
                    className={cn(
                      "text-base sm:text-lg font-semibold sm:font-medium block leading-tight",
                      todo.status === "COMPLETED" && "line-through text-muted-foreground",
                      isExpired && "text-red-600 dark:text-red-400"
                    )}
                  >
                    {todo.title}
                  </label>
                  {todo.description && (
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-1 line-clamp-2 leading-relaxed">
                      {todo.description}
                    </p>
                  )}
                </div>
                {/* Badges - Mobile Optimized */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {todo.category && (
                    <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                      {todo.category}
                    </Badge>
                  )}
                  {todo.priority && (
                    <Badge className={cn(
                      priorityColors[todo.priority as keyof typeof priorityColors],
                      "text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5"
                    )}>
                      {todo.priority}
                    </Badge>
                  )}
                  {todo.tags &&
                    todo.tags.slice(0, 2).map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                        {tag}
                      </Badge>
                    ))}
                  {todo.tags && todo.tags.length > 2 && (
                    <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                      +{todo.tags.length - 2}
                    </Badge>
                  )}
                </div>
              </div>

              {/* DUE DATE & TIME DISPLAY - Mobile Optimized */}
              <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                {todo.dueDate ? (
                  <span className="truncate">
                    Due: {format(new Date(todo.dueDate), "MMM d, yyyy")}
                    {todo.dueTime && <span className="hidden sm:inline"> at {todo.dueTime}</span>}
                  </span>
                ) : (
                  <span>No due date</span>
                )}
              </div>
            </div>

            {/* Subtasks Section - Mobile Optimized */}
            {(todo.subtasks?.length ?? 0) > 0 && (
              <div className="mt-3 sm:mt-4">
                <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                  <div className="flex items-center justify-between">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm">
                        <span className="mr-1.5 sm:mr-2 font-medium">
                          {(todo.subtasks ?? []).filter((st) => st.completed).length}/{(todo.subtasks ?? []).length}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent className="mt-3 sm:mt-4">
                    <div className="flex gap-2 mb-3 sm:mb-4">
                      <Input
                        placeholder="Add a subtask"
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            if (!newSubtaskTitle.trim()) return
                            handleSubtaskAdd({
                              id: crypto.randomUUID(),
                              title: newSubtaskTitle,
                              completed: false,
                            })
                            setNewSubtaskTitle("")
                          }
                        }}
                        className="text-xs sm:text-sm h-8 sm:h-9"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          if (!newSubtaskTitle.trim()) return
                          handleSubtaskAdd({
                            id: crypto.randomUUID(),
                            title: newSubtaskTitle,
                            completed: false,
                          })
                          setNewSubtaskTitle("")
                        }}
                        className="h-8 sm:h-9 w-8 sm:w-9 p-0"
                      >
                        <Plus size={14} className="sm:h-4 sm:w-4" />
                      </Button>
                    </div>

                    <SubtaskList
                      subtasks={todo.subtasks || []}
                      onToggle={handleSubtaskToggle}
                      onAdd={handleSubtaskAdd}
                      onDelete={handleSubtaskDelete}
                    />
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-3 sm:px-4 py-2 flex justify-end gap-2 bg-muted/50">
        {/* Only show edit button if task is not overdue */}
        {!isExpired && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsEditing(true)}
            className="hover-scale transition-smooth hover:bg-accent text-xs sm:text-sm"
          >
            <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 transition-transform duration-200 group-hover:rotate-12" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
        )}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onDelete(todo.id)}
          className="hover-scale transition-smooth hover:bg-destructive/10 hover:text-destructive shake-on-hover text-xs sm:text-sm"
        >
          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 transition-transform duration-200 hover:scale-110" />
          <span className="hidden sm:inline">Delete</span>
        </Button>
      </CardFooter>
    </Card>
    </>
  )
}