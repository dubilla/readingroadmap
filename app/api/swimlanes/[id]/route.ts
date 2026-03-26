import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { swimlanes } from '@/lib/schema'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

const updateSwimlaneSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  order: z.number().optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const userId = session.user.id

    const [swimlane] = await db
      .select()
      .from(swimlanes)
      .where(and(eq(swimlanes.id, parseInt(id)), eq(swimlanes.userId, userId)))

    if (!swimlane) {
      return NextResponse.json({ error: 'Swimlane not found' }, { status: 404 })
    }

    return NextResponse.json(swimlane)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const userId = session.user.id

    const body = await request.json()
    const result = updateSwimlaneSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid swimlane data' },
        { status: 400 }
      )
    }

    const [swimlane] = await db
      .update(swimlanes)
      .set(result.data)
      .where(and(eq(swimlanes.id, parseInt(id)), eq(swimlanes.userId, userId)))
      .returning()

    if (!swimlane) {
      return NextResponse.json({ error: 'Swimlane not found' }, { status: 404 })
    }

    return NextResponse.json(swimlane)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const userId = session.user.id

    const [deleted] = await db
      .delete(swimlanes)
      .where(and(eq(swimlanes.id, parseInt(id)), eq(swimlanes.userId, userId)))
      .returning()

    if (!deleted) {
      return NextResponse.json({ error: 'Swimlane not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Swimlane deleted successfully' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
