"use client"

import { useState, useEffect, useMemo } from "react"
import type { Task } from "../lib/types"
import { useToast } from "@/components/ui/use-toast"

// Replace localStorage operations with API interactions
export function useDatabaseTodos() {
  const [todos, setTodos] = useState<Task[]>([])
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
      if (todo.dueTime) {
        const [hours, minutes] = todo.dueTime.split(":").map(Number)
        dueDate.setHours(hours, minutes, 0, 0)
      } else {
        dueDate.setHours(23, 59, 59, 999)
      }
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

  // Fetch todos from database
  const fetchTodos = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/tasks")
      if (!response.ok) throw new Error("Failed to fetch todos")

      const data = await response.json()
      setTodos(data)
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

  // Add a new task to the database
  const addTodo = async (todo: Task) => {
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(todo),
      })
      if (!response.ok) throw new Error("Failed to add todo")

      const newTodo = await response.json()
      setTodos((prevTodos) => [...prevTodos, newTodo])

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

  // Update an existing task in the database
  const updateTodo = async (id: string, updates: Partial<Task>) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update task");
      }

      const updatedTodo = await response.json();

      // Use the updated task from the server!
      setTodos((prevTodos) =>
        prevTodos.map((todo) => (todo.id === id ? updatedTodo : todo))
      );

      toast({
        title: "Success",
        description: "Task updated successfully",
      });
    } catch (err) {
      console.error("Error updating task:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update task",
        variant: "destructive",
      });
    }
  }

  // Delete a task from the database
  const deleteTodo = async (id: string) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete todo")

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

  // Clear all tasks (dangerous action)
  const clearAllTodos = async () => {
    try {
      // Batch delete all tasks
      for (const todo of todos) {
        await deleteTodo(todo.id) // Reuse deleteTodo logic
      }
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

  // Reorder tasks
  const reorderTodos = async (orderedIds: string[]) => {
    try {
      const reorderedTodos = orderedIds
        .map((id) => todos.find((todo) => todo.id === id))
        .filter((todo): todo is Task => todo != null)

      // Update the order in your database backend if needed
      setTodos(reorderedTodos)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to reorder todos"))
      toast({
        title: "Error",
        description: "Failed to reorder tasks",
        variant: "destructive",
      })
    }
  }

  // Sort tasks based on a field
  const sortTodos = (by: "dueDate" | "priority" | "createdAt") => {
    try {
      const sortedTodos = [...todos].sort((a, b) => {
        if (by === "dueDate") {
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        }

        if (by === "priority") {
          const priorities = { urgent: 4, high: 3, medium: 2, low: 1 }
          const aPriority = priorities[a.priority as keyof typeof priorities] || 0
          const bPriority = priorities[b.priority as keyof typeof priorities] || 0
          return bPriority - aPriority
        }

        // Default to createdAt if no valid field found
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

  // Fetch todos on mount
  useEffect(() => {
    fetchTodos()
  }, [])

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