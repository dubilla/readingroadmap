import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'
import { Book } from '../../../../../shared/schema'

const updateStatusSchema = z.object({
  status: z.enum(['to-read', 'reading', 'completed'])
})

export async function PATCH(
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
    const result = updateStatusSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid status data' },
        { status: 400 }
      )
    }

    const { status } = result.data

    // Update the book status
    const { data: book, error } = await supabase
      .from('books')
      .update({ status })
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
      console.error('Error updating book status:', error)
      return NextResponse.json(
        { error: 'Failed to update book status' },
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