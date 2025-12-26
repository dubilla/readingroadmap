import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { insertReadingGoalSchema } from '@/shared/schema'

export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')

    let query = supabase
      .from('reading_goals')
      .select('*')
      .eq('user_id', session.user.id)
      .order('year', { ascending: false })

    if (year) {
      query = query.eq('year', parseInt(year))
    }

    const { data: goals, error } = await query

    if (error) {
      // If table doesn't exist yet, return empty array instead of 500
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json([])
      }
      console.error('Error fetching goals:', error)
      return NextResponse.json(
        { error: 'Failed to fetch goals' },
        { status: 500 }
      )
    }

    // Transform snake_case to camelCase
    const transformedGoals = goals.map(goal => ({
      id: goal.id,
      userId: goal.user_id,
      goalType: goal.goal_type,
      targetCount: goal.target_count,
      year: goal.year,
      createdAt: goal.created_at,
      updatedAt: goal.updated_at,
    }))

    return NextResponse.json(transformedGoals)
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
    const result = insertReadingGoalSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid goal data' },
        { status: 400 }
      )
    }

    const goalData = result.data

    // Check if goal for this type and year already exists
    const { data: existingGoal } = await supabase
      .from('reading_goals')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('goal_type', goalData.goalType)
      .eq('year', goalData.year)
      .single()

    if (existingGoal) {
      return NextResponse.json(
        { error: `A ${goalData.goalType} goal for ${goalData.year} already exists` },
        { status: 409 }
      )
    }

    const { data: goal, error } = await supabase
      .from('reading_goals')
      .insert({
        user_id: session.user.id,
        goal_type: goalData.goalType,
        target_count: goalData.targetCount,
        year: goalData.year,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating goal:', error)
      return NextResponse.json(
        { error: 'Failed to create goal' },
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

    return NextResponse.json(transformedGoal, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
