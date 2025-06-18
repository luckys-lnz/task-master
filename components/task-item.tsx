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
import { Calendar, Clock, Trash2, Edit, ChevronDown, ChevronUp, GripVertical, AlarmClock, Plus, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Input } from "./ui/input"

interface TodoItemProps {
  todo: Task
  onUpdate: (id: string, updates: Partial<Task>) => void
  onDelete: (id: string) => void
}

export function TodoItem({ todo, onUpdate, onDelete }: TodoItemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isExpired, setIsExpired] = useState(false)
  const [isSubtasksOpen, setIsSubtasksOpen] = useState(false)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")
  const { toast } = useToast()

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
      }
    } else {
      setIsExpired(false)
    }
    return undefined
  }, [todo])

  const priorityColors = {
    LOW: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    HIGH: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  }

  const handleSubtaskToggle = (subtaskId: string, completed: boolean) => {
    interface UpdatedSubtask extends Subtask {
      completed: boolean
      task_id: string
    }

    const updatedSubtasks: UpdatedSubtask[] = (todo.subtasks ?? []).map((subtask: Subtask): UpdatedSubtask =>
      subtask.id === subtaskId
        ? { ...subtask, completed, task_id: (subtask as any).task_id ?? todo.id }
        : { ...subtask, task_id: (subtask as any).task_id ?? todo.id }
    )
    onUpdate(todo.id, { subtasks: updatedSubtasks })
  }

  const handleSubtaskAdd = (subtask: Subtask) => {
    onUpdate(todo.id, {
      subtasks: [
        ...(todo.subtasks || []).map((st) => ({
          ...st,
          task_id: st.task_id ? st.task_id : todo.id,
        })),
        { ...subtask, task_id: subtask.task_id ? subtask.task_id : todo.id },
      ],
    })
  }

  const handleSubtaskDelete = (subtaskId: string) => {
    onUpdate(todo.id, {
      subtasks: (todo.subtasks ?? []).filter((subtask: Subtask) => subtask.id !== subtaskId),
    })
  }

  const handleSnooze = () => {
    // Snooze options: 1 hour, 3 hours, tomorrow, next week
    const now = new Date()

    const options = [
      {
        label: "+1 hour",
        value: () => {
          const date = new Date(now)
          date.setHours(date.getHours() + 1)
          return date
        },
      },
      {
        label: "+3 hours",
        value: () => {
          const date = new Date(now)
          date.setHours(date.getHours() + 3)
          return date
        },
      },
      {
        label: "Tomorrow",
        value: () => {
          const date = new Date(now)
          date.setDate(date.getDate() + 1)
          date.setHours(9, 0, 0, 0) // 9 AM tomorrow
          return date
        },
      },
      {
        label: "Next week",
        value: () => {
          const date = new Date(now)
          date.setDate(date.getDate() + 7)
          date.setHours(9, 0, 0, 0) // 9 AM next week
          return date
        },
      },
    ]

    // Default to tomorrow
    const dueDate = options[2].value()

    onUpdate(todo.id, {
      dueDate: dueDate.toISOString(),
      dueTime: `${dueDate.getHours().toString().padStart(2, "0")}:${dueDate.getMinutes().toString().padStart(2, "0")}`,
    })

    toast({
      title: "Task snoozed",
      description: `Task "${todo.title}" snoozed until tomorrow at 9 AM`,
    })
  }

  const addSubtask = () => {
    if (!newSubtaskTitle.trim()) return

    const newSubtask = {
      id: crypto.randomUUID(),
      title: newSubtaskTitle,
      completed: false,
      task_id: todo.id,
    }

    onUpdate(todo.id, {
      ...todo,
      subtasks: [...(todo.subtasks || []), newSubtask],
    })

    setNewSubtaskTitle("")
  }

  const toggleSubtaskCompletion = (subtaskId: string) => {
    const updatedSubtasks = todo.subtasks?.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st,
    )

    onUpdate(todo.id, { ...todo, subtasks: updatedSubtasks })
  }

  const removeSubtask = (subtaskId: string) => {
    const updatedSubtasks = todo.subtasks?.filter((st) => st.id !== subtaskId)
    onUpdate(todo.id, { ...todo, subtasks: updatedSubtasks })
  }

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

            {(todo.dueDate || (todo.subtasks && todo.subtasks.length > 0)) && (
              <div className="mt-4">
                <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                  <div className="flex items-center justify-between">
                    {todo.dueDate && (
                      <div
                        className={`flex items-center text-sm ${isExpired ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}
                      >
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>Due: {format(new Date(todo.dueDate), "MMM d, yyyy")}</span>
                        {todo.dueTime && (
                          <>
                            <Clock className="h-4 w-4 ml-2 mr-1" />
                            <span>{todo.dueTime}</span>
                          </>
                        )}
                        {isExpired && !todo.completed && (
                          <Button variant="ghost" size="sm" onClick={handleSnooze} className="ml-2">
                            <AlarmClock className="h-4 w-4 mr-1" />
                            Snooze
                          </Button>
                        )}
                      </div>
                    )}

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
                    <SubtaskList
                      subtasks={todo.subtasks ?? []}
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

      {/* Subtasks Section */}
      <div className="mt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsSubtasksOpen(!isSubtasksOpen)}
          className="w-full flex justify-between items-center"
        >
          <span>Subtasks ({todo.subtasks?.length || 0})</span>
          {isSubtasksOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </Button>

        {isSubtasksOpen && (
          <div className="mt-2 space-y-2">
            {/* Add new subtask input */}
            <div className="flex gap-2">
              <Input
                placeholder="Add a subtask"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addSubtask()
                  }
                }}
              />
              <Button size="sm" onClick={addSubtask}>
                <Plus size={16} />
              </Button>
            </div>

            {/* Subtasks list */}
            <div className="space-y-2">
              {todo.subtasks?.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center justify-between gap-2 p-2 bg-secondary/50 rounded"
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={subtask.completed}
                      onCheckedChange={() => toggleSubtaskCompletion(subtask.id)}
                    />
                    <span className={subtask.completed ? "line-through text-muted-foreground" : ""}>
                      {subtask.title}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSubtask(subtask.id)}
                  >
                    <X size={16} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
