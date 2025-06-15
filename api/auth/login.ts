import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabase'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Validate input
    const result = loginSchema.safeParse(req.body)
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors[0]?.message || 'Invalid input' })
    }

    const { email, password } = result.data

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password: password
    })

    if (error) {
      console.error('Login error:', error)
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    if (!data.user || !data.session) {
      return res.status(401).json({ error: 'Authentication failed' })
    }

    // Get user data from our users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, created_at')
      .eq('email', email.toLowerCase())
      .single()

    if (userError || !userData) {
      console.error('Error fetching user data:', userError)
      return res.status(500).json({ error: 'Failed to fetch user data' })
    }

    res.json({
      user: userData,
      session: data.session
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
} 