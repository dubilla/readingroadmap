import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).optional()
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

    // Sign up with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0]
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://127.0.0.1:3000'}/auth/callback`
      }
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Check if email confirmation is required
    if (data.user && !data.session) {
      // Email confirmation required
      return NextResponse.json({
        success: true,
        message: 'Please check your email to confirm your account',
        requiresConfirmation: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || data.user.email
        }
      })
    }

    if (!data.session || !data.user) {
      return NextResponse.json(
        { error: 'Registration failed' },
        { status: 400 }
      )
    }

    // User is immediately signed in (email confirmation disabled in dev)
    const response = NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || data.user.email
      }
    })

    // Supabase middleware will handle setting the session cookies
    return response
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 