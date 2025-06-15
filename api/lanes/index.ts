import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabase'
import { z } from 'zod'

const laneSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  order: z.number(),
  type: z.enum(['backlog', 'in-progress', 'completed']),
  swimlaneId: z.number().optional()
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get current user
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  if (req.method === 'GET') {
    try {
      const { data: lanes, error } = await supabase
        .from('lanes')
        .select('*')
        .order('order', { ascending: true })

      if (error) {
        console.error('Error fetching lanes:', error)
        return res.status(500).json({ error: 'Failed to fetch lanes' })
      }

      res.json(lanes)
    } catch (error) {
      console.error('Error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else if (req.method === 'POST') {
    try {
      const result = laneSchema.safeParse(req.body)
      if (!result.success) {
        return res.status(400).json({ error: result.error.errors[0]?.message || 'Invalid lane data' })
      }

      const { data: lane, error } = await supabase
        .from('lanes')
        .insert(result.data)
        .select()
        .single()

      if (error) {
        console.error('Error creating lane:', error)
        return res.status(500).json({ error: 'Failed to create lane' })
      }

      res.status(201).json(lane)
    } catch (error) {
      console.error('Error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
} 