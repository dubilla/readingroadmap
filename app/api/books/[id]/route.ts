import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'
import { Book } from '../../../../shared/schema'

const updateBookSchema = z.object({
  title: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  pages: z.number().min(1).optional(),
  coverUrl: z.string().url().optional(),
  status: z.enum(['to-read', 'reading', 'completed']).optional(),
  laneId: z.number().optional(),
  readingProgress: z.number().min(0).max(100).optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
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

    const { data: book, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Book not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching book:', error)
      return NextResponse.json(
        { error: 'Failed to fetch book' },
        { status: 500 }
      )
    }

    // Transform book from snake_case to camelCase
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

    return NextResponse.json(transformedBook)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
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
    const result = updateBookSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid book data' },
        { status: 400 }
      )
    }

    // Transform camelCase to snake_case for database
    const updateData: any = {}
    if (result.data.title !== undefined) updateData.title = result.data.title
    if (result.data.author !== undefined) updateData.author = result.data.author
    if (result.data.pages !== undefined) updateData.pages = result.data.pages
    if (result.data.coverUrl !== undefined) updateData.cover_url = result.data.coverUrl
    if (result.data.status !== undefined) updateData.status = result.data.status
    if (result.data.laneId !== undefined) updateData.lane_id = result.data.laneId
    if (result.data.readingProgress !== undefined) updateData.reading_progress = result.data.readingProgress

    const { data: book, error } = await supabase
      .from('books')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Book not found' },
          { status: 404 }
        )
      }
      console.error('Error updating book:', error)
      return NextResponse.json(
        { error: 'Failed to update book' },
        { status: 500 }
      )
    }

    // Transform the updated book back to camelCase for frontend
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

    return NextResponse.json(transformedBook)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
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

    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id)

    if (error) {
      console.error('Error deleting book:', error)
      return NextResponse.json(
        { error: 'Failed to delete book' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Book deleted successfully' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 