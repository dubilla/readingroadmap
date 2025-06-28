import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'
import { READING_SPEEDS, AVG_WORDS_PER_PAGE, Book } from '../../../shared/schema'

const bookSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  pages: z.number().min(1),
  coverUrl: z.string().url(),
  status: z.enum(['to-read', 'reading', 'completed']),
  laneId: z.number().nullable().optional()
})

export async function GET(request: NextRequest) {
  try {
    // Create Supabase server client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            // This is handled by the middleware
          },
          remove(name: string, options: any) {
            // This is handled by the middleware
          },
        },
      }
    )

    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { data: books, error } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', session.user.id)
      .order('added_at', { ascending: false })

    if (error) {
      console.error('Error fetching books:', error)
      return NextResponse.json(
        { error: 'Failed to fetch books' },
        { status: 500 }
      )
    }

    // Transform books from snake_case to camelCase
    const transformedBooks: Book[] = books?.map(r => ({
      id: r.id,
      title: r.title,
      author: r.author,
      pages: r.pages,
      coverUrl: r.cover_url,
      status: r.status,
      userId: r.user_id,
      laneId: r.lane_id,
      readingProgress: r.reading_progress,
      goodreadsId: r.goodreads_id,
      estimatedMinutes: r.estimated_minutes,
      addedAt: r.added_at,
    })) || []

    return NextResponse.json(transformedBooks)
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
    // Create Supabase server client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            // This is handled by the middleware
          },
          remove(name: string, options: any) {
            // This is handled by the middleware
          },
        },
      }
    )

    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const result = bookSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid book data' },
        { status: 400 }
      )
    }

    const bookData = result.data
    
    // Calculate estimated reading time (average speed)
    const estimatedMinutes = Math.ceil((bookData.pages * AVG_WORDS_PER_PAGE) / READING_SPEEDS.average)

    // Transform camelCase to snake_case for database
    const { data: book, error } = await supabase
      .from('books')
      .insert({
        title: bookData.title,
        author: bookData.author,
        pages: bookData.pages,
        cover_url: bookData.coverUrl,
        status: bookData.status,
        user_id: parseInt(session.user.id),
        lane_id: bookData.laneId || null,
        estimated_minutes: estimatedMinutes,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating book:', error)
      return NextResponse.json(
        { error: 'Failed to create book' },
        { status: 500 }
      )
    }

    // Transform the created book back to camelCase for frontend
    const transformedBook: Book = {
      id: book.id,
      title: book.title,
      author: book.author,
      pages: book.pages,
      coverUrl: book.cover_url,
      status: book.status,
      userId: book.user_id,
      laneId: book.lane_id,
      readingProgress: book.reading_progress,
      goodreadsId: book.goodreads_id,
      estimatedMinutes: book.estimated_minutes,
      addedAt: book.added_at,
    }

    return NextResponse.json(transformedBook, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 