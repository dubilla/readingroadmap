import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { z } from 'zod'

const swimlaneSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  order: z.number()
})

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    const { data: swimlanes, error } = await supabase
      .from('swimlanes')
      .select('*')
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .order('order', { ascending: true })

    if (error) {
      console.error('Error fetching swimlanes:', error)
      return NextResponse.json(
        { error: 'Failed to fetch swimlanes' },
        { status: 500 }
      )
    }

    return NextResponse.json(swimlanes)
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
    // Get current user
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const result = swimlaneSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid swimlane data' },
        { status: 400 }
      )
    }

    const { data: swimlane, error } = await supabase
      .from('swimlanes')
      .insert({
        ...result.data,
        user_id: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating swimlane:', error)
      return NextResponse.json(
        { error: 'Failed to create swimlane' },
        { status: 500 }
      )
    }

    return NextResponse.json(swimlane, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 