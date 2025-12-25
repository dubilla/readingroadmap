import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'

const userLaneSchema = z.object({
  name: z.string().min(1),
  order: z.number()
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
          set(_name: string, _value: string, _options: any) {
            // This is handled by the middleware
          },
          remove(_name: string, _options: any) {
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

    const { data: userLanes, error } = await supabase
      .from('user_lanes')
      .select('*')
      .eq('user_id', session.user.id)
      .order('order', { ascending: true })

    if (error) {
      console.error('Error fetching user lanes:', error)
      return NextResponse.json(
        { error: 'Failed to fetch user lanes' },
        { status: 500 }
      )
    }

    return NextResponse.json(userLanes)
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
          set(_name: string, _value: string, _options: any) {
            // This is handled by the middleware
          },
          remove(_name: string, _options: any) {
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
    const result = userLaneSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid user lane data' },
        { status: 400 }
      )
    }

    const userLaneData = result.data
    const { data: userLane, error } = await supabase
      .from('user_lanes')
      .insert({
        name: userLaneData.name,
        user_id: session.user.id,
        order: userLaneData.order
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating user lane:', error)
      return NextResponse.json(
        { error: 'Failed to create user lane' },
        { status: 500 }
      )
    }

    return NextResponse.json(userLane, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 