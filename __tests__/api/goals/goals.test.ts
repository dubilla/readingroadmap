// Mock Next.js server types for test environment
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      status: init?.status || 200,
      json: async () => data,
    }),
  },
}))

import { GET, POST } from '../../../app/api/goals/route'

// Mock Supabase
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
    },
    from: jest.fn(),
  })),
}))

describe('/api/goals', () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()

    mockSupabase = {
      auth: {
        getSession: jest.fn(),
      },
      from: jest.fn(),
    }

    jest.mocked(require('@supabase/ssr').createServerClient).mockReturnValue(mockSupabase)
  })

  const createMockRequest = (body?: any, searchParams?: Record<string, string>) => {
    const url = new URL('http://localhost/api/goals')
    if (searchParams) {
      Object.entries(searchParams).forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })
    }

    return {
      json: jest.fn().mockResolvedValue(body),
      cookies: {
        get: jest.fn().mockReturnValue({ value: 'mock-cookie' }),
      },
      url: url.toString(),
    } as any
  }

  const mockSession = {
    data: {
      session: {
        user: { id: 'user-123' },
      },
    },
    error: null,
  }

  const mockNoSession = {
    data: { session: null },
    error: null,
  }

  describe('GET', () => {
    it('should return 401 when not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValue(mockNoSession)

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Not authenticated' })
    })

    it('should return user goals', async () => {
      mockSupabase.auth.getSession.mockResolvedValue(mockSession)

      const mockGoals = [
        {
          id: 1,
          user_id: 'user-123',
          goal_type: 'books',
          target_count: 50,
          year: 2025,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockGoals,
              error: null,
            }),
          }),
        }),
      })

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([
        {
          id: 1,
          userId: 'user-123',
          goalType: 'books',
          targetCount: 50,
          year: 2025,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ])
    })

    it('should filter by year when provided', async () => {
      mockSupabase.auth.getSession.mockResolvedValue(mockSession)

      // The code does: from().select().eq('user_id').order() -> then .eq('year') on the result
      // So order() returns an object that is "thenable" (the query) and also has .eq method

      const yearEqMock = jest.fn().mockImplementation(() => {
        return Promise.resolve({ data: [], error: null })
      })

      const orderMock = jest.fn().mockImplementation(() => {
        // Return an object that is both a promise and has .eq
        const queryResult = Promise.resolve({ data: [], error: null })
        ;(queryResult as any).eq = yearEqMock
        return queryResult
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: orderMock,
          }),
        }),
      })

      const request = createMockRequest(undefined, { year: '2025' })
      await GET(request)

      expect(yearEqMock).toHaveBeenCalledWith('year', 2025)
    })

    it('should handle database errors', async () => {
      mockSupabase.auth.getSession.mockResolvedValue(mockSession)

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      })

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to fetch goals' })
    })
  })

  describe('POST', () => {
    it('should return 401 when not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValue(mockNoSession)

      const request = createMockRequest({
        goalType: 'books',
        targetCount: 50,
        year: 2025,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Not authenticated' })
    })

    it('should create a new goal', async () => {
      mockSupabase.auth.getSession.mockResolvedValue(mockSession)

      // Mock checking for existing goal
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' },
                }),
              }),
            }),
          }),
        }),
      })

      // Mock inserting the goal
      const createdGoal = {
        id: 1,
        user_id: 'user-123',
        goal_type: 'books',
        target_count: 50,
        year: 2025,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      }

      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: createdGoal,
              error: null,
            }),
          }),
        }),
      })

      const request = createMockRequest({
        goalType: 'books',
        targetCount: 50,
        year: 2025,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual({
        id: 1,
        userId: 'user-123',
        goalType: 'books',
        targetCount: 50,
        year: 2025,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      })
    })

    it('should return 409 when goal already exists', async () => {
      mockSupabase.auth.getSession.mockResolvedValue(mockSession)

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 1 },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      })

      const request = createMockRequest({
        goalType: 'books',
        targetCount: 50,
        year: 2025,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data).toEqual({ error: 'A books goal for 2025 already exists' })
    })

    it('should return 400 for invalid data', async () => {
      mockSupabase.auth.getSession.mockResolvedValue(mockSession)

      const request = createMockRequest({
        goalType: 'invalid',
        targetCount: -1,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
    })

    it('should return 400 for missing required fields', async () => {
      mockSupabase.auth.getSession.mockResolvedValue(mockSession)

      const request = createMockRequest({
        goalType: 'books',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
    })
  })
})
