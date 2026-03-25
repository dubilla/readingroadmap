import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { books } from '@/lib/schema'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { Book } from '../../../../shared/schema'

const updateBookSchema = z.object({
  title: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  pages: z.number().min(1).optional(),
  coverUrl: z.string().url().optional(),
  status: z.enum(['to-read', 'reading', 'completed']).optional(),
  laneId: z.number().optional(),
  readingProgress: z.number().min(0).max(100).optional(),
})

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

    const [book] = await db
      .select()
      .from(books)
      .where(and(eq(books.id, parseInt(id)), eq(books.userId, userId)))

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

export async function PUT(
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
    const result = updateBookSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid book data' },
        { status: 400 }
      )
    }

    const updateData: Partial<typeof books.$inferInsert> = {}
    if (result.data.title !== undefined) updateData.title = result.data.title
    if (result.data.author !== undefined) updateData.author = result.data.author
    if (result.data.pages !== undefined) updateData.pages = result.data.pages
    if (result.data.coverUrl !== undefined) updateData.coverUrl = result.data.coverUrl
    if (result.data.status !== undefined) updateData.status = result.data.status
    if (result.data.laneId !== undefined) updateData.laneId = result.data.laneId
    if (result.data.readingProgress !== undefined) updateData.readingProgress = result.data.readingProgress

    const [book] = await db
      .update(books)
      .set(updateData)
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
      .delete(books)
      .where(and(eq(books.id, parseInt(id)), eq(books.userId, userId)))

    return NextResponse.json({ message: 'Book deleted successfully' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
