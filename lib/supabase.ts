import { createBrowserClient, createServerClient } from '@supabase/ssr'

// Client-side Supabase client (for React components)
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Server-side Supabase client (for API routes) - read-only cookie access
export function createServerSupabaseClient(request: Request) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookieHeader = request.headers.get('cookie') || ''
          return cookieHeader.split(';').map(c => {
            const [name, ...rest] = c.trim().split('=')
            return { name, value: rest.join('=') }
          }).filter(c => c.name)
        },
        setAll() {
          // This is handled by the middleware
        },
      },
    }
  )
}

// Database types based on your schema
export type Database = {
  public: {
    Tables: {
      lanes: {
        Row: {
          id: number
          name: string
          description: string | null
          order: number
          type: 'backlog' | 'in-progress' | 'completed'
          swimlane_id: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          order: number
          type: 'backlog' | 'in-progress' | 'completed'
          swimlane_id?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          order?: number
          type?: 'backlog' | 'in-progress' | 'completed'
          swimlane_id?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      books: {
        Row: {
          id: number
          title: string
          author: string
          isbn: string | null
          cover_url: string | null
          description: string | null
          page_count: number | null
          published_date: string | null
          genre: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          title: string
          author: string
          isbn?: string | null
          cover_url?: string | null
          description?: string | null
          page_count?: number | null
          published_date?: string | null
          genre?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          title?: string
          author?: string
          isbn?: string | null
          cover_url?: string | null
          description?: string | null
          page_count?: number | null
          published_date?: string | null
          genre?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      swimlanes: {
        Row: {
          id: number
          name: string
          description: string | null
          order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          order: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          order?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_books: {
        Row: {
          id: number
          user_id: string
          book_id: number
          lane_id: number
          status: 'to-read' | 'reading' | 'completed'
          rating: number | null
          notes: string | null
          date_added: string
          date_started: string | null
          date_completed: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          book_id: number
          lane_id: number
          status?: 'to-read' | 'reading' | 'completed'
          rating?: number | null
          notes?: string | null
          date_added?: string
          date_started?: string | null
          date_completed?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          book_id?: number
          lane_id?: number
          status?: 'to-read' | 'reading' | 'completed'
          rating?: number | null
          notes?: string | null
          date_added?: string
          date_started?: string | null
          date_completed?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reading_goals: {
        Row: {
          id: number
          user_id: string
          goal_type: 'books' | 'pages'
          target_count: number
          year: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          goal_type: 'books' | 'pages'
          target_count: number
          year: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          goal_type?: 'books' | 'pages'
          target_count?: number
          year?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
} 