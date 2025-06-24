import { TaskForm } from '@/app/components/task-form'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { tasks } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { format } from 'date-fns'

export default async function TasksPage() {
  const session = await getServerSession(authOptions)
  // Type assertion to include 'id' on user
  const userId = session && (session.user as typeof session.user & { id?: string })?.id

  if (!userId) {
    return <div>Please sign in to view tasks</div>
  }

  const userTasks = await db.select().from(tasks).where(eq(tasks.user_id, userId))

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:gap-8">
        <div className="w-full md:w-1/2">
          <h2 className="text-xl font-semibold mb-4">Add New Task</h2>
          <TaskForm />
        </div>

        <div className="w-full md:w-1/2">
          <h2 className="text-xl font-semibold mb-4">Your Tasks</h2>
          <div className="space-y-4">
            {userTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="font-medium">{task.title}</h3>
                {task.description && (
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    task.priority === 'HIGH' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' :
                    task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' :
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                  }`}>
                    {task.priority}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    task.is_completed
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                  }`}>
                    {task.is_completed ? 'done' : 'in-progress'}
                  </span>
                </div>
                {task.due_date && (
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Due: {format(new Date(task.due_date), 'PPP')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}