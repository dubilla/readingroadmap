// Mock Next.js server types for test environment
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      status: init?.status || 200,
      json: async () => data,
    }),
  },
}))

import { GET, PATCH, DELETE } from '../../../app/api/goals/[id]/route'

// Mock Supabase
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
    },
    from: jest.fn(),
  })),
}))

describe('/api/goals/[id]', () => {
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

  const createMockRequest = (body?: any) => {
    return {
      json: jest.fn().mockResolvedValue(body),
      cookies: {
        get: jest.fn().mockReturnValue({ value: 'mock-cookie' }),
      },
    } as any
  }

  const createMockParams = (id: string) => {
    return Promise.resolve({ id })
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

  const mockGoal = {
    id: 1,
    user_id: 'user-123',
    goal_type: 'books',
    target_count: 50,
    year: 2025,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  }

  describe('GET', () => {
    it('should return 401 when not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValue(mockNoSession)

      const request = createMockRequest()
      const response = await GET(request, { params: createMockParams('1') })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Not authenticated' })
    })

    it('should return a goal by id', async () => {
      mockSupabase.auth.getSession.mockResolvedValue(mockSession)

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockGoal,
                error: null,
              }),
            }),
          }),
        }),
      })

      const request = createMockRequest()
      const response = await GET(request, { params: createMockParams('1') })
      const data = await response.json()

      expect(response.status).toBe(200)
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

    it('should return 404 when goal not found', async () => {
      mockSupabase.auth.getSession.mockResolvedValue(mockSession)

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
              }),
            }),
          }),
        }),
      })

      const request = createMockRequest()
      const response = await GET(request, { params: createMockParams('999') })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'Goal not found' })
    })
  })

  describe('PATCH', () => {
    it('should return 401 when not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValue(mockNoSession)

      const request = createMockRequest({ targetCount: 60 })
      const response = await PATCH(request, { params: createMockParams('1') })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Not authenticated' })
    })

    it('should update a goal', async () => {
      mockSupabase.auth.getSession.mockResolvedValue(mockSession)

      const updatedGoal = {
        ...mockGoal,
        target_count: 60,
        updated_at: '2025-01-02T00:00:00Z',
      }

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: updatedGoal,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      })

      const request = createMockRequest({ targetCount: 60 })
      const response = await PATCH(request, { params: createMockParams('1') })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.targetCount).toBe(60)
    })

    it('should return 404 when goal not found', async () => {
      mockSupabase.auth.getSession.mockResolvedValue(mockSession)

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' },
                }),
              }),
            }),
          }),
        }),
      })

      const request = createMockRequest({ targetCount: 60 })
      const response = await PATCH(request, { params: createMockParams('999') })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'Goal not found' })
    })

    it('should return 400 for invalid data', async () => {
      mockSupabase.auth.getSession.mockResolvedValue(mockSession)

      const request = createMockRequest({ targetCount: -1 })
      const response = await PATCH(request, { params: createMockParams('1') })
      const data = await response.json()

      expect(response.status).toBe(400)
    })
  })

  describe('DELETE', () => {
    it('should return 401 when not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValue(mockNoSession)

      const request = createMockRequest()
      const response = await DELETE(request, { params: createMockParams('1') })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Not authenticated' })
    })

    it('should delete a goal', async () => {
      mockSupabase.auth.getSession.mockResolvedValue(mockSession)

      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              error: null,
            }),
          }),
        }),
      })

      const request = createMockRequest()
      const response = await DELETE(request, { params: createMockParams('1') })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ message: 'Goal deleted successfully' })
    })

    it('should handle delete errors', async () => {
      mockSupabase.auth.getSession.mockResolvedValue(mockSession)

      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              error: { message: 'Delete failed' },
            }),
          }),
        }),
      })

      const request = createMockRequest()
      const response = await DELETE(request, { params: createMockParams('1') })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to delete goal' })
    })
  })
})
