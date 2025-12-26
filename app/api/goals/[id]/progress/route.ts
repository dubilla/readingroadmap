import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(_name: string, _value: string, _options: any) {
            // This is handled by the middleware
          },
          remove(_name: string, _options: any) {
            // This is handled by the middleware
          },
        },
      }
    )

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Fetch the goal
    const { data: goal, error: goalError } = await supabase
      .from('reading_goals')
      .select('*')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single()

    if (goalError) {
      if (goalError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Goal not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching goal:', goalError)
      return NextResponse.json(
        { error: 'Failed to fetch goal' },
        { status: 500 }
      )
    }

    // Calculate progress based on goal type
    const year = goal.year
    const startOfYear = `${year}-01-01T00:00:00.000Z`
    const endOfYear = `${year}-12-31T23:59:59.999Z`

    let currentCount = 0

    if (goal.goal_type === 'books') {
      // Count completed books for this year
      const { count, error: countError } = await supabase
        .from('user_books')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('status', 'completed')
        .gte('date_completed', startOfYear)
        .lte('date_completed', endOfYear)

      if (countError) {
        console.error('Error counting books:', countError)
        return NextResponse.json(
          { error: 'Failed to calculate progress' },
          { status: 500 }
        )
      }

      currentCount = count || 0
    } else if (goal.goal_type === 'pages') {
      // Sum pages of completed books for this year
      const { data: completedBooks, error: booksError } = await supabase
        .from('user_books')
        .select('book_id')
        .eq('user_id', session.user.id)
        .eq('status', 'completed')
        .gte('date_completed', startOfYear)
        .lte('date_completed', endOfYear)

      if (booksError) {
        console.error('Error fetching completed books:', booksError)
        return NextResponse.json(
          { error: 'Failed to calculate progress' },
          { status: 500 }
        )
      }

      if (completedBooks && completedBooks.length > 0) {
        const bookIds = completedBooks.map(b => b.book_id)
        const { data: books, error: pagesError } = await supabase
          .from('books')
          .select('page_count')
          .in('id', bookIds)

        if (pagesError) {
          console.error('Error fetching book pages:', pagesError)
          return NextResponse.json(
            { error: 'Failed to calculate progress' },
            { status: 500 }
          )
        }

        currentCount = books?.reduce((sum, book) => sum + (book.page_count || 0), 0) || 0
      }
    }

    const progressPercentage = Math.min(
      Math.round((currentCount / goal.target_count) * 100),
      100
    )

    return NextResponse.json({
      goalId: goal.id,
      goalType: goal.goal_type,
      targetCount: goal.target_count,
      currentCount,
      progressPercentage,
      year: goal.year,
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
