import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { z } from 'zod'

const updateSwimlaneSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  order: z.number().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { data: swimlane, error } = await supabase
      .from('swimlanes')
      .select('*')
      .eq('id', params.id)
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Swimlane not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching swimlane:', error)
      return NextResponse.json(
        { error: 'Failed to fetch swimlane' },
        { status: 500 }
      )
    }

    return NextResponse.json(swimlane)
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
  { params }: { params: { id: string } }
) {
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
    const result = updateSwimlaneSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid swimlane data' },
        { status: 400 }
      )
    }

    const { data: swimlane, error } = await supabase
      .from('swimlanes')
      .update(result.data)
      .eq('id', params.id)
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Swimlane not found' },
          { status: 404 }
        )
      }
      console.error('Error updating swimlane:', error)
      return NextResponse.json(
        { error: 'Failed to update swimlane' },
        { status: 500 }
      )
    }

    return NextResponse.json(swimlane)
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
  { params }: { params: { id: string } }
) {
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

    const { error } = await supabase
      .from('swimlanes')
      .delete()
      .eq('id', params.id)
      .or(`user_id.is.null,user_id.eq.${user.id}`)

    if (error) {
      console.error('Error deleting swimlane:', error)
      return NextResponse.json(
        { error: 'Failed to delete swimlane' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Swimlane deleted successfully' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 