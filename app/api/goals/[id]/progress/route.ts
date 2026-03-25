import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { books, readingGoals } from '@/lib/schema'
import { and, eq } from 'drizzle-orm'

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

    const completedBooks = await db
      .select()
      .from(books)
      .where(and(eq(books.userId, userId), eq(books.status, 'completed')))

    let currentCount = 0
    if (goal.goalType === 'books') {
      currentCount = completedBooks.length
    } else if (goal.goalType === 'pages') {
      currentCount = completedBooks.reduce((sum, b) => sum + b.pages, 0)
    }

    const progressPercentage = Math.min(
      Math.round((currentCount / goal.targetCount) * 100),
      100
    )

    return NextResponse.json({
      goalId: goal.id,
      goalType: goal.goalType,
      targetCount: goal.targetCount,
      currentCount,
      progressPercentage,
      year: goal.year,
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
