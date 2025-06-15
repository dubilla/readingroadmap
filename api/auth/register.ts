import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabase'
import { hashSync } from 'bcrypt'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Validate input
    const result = registerSchema.safeParse(req.body)
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors[0]?.message || 'Invalid input' })
    }

    const { email, password } = result.data

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' })
    }

    // Hash password
    const hashedPassword = hashSync(password, 10)

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        hashed_password: hashedPassword
      })
      .select('id, email, created_at')
      .single()

    if (error) {
      console.error('Error creating user:', error)
      return res.status(500).json({ error: 'Failed to create user' })
    }

    // Create JWT token for immediate login
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password: password,
      options: {
        data: {
          user_id: user.id
        }
      }
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return res.status(500).json({ error: 'Failed to create authentication' })
    }

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      session: authData.session
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
} 