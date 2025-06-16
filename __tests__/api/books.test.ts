import { GET, POST } from '../../app/api/books/route'
import { mockBook } from '../../test/test-utils'
import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
const mockSupabase = createServerClient as jest.MockedFunction<typeof createServerClient>

describe('/api/books', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('returns books for authenticated user', async () => {
      // Mock the Supabase client
      const mockSupabaseInstance = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: { user: { id: 'test-user-id' } } },
            error: null
          })
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ 
                data: [mockBook], 
                error: null 
              })
            })
          })
        })
      }

      mockSupabase.mockReturnValue(mockSupabaseInstance as any)

      const request = new NextRequest('http://localhost:3000/api/books')
      const response = await GET(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result).toEqual([mockBook])
    })

    it('returns 401 for unauthenticated user', async () => {
      const mockSupabaseInstance = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: null },
            error: null
          })
        }
      }

      mockSupabase.mockReturnValue(mockSupabaseInstance as any)

      const request = new NextRequest('http://localhost:3000/api/books')
      const response = await GET(request)
      const result = await response.json()

      expect(response.status).toBe(401)
      expect(result.error).toBe('Not authenticated')
    })
  })

  describe('POST', () => {
    it('creates a new book successfully', async () => {
      const bookData = {
        title: 'Test Book',
        author: 'Test Author',
        pages: 300,
        coverUrl: 'https://example.com/cover.jpg',
        status: 'to-read' as const,
        laneId: 1
      }

      const mockSupabaseInstance = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: { user: { id: 'test-user-id' } } },
            error: null
          })
        },
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ 
                data: { id: 1, ...bookData }, 
                error: null 
              })
            })
          })
        })
      }

      mockSupabase.mockReturnValue(mockSupabaseInstance as any)

      const request = new NextRequest('http://localhost:3000/api/books', {
        method: 'POST',
        body: JSON.stringify(bookData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(201)
      expect(result).toBeDefined()
    })

    it('returns 400 for invalid book data', async () => {
      const invalidBookData = {
        title: '', // Empty title
        author: 'Test Author',
        pages: 300
      }

      const mockSupabaseInstance = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: { user: { id: 'test-user-id' } } },
            error: null
          })
        }
      }

      mockSupabase.mockReturnValue(mockSupabaseInstance as any)

      const request = new NextRequest('http://localhost:3000/api/books', {
        method: 'POST',
        body: JSON.stringify(invalidBookData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBeDefined()
    })

    it('handles database errors gracefully', async () => {
      const mockSupabaseInstance = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: { user: { id: 'test-user-id' } } },
            error: null
          })
        },
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ 
                data: null, 
                error: 'Database connection failed' 
              })
            })
          })
        })
      }

      mockSupabase.mockReturnValue(mockSupabaseInstance as any)

      const bookData = {
        title: 'Test Book',
        author: 'Test Author',
        pages: 300,
        coverUrl: 'https://example.com/cover.jpg',
        status: 'to-read' as const,
        laneId: 1
      }

      const request = new NextRequest('http://localhost:3000/api/books', {
        method: 'POST',
        body: JSON.stringify(bookData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Failed to create book')
    })

    it('associates book with authenticated user', async () => {
      const bookData = {
        title: 'Test Book',
        author: 'Test Author',
        pages: 300,
        coverUrl: 'https://example.com/cover.jpg',
        status: 'to-read' as const,
        laneId: 1
      }

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ 
            data: { id: 1, ...bookData, user_id: 'test-user-id' }, 
            error: null 
          })
        })
      })

      const mockSupabaseInstance = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: { user: { id: 'test-user-id' } } },
            error: null
          })
        },
        from: jest.fn().mockReturnValue({
          insert: mockInsert
        })
      }

      mockSupabase.mockReturnValue(mockSupabaseInstance as any)

      const request = new NextRequest('http://localhost:3000/api/books', {
        method: 'POST',
        body: JSON.stringify(bookData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(201)
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          ...bookData,
          user_id: 'test-user-id',
          reading_progress: 0,
          estimated_minutes: expect.any(Number)
        })
      )
    })

    it('handles Supabase auth errors gracefully', async () => {
      const mockSupabaseInstance = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: null },
            error: { message: 'Auth error' }
          })
        }
      }

      mockSupabase.mockReturnValue(mockSupabaseInstance as any)

      const bookData = {
        title: 'Test Book',
        author: 'Test Author',
        pages: 300,
        coverUrl: 'https://example.com/cover.jpg',
        status: 'to-read' as const,
        laneId: 1
      }

      const request = new NextRequest('http://localhost:3000/api/books', {
        method: 'POST',
        body: JSON.stringify(bookData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(401)
      expect(result.error).toBe('Not authenticated')
    })
  })
}) 