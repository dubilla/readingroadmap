import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { userLanes } from '@/lib/schema'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

const updateLaneSchema = z.object({
  name: z.string().min(1).optional(),
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

    const [lane] = await db
      .select()
      .from(userLanes)
      .where(and(eq(userLanes.id, parseInt(id)), eq(userLanes.userId, userId)))

    if (!lane) {
      return NextResponse.json({ error: 'Lane not found' }, { status: 404 })
    }

    return NextResponse.json(lane)
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
    const result = updateLaneSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid lane data' },
        { status: 400 }
      )
    }

    const updateData: Partial<typeof userLanes.$inferInsert> = {}
    if (result.data.name !== undefined) updateData.name = result.data.name
    if (result.data.order !== undefined) updateData.order = result.data.order

    const [lane] = await db
      .update(userLanes)
      .set(updateData)
      .where(and(eq(userLanes.id, parseInt(id)), eq(userLanes.userId, userId)))
      .returning()

    if (!lane) {
      return NextResponse.json({ error: 'Lane not found' }, { status: 404 })
    }

    return NextResponse.json(lane)
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
      .delete(userLanes)
      .where(and(eq(userLanes.id, parseInt(id)), eq(userLanes.userId, userId)))
      .returning()

    if (!deleted) {
      return NextResponse.json({ error: 'Lane not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Lane deleted successfully' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
