"use client"

import { useState, useEffect, useMemo } from "react"
import type { Todo } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

// For localStorage support
const STORAGE_KEY = "taskmaster-todos"

export function useCookieTodos() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()

  // Calculate statistics
  const stats = useMemo(() => {
    const total = todos.length
    const completed = todos.filter((todo) => todo.completed).length
    const pending = total - completed
    const overdue = todos.filter((todo) => {
      if (!todo.dueDate || todo.completed) return false
      const dueDate = new Date(todo.dueDate)
      dueDate.setHours(23, 59, 59, 999)
      return dueDate < new Date()
    }).length
    const dueToday = todos.filter((todo) => {
      if (!todo.dueDate || todo.completed) return false
      const dueDate = new Date(todo.dueDate)
      const today = new Date()
      return (
        dueDate.getDate() === today.getDate() &&
        dueDate.getMonth() === today.getMonth() &&
        dueDate.getFullYear() === today.getFullYear()
      )
    }).length

    return { total, completed, pending, overdue, dueToday }
  }, [todos])

  // Load todos from localStorage on initial render
  useEffect(() => {
    const loadTodos = async () => {
      try {
        setIsLoading(true)
        const storedTodos = localStorage.getItem(STORAGE_KEY)
        const parsedTodos = storedTodos ? JSON.parse(storedTodos) : []
        setTodos(parsedTodos)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to load todos"))
        toast({
          title: "Error",
          description: "Failed to load todos",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadTodos()

    // Register for online/offline events
    const handleOnline = () => {
      toast({
        title: "You are online",
        description: "Changes will be saved locally",
      })
    }

    const handleOffline = () => {
      toast({
        title: "You are offline",
        description: "Changes will be saved locally",
      })
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [toast])

  // Save todos to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
    }
  }, [todos, isLoading])

  const addTodo = async (todo: Todo) => {
    try {
      setTodos((prevTodos) => [...prevTodos, todo])

      toast({
        title: "Task added",
        description: "Your task has been added successfully",
      })
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to add todo"))
      toast({
        title: "Error",
        description: "Failed to add task",
        variant: "destructive",
      })
    }
  }

  const updateTodo = async (id: string, updates: Partial<Todo>) => {
    try {
      setTodos((prevTodos) => prevTodos.map((todo) => (todo.id === id ? { ...todo, ...updates } : todo)))

      toast({
        title: "Task updated",
        description: "Your task has been updated successfully",
      })
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to update todo"))
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      })
    }
  }

  const deleteTodo = async (id: string) => {
    try {
      setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id))

      toast({
        title: "Task deleted",
        description: "Your task has been deleted",
      })
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to delete todo"))
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      })
    }
  }

  const clearAllTodos = async () => {
    try {
      setTodos([])
      toast({
        title: "All tasks cleared",
        description: "All your tasks have been deleted",
      })
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to clear todos"))
      toast({
        title: "Error",
        description: "Failed to clear tasks",
        variant: "destructive",
      })
    }
  }

  const reorderTodos = async (orderedIds: string[]) => {
    try {
      // Create a new array with the todos in the specified order
      const reorderedTodos = orderedIds
        .map((id) => todos.find((todo) => todo.id === id))
        .filter((todo): todo is Todo => todo !== undefined)

      // Add any todos that weren't in the orderedIds array
      const remainingTodos = todos.filter((todo) => !orderedIds.includes(todo.id))

      setTodos([...reorderedTodos, ...remainingTodos])
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to reorder todos"))
      toast({
        title: "Error",
        description: "Failed to reorder tasks",
        variant: "destructive",
      })
    }
  }

  const sortTodos = (by: "dueDate" | "priority" | "createdAt") => {
    try {
      const sortedTodos = [...todos].sort((a, b) => {
        if (by === "dueDate") {
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        }

        if (by === "priority") {
          const priorityValues = { high: 3, medium: 2, low: 1 }
          const aValue = a.priority ? priorityValues[a.priority as keyof typeof priorityValues] || 0 : 0
          const bValue = b.priority ? priorityValues[b.priority as keyof typeof priorityValues] || 0 : 0
          return bValue - aValue
        }

        // Default to createdAt
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })

      setTodos(sortedTodos)

      toast({
        title: "Tasks sorted",
        description: `Tasks sorted by ${by}`,
      })
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to sort todos"))
      toast({
        title: "Error",
        description: "Failed to sort tasks",
        variant: "destructive",
      })
    }
  }

  return {
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
  }
}
