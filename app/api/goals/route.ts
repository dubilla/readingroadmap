import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { readingGoals } from '@/lib/schema'
import { and, desc, eq } from 'drizzle-orm'
import { insertReadingGoalSchema } from '@/shared/schema'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const userId = session.user.id

    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')

    const conditions = [eq(readingGoals.userId, userId)]
    if (year) {
      conditions.push(eq(readingGoals.year, parseInt(year)))
    }

    const goals = await db
      .select()
      .from(readingGoals)
      .where(and(...conditions))
      .orderBy(desc(readingGoals.year))

    const transformedGoals = goals.map(goal => ({
      id: goal.id,
      userId: goal.userId,
      goalType: goal.goalType,
      targetCount: goal.targetCount,
      year: goal.year,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
    }))

    return NextResponse.json(transformedGoals)
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
    const result = insertReadingGoalSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid goal data' },
        { status: 400 }
      )
    }

    const goalData = result.data

    const [existingGoal] = await db
      .select({ id: readingGoals.id })
      .from(readingGoals)
      .where(
        and(
          eq(readingGoals.userId, userId),
          eq(readingGoals.goalType, goalData.goalType),
          eq(readingGoals.year, goalData.year)
        )
      )

    if (existingGoal) {
      return NextResponse.json(
        { error: `A ${goalData.goalType} goal for ${goalData.year} already exists` },
        { status: 409 }
      )
    }

    const [goal] = await db
      .insert(readingGoals)
      .values({
        userId,
        goalType: goalData.goalType,
        targetCount: goalData.targetCount,
        year: goalData.year,
      })
      .returning()

    const transformedGoal = {
      id: goal.id,
      userId: goal.userId,
      goalType: goal.goalType,
      targetCount: goal.targetCount,
      year: goal.year,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
    }

    return NextResponse.json(transformedGoal, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
