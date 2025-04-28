import { NextResponse } from "next/server"

// In a real app, this would be a database
// For now, we're using the same array from the main route
// This is just for demonstration purposes
import { todos } from "../route"

export async function POST(request: Request) {
  try {
    const { orderedIds } = await request.json()

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json({ error: "orderedIds must be an array" }, { status: 400 })
    }

    // Create a new array with the todos in the specified order
    const reorderedTodos = orderedIds.map((id) => todos.find((todo) => todo.id === id)).filter(Boolean)

    // Add any todos that weren't in the orderedIds array
    const remainingTodos = todos.filter((todo) => !orderedIds.includes(todo.id))

    // Update the todos array
    todos.length = 0
    todos.push(...reorderedTodos, ...remainingTodos)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error reordering todos:", error)
    return NextResponse.json({ error: "Failed to reorder todos" }, { status: 500 })
  }
}
