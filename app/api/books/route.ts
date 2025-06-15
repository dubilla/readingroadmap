import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/database'
import { z } from 'zod'
import { READING_SPEEDS, AVG_WORDS_PER_PAGE } from '../../../shared/schema'

const bookSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  pages: z.number().min(1),
  coverUrl: z.string().url(),
  status: z.enum(['to-read', 'reading', 'completed']),
  laneId: z.number().optional()
})

export async function GET(request: NextRequest) {
  try {
    // For now, we'll use a simple approach - in production you'd want proper auth
    const { data: books, error } = await db.query('books')

    if (error) {
      console.error('Error fetching books:', error)
      return NextResponse.json(
        { error: 'Failed to fetch books' },
        { status: 500 }
      )
    }

    return NextResponse.json(books)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = bookSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid book data' },
        { status: 400 }
      )
    }

    const bookData = result.data
    const estimatedMinutes = Math.round(
      (bookData.pages * AVG_WORDS_PER_PAGE) / READING_SPEEDS.AVERAGE
    )

    // For now, we'll use a simple approach - in production you'd want proper auth
    // The user_id should come from the authenticated user
    const { data: users } = await db.query('users')
    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'No users found. Please create an account first.' },
        { status: 401 }
      )
    }

    const userId = users[0].id // Use the first user for now

    const { data: book, error } = await db.insert('books', {
      ...bookData,
      user_id: userId,
      reading_progress: 0,
      estimated_minutes: estimatedMinutes
    })

    if (error) {
      console.error('Error creating book:', error)
      return NextResponse.json(
        { error: 'Failed to create book' },
        { status: 500 }
      )
    }

    return NextResponse.json(book, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 