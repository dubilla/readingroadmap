import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { readingGoals } from '@/lib/schema'
import { and, eq } from 'drizzle-orm'
import { updateReadingGoalSchema } from '@/shared/schema'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const userId = session.user.id

    const [goal] = await db
      .select()
      .from(readingGoals)
      .where(and(eq(readingGoals.id, parseInt(id)), eq(readingGoals.userId, userId)))

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: goal.id,
      userId: goal.userId,
      goalType: goal.goalType,
      targetCount: goal.targetCount,
      year: goal.year,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const userId = session.user.id

    const body = await request.json()
    const result = updateReadingGoalSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid goal data' },
        { status: 400 }
      )
    }

    const updateData: Partial<typeof readingGoals.$inferInsert> = {}
    if (result.data.goalType !== undefined) updateData.goalType = result.data.goalType
    if (result.data.targetCount !== undefined) updateData.targetCount = result.data.targetCount
    if (result.data.year !== undefined) updateData.year = result.data.year
    updateData.updatedAt = new Date().toISOString()

    const [goal] = await db
      .update(readingGoals)
      .set(updateData)
      .where(and(eq(readingGoals.id, parseInt(id)), eq(readingGoals.userId, userId)))
      .returning()

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: goal.id,
      userId: goal.userId,
      goalType: goal.goalType,
      targetCount: goal.targetCount,
      year: goal.year,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const userId = session.user.id

    await db
      .delete(readingGoals)
      .where(and(eq(readingGoals.id, parseInt(id)), eq(readingGoals.userId, userId)))

    return NextResponse.json({ message: 'Goal deleted successfully' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
