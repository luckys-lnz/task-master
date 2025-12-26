"use client";

import { TaskEditor } from "@/components/task-editor";
import { Task } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

interface AddTodoFormProps {
  onAdd: (todo: Task) => void;
  onCancel: () => void;
}

export function AddTodoForm({ onAdd, onCancel }: AddTodoFormProps) {
  const handleSave = (todoData: Partial<Task>) => {
    const newTodo: Task = {
      id: uuidv4(),
      title: todoData.title || "",
      description: todoData.description || "",
      category: todoData.category || "",
      priority: todoData.priority || "MEDIUM",
      tags: todoData.tags || [],
      dueDate: todoData.dueDate || "",
      dueTime: todoData.dueTime || "",
      completed: false,
      notes: todoData.notes || "",
      subtasks: [],
      createdAt: new Date().toISOString(),
    };

    onAdd(newTodo);
  };

  return <TaskEditor onSave={handleSave} onCancel={onCancel} />;
}
