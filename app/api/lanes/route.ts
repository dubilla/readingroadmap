import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'

const laneSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  order: z.number(),
  type: z.enum(['backlog', 'in-progress', 'completed']),
  swimlaneId: z.number().optional()
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

    const { data: lanes, error } = await supabase
      .from('lanes')
      .select('*')
      .order('order', { ascending: true })

    if (error) {
      console.error('Error fetching lanes:', error)
      return NextResponse.json(
        { error: 'Failed to fetch lanes' },
        { status: 500 }
      )
    }

    return NextResponse.json(lanes)
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
    const result = laneSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid lane data' },
        { status: 400 }
      )
    }

    const laneData = result.data
    const { data: lane, error } = await supabase
      .from('lanes')
      .insert({
        name: laneData.name,
        description: laneData.description,
        order: laneData.order,
        type: laneData.type,
        swimlane_id: laneData.swimlaneId
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating lane:', error)
      return NextResponse.json(
        { error: 'Failed to create lane' },
        { status: 500 }
      )
    }

    return NextResponse.json(lane, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 