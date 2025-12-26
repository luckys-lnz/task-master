"use client"

import { useState, useEffect, useMemo } from "react"  // Added useMemo
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { useToast } from "@/components/ui/use-toast"
import { TodoItem } from "@/components/task-item"
import { AddTodoForm } from "@/components/add-task-form"
import { Button } from "@/components/ui/button"
import { PlusCircle, Trash2, SortAsc, Calendar, Clock, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { EnhancedEmptyState } from "@/components/enhanced-empty-state"
import { TaskSkeleton } from "@/components/task-skeleton"
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
  const [filter, setFilter] = useState({ category: "all", priority: "all", status: "active", dueDate: "all" })
  const [showAddForm, setShowAddForm] = useState(false)
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [isFilterTransitioning, setIsFilterTransitioning] = useState(false)
  const { toast } = useToast()

  // Calculate overdue tasks
  const overdueCount = useMemo(() => {
    if (!todos) return 0;
    
    return todos.filter(todo => {
      if (!todo.dueDate || todo.completed) return false;
      
      const dueDate = new Date(todo.dueDate);
      if (todo.dueTime) {
        const [hours, minutes] = todo.dueTime.split(":").map(Number);
        dueDate.setHours(hours, minutes, 0, 0);
      } else {
        dueDate.setHours(23, 59, 59, 999);
      }
      
      return dueDate < new Date();
    }).length;
  }, [todos]);

  // Enhanced stats with overdue count
  const enhancedStats = useMemo(() => {
    return {
      ...stats,
      overdue: overdueCount
    };
  }, [stats, overdueCount]);

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
      // Trigger transition animation
      setIsFilterTransitioning(true)

      // Small delay for smooth transition
      const timeout = setTimeout(() => {
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
          filtered = filtered.filter((todo) => {
            if (!todo.dueDate || todo.completed) return false
            const dueDate = new Date(todo.dueDate)
            if (todo.dueTime) {
              const [hours, minutes] = todo.dueTime.split(":").map(Number)
              dueDate.setHours(hours, minutes, 0, 0)
            } else {
              dueDate.setHours(23, 59, 59, 999)
            }
            return dueDate < new Date()
          })
        }

        setFilteredTodos(filtered)
        setIsFilterTransitioning(false)
      }, 150)

      return () => clearTimeout(timeout)
    }
    return undefined
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
      {/* Use enhanced stats with overdue count */}
      <TodoStats stats={enhancedStats} />

      {/* Enhanced Filter and Actions Section */}
      <div className="flex flex-col gap-4">
        <TodoFilter onFilterChange={setFilter} currentFilter={filter} />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-lg border bg-card/50 backdrop-blur-sm">
          <div className="flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hover:bg-accent transition-colors">
                  <SortAsc className="h-4 w-4 mr-2" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
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
              className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>

          <Button 
            onClick={() => setShowAddForm(!showAddForm)} 
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-spring hover:scale-105"
            size="lg"
          >
            <PlusCircle className="h-4 w-4" />
            {showAddForm ? "Cancel" : "Add New Task"}
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
          {(provided, snapshot) => (
            <div 
              {...provided.droppableProps} 
              ref={provided.innerRef} 
              className={cn(
                "space-y-3 transition-spring-fast stagger-container",
                snapshot.isDraggingOver && "drop-zone-active p-2",
                isFilterTransitioning && "opacity-50"
              )}
            >
              {isLoading ? (
                <TaskSkeleton />
              ) : filteredTodos.length > 0 ? (
                filteredTodos.map((todo, index) => (
                  <Draggable key={todo.id} draggableId={todo.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={cn(
                          "transition-spring-fast stagger-item",
                          snapshot.isDragging && "opacity-90 scale-[1.02] shadow-xl z-50"
                        )}
                        style={{
                          ...provided.draggableProps.style,
                          transitionTimingFunction: "var(--spring-ease-out)",
                        }}
                      >
                        <TodoItem todo={todo} onUpdate={updateTodo} onDelete={deleteTodo} />
                      </div>
                    )}
                  </Draggable>
                ))
              ) : (
                <EnhancedEmptyState
                  variant={
                    filter.category !== "all" || filter.priority !== "all" || filter.status !== "all" || filter.dueDate !== "all"
                      ? "filtered"
                      : "tasks"
                  }
                  onAction={!showAddForm ? () => setShowAddForm(true) : undefined}
                  actionLabel="Create Your First Task"
                />
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