import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { books, userLanes } from '@/lib/schema'
import { and, eq, desc } from 'drizzle-orm'
import { z } from 'zod'
import { READING_SPEEDS, AVG_WORDS_PER_PAGE, Book } from '../../../shared/schema'

const bookSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  pages: z.number().min(1),
  coverUrl: z.string().url(),
  status: z.enum(['to-read', 'reading', 'completed']),
  laneId: z.number().nullable().optional(),
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
      .from(books)
      .where(eq(books.userId, userId))
      .orderBy(desc(books.addedAt))

    const transformedBooks: Book[] = result.map(r => ({
      id: r.id,
      title: r.title,
      author: r.author,
      pages: r.pages,
      coverUrl: r.coverUrl,
      status: r.status,
      userId: r.userId,
      laneId: r.laneId,
      readingProgress: r.readingProgress,
      goodreadsId: r.goodreadsId ?? undefined,
      estimatedMinutes: r.estimatedMinutes,
      addedAt: r.addedAt,
    }))

    return NextResponse.json(transformedBooks)
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
    const result = bookSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid book data' },
        { status: 400 }
      )
    }

    const bookData = result.data

    if (bookData.laneId) {
      const [lane] = await db
        .select()
        .from(userLanes)
        .where(and(eq(userLanes.id, bookData.laneId), eq(userLanes.userId, userId)))
      if (!lane) {
        return NextResponse.json({ error: 'Lane not found' }, { status: 404 })
      }
    }

    const estimatedMinutes = Math.ceil(
      (bookData.pages * AVG_WORDS_PER_PAGE) / READING_SPEEDS.average
    )

    const [book] = await db
      .insert(books)
      .values({
        title: bookData.title,
        author: bookData.author,
        pages: bookData.pages,
        coverUrl: bookData.coverUrl,
        status: bookData.status,
        userId,
        laneId: bookData.laneId || null,
        estimatedMinutes,
      })
      .returning()

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

    return NextResponse.json(transformedBook, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
