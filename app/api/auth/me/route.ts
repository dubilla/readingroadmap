import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../lib/database'

export async function GET(request: NextRequest) {
  try {
    // Check if we're in local development mode
    if (db.isLocalDb()) {
      // For local development, return a mock user
      return NextResponse.json({
        id: 1,
        email: 'dev@localhost',
        created_at: new Date().toISOString()
      })
    }

    // For production, use Supabase auth
    const { supabase } = await import('../../../../lib/supabase')
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get user data from our users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, created_at')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      console.error('Error fetching user:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error getting user:', error)
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    )
  }
} 