import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { books } from '@/lib/schema'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

const progressSchema = z.object({
  readingProgress: z.number().min(0).max(100),
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
    const result = progressSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid progress value' },
        { status: 400 }
      )
    }

    const [book] = await db
      .update(books)
      .set({ readingProgress: result.data.readingProgress })
      .where(and(eq(books.id, parseInt(id)), eq(books.userId, userId)))
      .returning()

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    return NextResponse.json({ readingProgress: book.readingProgress })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
