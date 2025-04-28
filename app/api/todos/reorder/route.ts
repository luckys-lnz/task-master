import { NextResponse } from "next/server"
import { todos } from "../route"
import type { Todo } from "@/lib/types"


export async function POST(request: Request) {
  try {
    const { orderedIds } = await request.json()

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json({ error: "orderedIds must be an array" }, { status: 400 })
    }

    const reorderedTodos = orderedIds
      .map((id) => todos.find((todo) => todo.id === id))
      .filter((todo): todo is Todo => todo !== undefined)

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
