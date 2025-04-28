import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'
import { todos } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'

export async function GET() {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const [stats] = await db
      .select({
        tasksCreated: sql<number>`count(*)`,
        tasksCompleted: sql<number>`sum(case when ${todos.completed} = true then 1 else 0 end)`,
        completionRate: sql<number>`(sum(case when ${todos.completed} = true then 1 else 0 end) * 100.0 / count(*))`,
      })
      .from(todos)
      .where(eq(todos.userId, userId))

    return NextResponse.json({
      tasksCreated: Number(stats.tasksCreated),
      tasksCompleted: Number(stats.tasksCompleted),
      completionRate: Math.round(Number(stats.completionRate)) + '%',
    })
  } catch (error) {
    console.error('[STATS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 