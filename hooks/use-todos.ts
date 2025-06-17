"use client"

import { useState, useEffect } from "react"
// Update the path below to the actual location of your types file
import type { Task } from "../lib/types"
// Update the path below if your use-toast hook is in a different location
import { useToast } from "../hooks/use-toast"

// For offline support
const STORAGE_KEY = "taskmaster-todos"

export function useTodos() {
  const [todos, setTodos] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()

  // Load todos from local storage on initial render
  useEffect(() => {
    const loadTodos = async () => {
      try {
        setIsLoading(true)

        // In a real app, we would fetch from an API first
        // const response = await fetch('/api/todos');
        // const data = await response.json();

        // For now, we'll use localStorage for offline support
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
        description: "Changes will be synced to the server",
      })
      // In a real app, we would sync with the server here
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

  // Save todos to local storage whenever they change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
    }
  }, [todos, isLoading])

  const addTodo = async (todo: Task) => {
    try {
      // In a real app, we would send to an API
      // const response = await fetch('/api/todos', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(todo),
      // });
      // const data = await response.json();

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

  const updateTodo = async (id: string, updates: Partial<Task>) => {
    try {
      // In a real app, we would send to an API
      // const response = await fetch(`/api/todos/${id}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(updates),
      // });
      // const data = await response.json();

      setTodos((prevTodos) => prevTodos.map((todo) => (todo.id === id ? { ...todo, ...updates } : todo)))
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
      // In a real app, we would send to an API
      // await fetch(`/api/todos/${id}`, {
      //   method: 'DELETE',
      // });

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

  const reorderTodos = async (orderedIds: string[]) => {
    try {
      // Create a new array with the todos in the specified order
      const reorderedTodos = orderedIds
        .map((id) => todos.find((todo) => todo.id === id))
        .filter((todo): todo is Task => todo !== undefined)

      // Add any todos that weren't in the orderedIds array
      const remainingTodos = todos.filter((todo) => !orderedIds.includes(todo.id))

      setTodos([...reorderedTodos, ...remainingTodos])

      // In a real app, we would send to an API
      // await fetch('/api/todos/reorder', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ orderedIds }),
      // });
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to reorder todos"))
      toast({
        title: "Error",
        description: "Failed to reorder tasks",
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
    reorderTodos,
  }
}
