import { Suspense } from "react"
import TodoList from "@/components/todo-list"
import { TodoSkeleton } from "@/components/skeletons"

export default function Home() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Your Tasks</h2>
        <p className="text-muted-foreground mt-2">Manage your tasks and stay organized with TaskMaster.</p>
      </div>

      <Suspense fallback={<TodoSkeleton />}>
        <TodoList />
      </Suspense>
    </div>
  )
}
