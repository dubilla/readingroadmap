import { NextRequest, NextResponse } from 'next/server'
import { signIn } from '@/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcrypt'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email().transform(e => e.toLowerCase()),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = registerSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid registration data' },
        { status: 400 }
      )
    }

    const { email, password, name } = result.data

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))

    if (existing) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await db.insert(users).values({
      email,
      name: name || email.split('@')[0],
      passwordHash,
    })

    // Account created — attempt auto sign-in. If it fails, the account still
    // exists and the user can sign in manually from the login page.
    try {
      await signIn('credentials', { email, password, redirect: false })
    } catch {
      // Non-fatal: return success so the client can redirect to /auth
      return NextResponse.json({ success: true, requiresLogin: true }, { status: 201 })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
