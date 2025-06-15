import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types based on your schema
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: number
          email: string
          hashed_password: string
          created_at: string
        }
        Insert: {
          id?: number
          email: string
          hashed_password: string
          created_at?: string
        }
        Update: {
          id?: number
          email?: string
          hashed_password?: string
          created_at?: string
        }
      }
      swimlanes: {
        Row: {
          id: number
          name: string
          description: string | null
          order: number
          user_id: number | null
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          order: number
          user_id?: number | null
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          order?: number
          user_id?: number | null
        }
      }
      lanes: {
        Row: {
          id: number
          name: string
          description: string | null
          order: number
          type: string
          swimlane_id: number | null
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          order: number
          type: string
          swimlane_id?: number | null
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          order?: number
          type?: string
          swimlane_id?: number | null
        }
      }
      books: {
        Row: {
          id: number
          title: string
          author: string
          pages: number
          cover_url: string
          status: string
          user_id: number
          lane_id: number | null
          reading_progress: number
          goodreads_id: string | null
          estimated_minutes: number
          added_at: string
        }
        Insert: {
          id?: number
          title: string
          author: string
          pages: number
          cover_url: string
          status: string
          user_id: number
          lane_id?: number | null
          reading_progress?: number
          goodreads_id?: string | null
          estimated_minutes?: number
          added_at?: string
        }
        Update: {
          id?: number
          title?: string
          author?: string
          pages?: number
          cover_url?: string
          status?: string
          user_id?: number
          lane_id?: number | null
          reading_progress?: number
          goodreads_id?: string | null
          estimated_minutes?: number
          added_at?: string
        }
      }
    }
  }
} 