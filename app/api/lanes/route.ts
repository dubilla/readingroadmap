import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/database'
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
    // Check if we're in local development mode
    if (db.isLocalDb()) {
      // Skip auth for local development
    } else {
      // For production, use Supabase auth
      const { supabase } = await import('../../../lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        return NextResponse.json(
          { error: 'Not authenticated' },
          { status: 401 }
        )
      }
    }

    const { data: lanes, error } = await db.query('lanes')

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
    // Check if we're in local development mode
    if (db.isLocalDb()) {
      // Skip auth for local development
    } else {
      // For production, use Supabase auth
      const { supabase } = await import('../../../lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        return NextResponse.json(
          { error: 'Not authenticated' },
          { status: 401 }
        )
      }
    }

    const body = await request.json()
    const result = laneSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid lane data' },
        { status: 400 }
      )
    }

    const { data: lane, error } = await db.insert('lanes', result.data)

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