import { NextResponse } from "next/server"
import type { Todo } from "@/lib/types"
import { v4 as uuidv4 } from "uuid"

// In a real app, this would be a database
const todos: Todo[] = []

export async function GET() {
  try {
    // In a real app, we would fetch from a database
    return NextResponse.json(todos)
  } catch (error) {
    console.error("Error fetching todos:", error)
    return NextResponse.json({ error: "Failed to fetch todos" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate the request body
    if (!body.title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const newTodo: Todo = {
      id: uuidv4(),
      title: body.title,
      description: body.description || "",
      category: body.category || "",
      priority: body.priority || "medium",
      tags: body.tags || [],
      dueDate: body.dueDate || "",
      dueTime: body.dueTime || "",
      completed: false,
      notes: body.notes || "",
      subtasks: body.subtasks || [],
      createdAt: new Date().toISOString(),
    }

    // In a real app, we would save to a database
    todos.push(newTodo)

    return NextResponse.json(newTodo, { status: 201 })
  } catch (error) {
    console.error("Error creating todo:", error)
    return NextResponse.json({ error: "Failed to create todo" }, { status: 500 })
  }
}

export { todos }
