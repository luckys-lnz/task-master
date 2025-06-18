"use client"

import { useState, useEffect } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { useToast } from "@/hooks/use-toast"
import { TodoItem } from "@/components/task-item"
import { AddTodoForm } from "@/components/add-task-form"
import { Button } from "@/components/ui/button"
import { PlusCircle, Trash2, SortAsc, Calendar, Clock, AlertTriangle } from "lucide-react"
import { useDatabaseTodos } from "@/hooks/use-db-tasks"
import { TodoStats } from "@/components/task-stats"
import { TodoFilter } from "@/components/task-filter"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Task } from "@/lib/types"
import { NotificationService } from "@/lib/services/notifications"

export default function TodoList() {
  const {
    todos,
    isLoading,
    error,
    addTodo,
    updateTodo,
    deleteTodo,
    clearAllTodos,
    reorderTodos,
    sortTodos,
    stats,
  } = useDatabaseTodos()

  const [filteredTodos, setFilteredTodos] = useState<Task[]>([])
  const [filter, setFilter] = useState({ category: "all", priority: "all", status: "all", dueDate: "all" })
  const [showAddForm, setShowAddForm] = useState(false)
  const [showClearDialog, setShowClearDialog] = useState(false)
  const { toast } = useToast()

  // Initialize notification service
  useEffect(() => {
    const notificationService = NotificationService.getInstance()
    
    // Request notification permission
    notificationService.requestNotificationPermission()
    
    // Start monitoring tasks
    const cleanup = notificationService.startMonitoring(todos)
    
    return () => cleanup()
  }, [todos])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+N: New task
      if (e.altKey && e.key === "n") {
        e.preventDefault()
        setShowAddForm(true)
      }

      // Alt+C: Clear completed tasks
      if (e.altKey && e.key === "c") {
        e.preventDefault()
        const completedIds = todos.filter((t) => t.completed).map((t) => t.id)
        completedIds.forEach((id) => deleteTodo(id))
        toast({
          title: "Completed tasks cleared",
          description: `${completedIds.length} completed tasks have been removed`,
        })
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [todos, deleteTodo, toast])

  useEffect(() => {
    if (todos) {
      let filtered = [...todos]

      if (filter.category !== "all") {
        filtered = filtered.filter((todo) => todo.category === filter.category)
      }

      if (filter.priority !== "all") {
        filtered = filtered.filter((todo) => todo.priority === filter.priority)
      }

      if (filter.status === "completed") {
        filtered = filtered.filter((todo) => todo.completed)
      } else if (filter.status === "active") {
        filtered = filtered.filter((todo) => !todo.completed)
      }

      if (filter.dueDate === "today") {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        filtered = filtered.filter((todo) => {
          if (!todo.dueDate) return false
          const dueDate = new Date(todo.dueDate)
          dueDate.setHours(0, 0, 0, 0)
          return dueDate.getTime() === today.getTime()
        })
      } else if (filter.dueDate === "week") {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const nextWeek = new Date(today)
        nextWeek.setDate(today.getDate() + 7)

        filtered = filtered.filter((todo) => {
          if (!todo.dueDate) return false
          const dueDate = new Date(todo.dueDate)
          return dueDate >= today && dueDate <= nextWeek
        })
      } else if (filter.dueDate === "overdue") {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        filtered = filtered.filter((todo) => {
          if (!todo.dueDate || todo.completed) return false
          const dueDate = new Date(todo.dueDate)
          dueDate.setHours(0, 0, 0, 0)
          return dueDate < today
        })
      }

      setFilteredTodos(filtered)
    }
  }, [todos, filter])

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(filteredTodos)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setFilteredTodos(items)
    reorderTodos(items.map((item) => item.id))
  }

  if (error) {
    toast({
      title: "Error",
      description: "Failed to load todos. Please try again.",
      variant: "destructive",
    })
  }

  return (
    <div className="space-y-6">
      <TodoStats stats={stats} />

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <TodoFilter onFilterChange={setFilter} currentFilter={filter} />
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <SortAsc className="h-4 w-4 mr-2" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => sortTodos("dueDate")}>
                <Calendar className="h-4 w-4 mr-2" />
                By Due Date
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => sortTodos("priority")}>
                <AlertTriangle className="h-4 w-4 mr-2" />
                By Priority
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => sortTodos("createdAt")}>
                <Clock className="h-4 w-4 mr-2" />
                By Creation Time
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowClearDialog(true)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>

          <Button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            {showAddForm ? "Cancel" : "Add Task"}
          </Button>
        </div>
      </div>

      {showAddForm && (
        <AddTodoForm
          onAdd={(todo) => {
            addTodo(todo)
            setShowAddForm(false)
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="todos">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
              {filteredTodos.length > 0 ? (
                filteredTodos.map((todo, index) => (
                  <Draggable key={todo.id} draggableId={todo.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="transition-all duration-200 animate-in fade-in"
                      >
                        <TodoItem todo={todo} onUpdate={updateTodo} onDelete={deleteTodo} />
                      </div>
                    )}
                  </Draggable>
                ))
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  {isLoading ? "Loading tasks..." : "No tasks found. Add a new task to get started!"}
                </div>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete all your tasks and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                clearAllTodos()
                setShowClearDialog(false)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="text-xs text-muted-foreground text-center mt-8">
        <p>Keyboard shortcuts: Alt+N (New task), Alt+C (Clear completed)</p>
      </div>
    </div>
  )
}
