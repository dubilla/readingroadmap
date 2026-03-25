import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { books } from '@/lib/schema'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { Book } from '../../../../../shared/schema'

const updateLaneSchema = z.object({
  laneId: z.number().nullable(),
})

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
    const result = updateLaneSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid lane data' },
        { status: 400 }
      )
    }

    const [book] = await db
      .update(books)
      .set({ laneId: result.data.laneId })
      .where(and(eq(books.id, parseInt(id)), eq(books.userId, userId)))
      .returning()

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    const transformedBook: Book = {
      id: book.id,
      title: book.title,
      author: book.author,
      pages: book.pages,
      coverUrl: book.coverUrl,
      status: book.status,
      userId: book.userId,
      laneId: book.laneId,
      readingProgress: book.readingProgress,
      goodreadsId: book.goodreadsId ?? undefined,
      estimatedMinutes: book.estimatedMinutes,
      addedAt: book.addedAt,
    }

    return NextResponse.json(transformedBook)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
