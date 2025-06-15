import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    // Get user data from our users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, created_at')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      console.error('Error fetching user:', userError)
      return res.status(401).json({ error: 'User not found' })
    }

    res.json(user)
  } catch (error) {
    console.error('Error getting user:', error)
    res.status(500).json({ error: 'Failed to get user' })
  }
} 