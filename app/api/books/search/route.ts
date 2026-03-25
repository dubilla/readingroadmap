import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { books } from '@/lib/schema'
import { and, eq, ilike, or } from 'drizzle-orm'
import type { Book } from '../../../../shared/schema'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const userId = session.user.id

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    const result = await db
      .select()
      .from(books)
      .where(
        and(
          eq(books.userId, userId),
          or(
            ilike(books.title, `%${query}%`),
            ilike(books.author, `%${query}%`)
          )
        )
      )

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
