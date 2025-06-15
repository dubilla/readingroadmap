import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { z } from 'zod'

const updateLaneSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  order: z.number().optional(),
  type: z.enum(['backlog', 'in-progress', 'completed']).optional(),
  swimlaneId: z.number().optional()
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

    const { data: lane, error } = await supabase
      .from('lanes')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Lane not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching lane:', error)
      return NextResponse.json(
        { error: 'Failed to fetch lane' },
        { status: 500 }
      )
    }

    return NextResponse.json(lane)
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

    const body = await request.json()
    const result = updateLaneSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid lane data' },
        { status: 400 }
      )
    }

    const { data: lane, error } = await supabase
      .from('lanes')
      .update(result.data)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Lane not found' },
          { status: 404 }
        )
      }
      console.error('Error updating lane:', error)
      return NextResponse.json(
        { error: 'Failed to update lane' },
        { status: 500 }
      )
    }

    return NextResponse.json(lane)
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

    const { error } = await supabase
      .from('lanes')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting lane:', error)
      return NextResponse.json(
        { error: 'Failed to delete lane' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Lane deleted successfully' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 