"use client"

import { useState, useEffect, useRef } from "react"
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

type SubtaskWithTaskId = BaseSubtask & { task_id: string }

interface TodoItemProps {
  todo: Task
  onUpdate: (id: string, updates: Partial<Task>) => void
  onDelete: (id: string) => void
}

export function TodoItem({ todo, onUpdate, onDelete }: TodoItemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isExpired, setIsExpired] = useState(false)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")
  const notificationRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Check if task is expired
  useEffect(() => {
    if (!todo.dueDate || todo.completed) {
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
    if (!todo.dueDate || todo.completed) {
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
  }, [todo.dueDate, todo.dueTime, todo.completed, todo.title])

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
    <Card className={`shadow-sm transition-all duration-300 ${isExpired ? "border-red-500 dark:border-red-700" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex items-center h-5 mt-1">
            <GripVertical className="h-4 w-4 text-muted-foreground mr-2" />
            <Checkbox
              checked={todo.completed}
              onCheckedChange={(checked) => onUpdate(todo.id, { completed: !!checked })}
              id={`todo-${todo.id}`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex-1">
                <label
                  htmlFor={`todo-${todo.id}`}
                  className={`text-lg font-medium ${todo.completed ? "line-through text-muted-foreground" : ""} ${isExpired ? "text-red-600 dark:text-red-400" : ""}`}
                >
                  {todo.title}
                </label>
                {todo.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{todo.description}</p>
                )}

                {/* DUE DATE & TIME DISPLAY - ALWAYS VISIBLE */}
                <div className="flex items-center text-sm mt-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  {todo.dueDate ? (
                    <span>
                      Due: {format(new Date(todo.dueDate), "MMM d, yyyy")}
                      {todo.dueTime && <> at {todo.dueTime}</>}
                    </span>
                  ) : (
                    <span>No due date</span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                {todo.category && <Badge variant="outline">{todo.category}</Badge>}
                {todo.priority && (
                  <Badge className={priorityColors[todo.priority as keyof typeof priorityColors]}>
                    {todo.priority}
                  </Badge>
                )}
                {todo.tags &&
                  todo.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
              </div>
            </div>

            {/* Subtasks Section */}
            {(todo.subtasks?.length ?? 0) > 0 && (
              <div className="mt-4">
                <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                  <div className="flex items-center justify-between">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <span className="mr-1">
                          {(todo.subtasks ?? []).filter((st) => st.completed).length}/{(todo.subtasks ?? []).length}
                        </span>
                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent className="mt-4">
                    <div className="flex gap-2 mb-4">
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
                      >
                        <Plus size={16} />
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
      <CardFooter className="px-4 py-2 flex justify-end gap-2 bg-muted/50">
        <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(todo.id)}>
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  )
}