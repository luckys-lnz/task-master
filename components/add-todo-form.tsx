"use client"

import { TodoEditor } from "@/components/todo-editor"
import type { Todo } from "@/lib/types"
import { v4 as uuidv4 } from "uuid"

interface AddTodoFormProps {
  onAdd: (todo: Todo) => void
  onCancel: () => void
}

export function AddTodoForm({ onAdd, onCancel }: AddTodoFormProps) {
  const handleSave = (todoData: Partial<Todo>) => {
    const newTodo: Todo = {
      id: uuidv4(),
      title: todoData.title || "",
      description: todoData.description || "",
      category: todoData.category || "",
      priority: todoData.priority || "medium",
      tags: todoData.tags || [],
      dueDate: todoData.dueDate || "",
      dueTime: todoData.dueTime || "",
      completed: false,
      notes: todoData.notes || "",
      subtasks: [],
      createdAt: new Date().toISOString(),
    }

    onAdd(newTodo)
  }

  return <TodoEditor onSave={handleSave} onCancel={onCancel} />
}
