import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabase'
import { z } from 'zod'
import { READING_SPEEDS, AVG_WORDS_PER_PAGE } from '../../shared/schema'

const bookSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  pages: z.number().min(1),
  coverUrl: z.string().url(),
  status: z.enum(['to-read', 'reading', 'completed']),
  laneId: z.number().optional()
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
      const { data: books, error } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user.id)
        .order('added_at', { ascending: false })

      if (error) {
        console.error('Error fetching books:', error)
        return res.status(500).json({ error: 'Failed to fetch books' })
      }

      res.json(books)
    } catch (error) {
      console.error('Error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else if (req.method === 'POST') {
    try {
      const result = bookSchema.safeParse(req.body)
      if (!result.success) {
        return res.status(400).json({ error: result.error.errors[0]?.message || 'Invalid book data' })
      }

      const bookData = result.data
      const estimatedMinutes = Math.round(
        (bookData.pages * AVG_WORDS_PER_PAGE) / READING_SPEEDS.AVERAGE
      )

      const { data: book, error } = await supabase
        .from('books')
        .insert({
          ...bookData,
          user_id: user.id,
          reading_progress: 0,
          estimated_minutes: estimatedMinutes
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating book:', error)
        return res.status(500).json({ error: 'Failed to create book' })
      }

      res.status(201).json(book)
    } catch (error) {
      console.error('Error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
} 