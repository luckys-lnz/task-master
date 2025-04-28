import { NextResponse } from "next/server"

// In a real app, this would be a database
// For now, we're using the same array from the main route
// This is just for demonstration purposes
import { todos } from "../route"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const todo = todos.find((t) => t.id === id)

    if (!todo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 })
    }

    return NextResponse.json(todo)
  } catch (error) {
    console.error("Error fetching todo:", error)
    return NextResponse.json({ error: "Failed to fetch todo" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()

    const todoIndex = todos.findIndex((t) => t.id === id)

    if (todoIndex === -1) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 })
    }

    // Update the todo
    todos[todoIndex] = {
      ...todos[todoIndex],
      ...body,
    }

    return NextResponse.json(todos[todoIndex])
  } catch (error) {
    console.error("Error updating todo:", error)
    return NextResponse.json({ error: "Failed to update todo" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const todoIndex = todos.findIndex((t) => t.id === id)

    if (todoIndex === -1) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 })
    }

    // Remove the todo
    todos.splice(todoIndex, 1)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting todo:", error)
    return NextResponse.json({ error: "Failed to delete todo" }, { status: 500 })
  }
}
