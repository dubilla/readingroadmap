import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/database'
import { z } from 'zod'

const swimlaneSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  order: z.number()
})

export async function GET(request: NextRequest) {
  try {
    // For now, we'll use a simple approach - in production you'd want proper auth
    const { data: swimlanes, error } = await db.query('swimlanes')

    if (error) {
      console.error('Error fetching swimlanes:', error)
      return NextResponse.json(
        { error: 'Failed to fetch swimlanes' },
        { status: 500 }
      )
    }

    return NextResponse.json(swimlanes || [])
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
    const body = await request.json()
    const result = swimlaneSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid swimlane data' },
        { status: 400 }
      )
    }

    const { data: swimlane, error } = await db.insert('swimlanes', {
      ...result.data,
      user_id: 1 // For now, hardcoded - you'd get this from auth
    })

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