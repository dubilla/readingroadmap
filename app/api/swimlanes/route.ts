import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { swimlanes } from '@/lib/schema'
import { eq, asc } from 'drizzle-orm'
import { z } from 'zod'

const swimlaneSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  order: z.number(),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const userId = session.user.id

    const result = await db
      .select()
      .from(swimlanes)
      .where(eq(swimlanes.userId, userId))
      .orderBy(asc(swimlanes.order))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const userId = session.user.id

    const body = await request.json()
    const result = swimlaneSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid swimlane data' },
        { status: 400 }
      )
    }

    const [swimlane] = await db
      .insert(swimlanes)
      .values({
        name: result.data.name,
        description: result.data.description,
        order: result.data.order,
        userId,
      })
      .returning()

    return NextResponse.json(swimlane, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
