import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { updateReadingGoalSchema } from '@/shared/schema'

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

    const { data: goal, error } = await supabase
      .from('reading_goals')
      .select('*')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Goal not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching goal:', error)
      return NextResponse.json(
        { error: 'Failed to fetch goal' },
        { status: 500 }
      )
    }

    // Transform snake_case to camelCase
    const transformedGoal = {
      id: goal.id,
      userId: goal.user_id,
      goalType: goal.goal_type,
      targetCount: goal.target_count,
      year: goal.year,
      createdAt: goal.created_at,
      updatedAt: goal.updated_at,
    }

    return NextResponse.json(transformedGoal)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
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

    const body = await request.json()
    const result = updateReadingGoalSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid goal data' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (result.data.goalType !== undefined) updateData.goal_type = result.data.goalType
    if (result.data.targetCount !== undefined) updateData.target_count = result.data.targetCount
    if (result.data.year !== undefined) updateData.year = result.data.year
    updateData.updated_at = new Date().toISOString()

    const { data: goal, error } = await supabase
      .from('reading_goals')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Goal not found' },
          { status: 404 }
        )
      }
      console.error('Error updating goal:', error)
      return NextResponse.json(
        { error: 'Failed to update goal' },
        { status: 500 }
      )
    }

    // Transform snake_case to camelCase
    const transformedGoal = {
      id: goal.id,
      userId: goal.user_id,
      goalType: goal.goal_type,
      targetCount: goal.target_count,
      year: goal.year,
      createdAt: goal.created_at,
      updatedAt: goal.updated_at,
    }

    return NextResponse.json(transformedGoal)
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

    const { error } = await supabase
      .from('reading_goals')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id)

    if (error) {
      console.error('Error deleting goal:', error)
      return NextResponse.json(
        { error: 'Failed to delete goal' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Goal deleted successfully' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
