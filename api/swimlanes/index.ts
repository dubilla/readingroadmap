import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabase'
import { z } from 'zod'

const swimlaneSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  order: z.number()
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get current user
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', session.user.email)
    .single()

  if (!user) {
    return res.status(401).json({ error: 'User not found' })
  }

  if (req.method === 'GET') {
    try {
      const { data: swimlanes, error } = await supabase
        .from('swimlanes')
        .select('*')
        .or(`user_id.is.null,user_id.eq.${user.id}`)
        .order('order', { ascending: true })

      if (error) {
        console.error('Error fetching swimlanes:', error)
        return res.status(500).json({ error: 'Failed to fetch swimlanes' })
      }

      res.json(swimlanes)
    } catch (error) {
      console.error('Error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else if (req.method === 'POST') {
    try {
      const result = swimlaneSchema.safeParse(req.body)
      if (!result.success) {
        return res.status(400).json({ error: result.error.errors[0]?.message || 'Invalid swimlane data' })
      }

      const { data: swimlane, error } = await supabase
        .from('swimlanes')
        .insert({
          ...result.data,
          user_id: user.id
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating swimlane:', error)
        return res.status(500).json({ error: 'Failed to create swimlane' })
      }

      res.status(201).json(swimlane)
    } catch (error) {
      console.error('Error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
} 