import { createClient } from '@supabase/supabase-js'

// Client-side Supabase client (for React components)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
)

// Database types based on your schema
export interface Database {
  public: {
    Tables: {
      swimlanes: {
        Row: {
          id: number
          name: string
          description: string | null
          order: number
          user_id: string | null // UUID from auth.users
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          order: number
          user_id?: string | null
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          order?: number
          user_id?: string | null
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
          user_id: string // UUID from auth.users
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
          user_id: string
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
          user_id?: string
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