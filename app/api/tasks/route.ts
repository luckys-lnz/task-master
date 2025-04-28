import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'
import { tasks } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const taskSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  status: z.enum(['todo', 'in-progress', 'done']).default('todo'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
})

export async function POST(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const validatedData = taskSchema.parse(body)

    const task = await db.insert(tasks).values({
      userId,
      ...validatedData,
      dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
    }).returning()

    return NextResponse.json(task[0])
  } catch (error) {
    console.error('[TASKS_POST]', error)
    if (error instanceof z.ZodError) {
      return new NextResponse('Invalid request data', { status: 400 })
    }
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function GET() {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const userTasks = await db.select().from(tasks).where(eq(tasks.userId, userId))
    return NextResponse.json(userTasks)
  } catch (error) {
    console.error('[TASKS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 