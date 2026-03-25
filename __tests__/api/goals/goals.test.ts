// Mock Next.js server types for test environment
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      status: init?.status || 200,
      json: async () => data,
    }),
  },
}))

// Mock drizzle-orm operators
jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
  and: jest.fn((...args) => args),
  desc: jest.fn(),
}))

import { GET, POST } from '../../../app/api/goals/route'

describe('/api/goals', () => {
  let mockAuth: any
  let mockDb: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth = require('@/auth').auth
    mockDb = require('@/lib/db').db
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
      url: url.toString(),
    } as any
  }

  const mockSession = { user: { id: 'user-123', email: 'test@example.com', name: 'Test' } }

  describe('GET', () => {
    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null)
      const response = await GET(createMockRequest())
      const data = await response.json()
      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Not authenticated' })
    })

    it('should return user goals', async () => {
      mockAuth.mockResolvedValue(mockSession)

      const mockGoals = [
        {
          id: 1,
          userId: 'user-123',
          goalType: 'books',
          targetCount: 50,
          year: 2025,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ]

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockGoals),
          }),
        }),
      })

      const response = await GET(createMockRequest())
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

    it('should handle database errors', async () => {
      mockAuth.mockResolvedValue(mockSession)
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockRejectedValue(new Error('DB error')),
          }),
        }),
      })
      const response = await GET(createMockRequest())
      const data = await response.json()
      expect(response.status).toBe(500)
    })
  })

  describe('POST', () => {
    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null)
      const response = await POST(createMockRequest({ goalType: 'books', targetCount: 50, year: 2025 }))
      const data = await response.json()
      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Not authenticated' })
    })

    it('should create a new goal', async () => {
      mockAuth.mockResolvedValue(mockSession)

      const createdGoal = {
        id: 1,
        userId: 'user-123',
        goalType: 'books',
        targetCount: 50,
        year: 2025,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      }

      // Mock checking for existing goal (not found)
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      })

      // Mock inserting the goal
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([createdGoal]),
        }),
      })

      const response = await POST(createMockRequest({ goalType: 'books', targetCount: 50, year: 2025 }))
      const data = await response.json()
      expect(response.status).toBe(201)
      expect(data).toMatchObject({
        id: 1,
        userId: 'user-123',
        goalType: 'books',
        targetCount: 50,
        year: 2025,
      })
    })

    it('should return 409 when goal already exists', async () => {
      mockAuth.mockResolvedValue(mockSession)
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 1 }]),
        }),
      })

      const response = await POST(createMockRequest({ goalType: 'books', targetCount: 50, year: 2025 }))
      const data = await response.json()
      expect(response.status).toBe(409)
      expect(data).toEqual({ error: 'A books goal for 2025 already exists' })
    })

    it('should return 400 for invalid data', async () => {
      mockAuth.mockResolvedValue(mockSession)
      const response = await POST(createMockRequest({ goalType: 'invalid', targetCount: -1 }))
      const data = await response.json()
      expect(response.status).toBe(400)
    })

    it('should return 400 for missing required fields', async () => {
      mockAuth.mockResolvedValue(mockSession)
      const response = await POST(createMockRequest({ goalType: 'books' }))
      const data = await response.json()
      expect(response.status).toBe(400)
    })
  })
})
