"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { Task, Subtask as BaseSubtask } from "@/lib/types"

type Subtask = BaseSubtask & { task_id?: string }
import { TaskEditor } from "@/components/task-editor"
import { SubtaskList } from "@/components/subtask-list"
import { Calendar, Clock, Trash2, Edit, ChevronDown, ChevronUp, GripVertical, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Input } from "./ui/input"


interface TodoItemProps {
  todo: Task
  onUpdate: (id: string, updates: Partial<Task>) => void
  onDelete: (id: string) => void
}

export function TodoItem({ todo, onUpdate, onDelete }: TodoItemProps) {
  const [isOpen, setIsOpen] = useState(false) // Controls the main collapsible (for subtasks and description if present)
  const [isEditing, setIsEditing] = useState(false)
  const [isExpired, setIsExpired] = useState(false)
  // const [isSubtasksOpen, setIsSubtasksOpen] = useState(false) // REMOVED: This state is no longer needed
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")
  useToast()

  // Check if task is expired
  useEffect(() => {
    if (todo.dueDate && !todo.completed) {
      const dueDate = new Date(todo.dueDate)
      if (todo.dueTime) {
        const [hours, minutes] = todo.dueTime.split(":").map(Number)
        dueDate.setHours(hours, minutes)
      } else {
        dueDate.setHours(23, 59, 59, 999) // End of day if no time specified
      }

      const now = new Date()
      setIsExpired(dueDate < now)

      // Set up auto-expiry check
      if (dueDate > now) {
        const timeUntilExpiry = dueDate.getTime() - now.getTime()
        const expiryTimeout = setTimeout(() => {
          setIsExpired(true)
        }, timeUntilExpiry)

        return () => clearTimeout(expiryTimeout)
      } else {
        return undefined
      }
    } else {
      setIsExpired(false)
      return undefined
    }
  }, [todo])

  // Notification for due tasks
  useEffect(() => {
    if (!todo.dueDate || todo.completed) return

    // Request permission if not already granted
    if (Notification.permission !== "granted") {
      Notification.requestPermission()
    }

    const now = new Date()
    const due = new Date(todo.dueDate)
    if (todo.dueTime) {
      const [h, m] = todo.dueTime.split(":").map(Number)
      due.setHours(h, m, 0, 0)
    } else {
      due.setHours(23, 59, 59, 999)
    }
    const diff = due.getTime() - now.getTime()

    // If due in the future and within 15 minutes, schedule notification
    if (diff > 0 && diff <= 15 * 60 * 1000) {
      const timeout = setTimeout(() => {
        if (Notification.permission === "granted") {
          new Notification("Task Due Soon!", {
            body: `${todo.title} is due at ${todo.dueTime || format(due, "p")}`,
          })
        }
      }, diff)

      return () => clearTimeout(timeout)
    }
    return undefined;
  }, [todo.dueDate, todo.dueTime, todo.completed, todo.title])

  const priorityColors = {
    LOW: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    HIGH: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  }

  // The SubtaskList component itself handles adding/toggling/deleting.
  // These handlers are passed down to SubtaskList.
  const handleSubtaskToggle = (subtaskId: string, completed: boolean) => {
    // Note: The `task_id` property might not be strictly necessary here if it's always `todo.id`
    // but keeping it as it was in the original logic.
    const updatedSubtasks = (todo.subtasks ?? []).map((subtask: BaseSubtask) =>
      subtask.id === subtaskId
        ? { ...subtask, completed, task_id: todo.id } // Ensure task_id is set
        : { ...subtask, task_id: todo.id } // Ensure task_id is set for others too
    )
    onUpdate(todo.id, { subtasks: updatedSubtasks })
  }

  const handleSubtaskAdd = (subtask: Subtask) => {
    onUpdate(todo.id, {
      subtasks: [
        ...(todo.subtasks || []).map(st => ({
          ...st,
          task_id: todo.id // Ensure task_id is always set
        })),
        { ...subtask, task_id: todo.id }, // Ensure task_id is set for new subtask
      ],
    })
  }

  const handleSubtaskDelete = (subtaskId: string) => {
    onUpdate(todo.id, {
      subtasks: (todo.subtasks ?? []).filter((subtask: BaseSubtask) => subtask.id !== subtaskId),
    })
  }

  // NOTE: The `addSubtask`, `toggleSubtaskCompletion`, `removeSubtask` functions
  // below are redundant given `SubtaskList` already handles these actions
  // via `handleSubtaskToggle`, `handleSubtaskAdd`, `handleSubtaskDelete`.
  // I'm keeping them commented out but will remove the UI section that called them.

  // const addSubtask = () => {
  //   if (!newSubtaskTitle.trim()) return

  //   const newSubtask = {
  //     id: crypto.randomUUID(),
  //     title: newSubtaskTitle,
  //     completed: false,
  //     task_id: todo.id,
  //   }
  //   handleSubtaskAdd(newSubtask); // Use the existing handler
  //   setNewSubtaskTitle("")
  // }

  // const toggleSubtaskCompletion = (subtaskId: string) => {
  //   const subtaskToToggle = todo.subtasks?.find(st => st.id === subtaskId);
  //   if (subtaskToToggle) {
  //     handleSubtaskToggle(subtaskId, !subtaskToToggle.completed); // Use existing handler
  //   }
  // }

  // const removeSubtask = (subtaskId: string) => {
  //   handleSubtaskDelete(subtaskId); // Use existing handler
  // }

  if (isEditing) {
    return (
      <TaskEditor
        task={todo}
        onSave={(updatedTodo: Partial<Task>) => {
          onUpdate(todo.id, updatedTodo)
          setIsEditing(false)
        }}
        onCancel={(): void => setIsEditing(false)}
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
                {todo.dueDate && (
                  <div className="flex items-center text-sm mt-2 text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>
                      Due date: {format(new Date(todo.dueDate), "MMM d, yyyy")}
                    </span>
                    {todo.dueTime && (
                      <>
                        <Clock className="h-4 w-4 ml-4 mr-1" />
                        <span>
                          Due time: {todo.dueTime}
                        </span>
                      </>
                    )}
                  </div>
                )}
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

            {/* This collapsible block handles subtasks and now serves as the single source for them */}
            {(todo.subtasks && todo.subtasks.length > 0) && ( // Only show collapsible if there are subtasks
              <div className="mt-4">
                <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                  <div className="flex items-center justify-between">
                    {(todo.subtasks ?? []).length > 0 && (
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <span className="mr-1">
                            {(todo.subtasks ?? []).filter((st: Subtask) => st.completed).length}/{(todo.subtasks ?? []).length}
                          </span>
                          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </CollapsibleTrigger>
                    )}
                  </div>

                  <CollapsibleContent className="mt-4">
                    {/* Add new subtask input within this collapsible */}
                    <div className="flex gap-2 mb-4"> {/* Added margin-bottom for spacing */}
                      <Input
                        placeholder="Add a subtask"
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            // Call handleSubtaskAdd from within this component
                            handleSubtaskAdd({
                                id: crypto.randomUUID(),
                                title: newSubtaskTitle,
                                completed: false,
                                task_id: todo.id,
                            });
                            setNewSubtaskTitle("");
                          }
                        }}
                      />
                      <Button size="sm" onClick={() => {
                        handleSubtaskAdd({
                            id: crypto.randomUUID(),
                            title: newSubtaskTitle,
                            completed: false,
                            task_id: todo.id,
                        });
                        setNewSubtaskTitle("");
                      }}>
                        <Plus size={16} />
                      </Button>
                    </div>
                    <SubtaskList
                      subtasks={todo.subtasks ?? []}
                      onToggle={handleSubtaskToggle}
                      onAdd={handleSubtaskAdd} // This might be redundant if we add input here
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

      {/* REMOVED: The entire "Subtasks Section" that was at the very bottom */}
      {/* because its functionality is now integrated into the main collapsible */}
    </Card>
  )
}