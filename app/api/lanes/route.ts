import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { userLanes } from '@/lib/schema'
import { eq, asc } from 'drizzle-orm'
import { z } from 'zod'

const userLaneSchema = z.object({
  name: z.string().min(1),
  order: z.number(),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const userId = session.user.id

    const lanes = await db
      .select()
      .from(userLanes)
      .where(eq(userLanes.userId, userId))
      .orderBy(asc(userLanes.order))

    return NextResponse.json(lanes)
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
    const result = userLaneSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid user lane data' },
        { status: 400 }
      )
    }

    const [lane] = await db
      .insert(userLanes)
      .values({
        name: result.data.name,
        userId,
        order: result.data.order,
      })
      .returning()

    return NextResponse.json(lane, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
