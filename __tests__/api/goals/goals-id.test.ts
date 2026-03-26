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
}))

import { GET, PATCH, DELETE } from '../../../app/api/goals/[id]/route'

describe('/api/goals/[id]', () => {
  let mockAuth: any
  let mockDb: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth = require('@/auth').auth
    mockDb = require('@/lib/db').db
  })

  const createMockRequest = (body?: any) => ({
    json: jest.fn().mockResolvedValue(body),
  } as any)

  const createMockParams = (id: string) => Promise.resolve({ id })

  const mockSession = { user: { id: 'user-123', email: 'test@example.com', name: 'Test' } }

  const mockGoal = {
    id: 1,
    userId: 'user-123',
    goalType: 'books',
    targetCount: 50,
    year: 2025,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  }

  describe('GET', () => {
    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null)
      const response = await GET(createMockRequest(), { params: createMockParams('1') })
      const data = await response.json()
      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Not authenticated' })
    })

    it('should return a goal by id', async () => {
      mockAuth.mockResolvedValue(mockSession)
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockGoal]),
        }),
      })

      const response = await GET(createMockRequest(), { params: createMockParams('1') })
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
      mockAuth.mockResolvedValue(mockSession)
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      })

      const response = await GET(createMockRequest(), { params: createMockParams('999') })
      const data = await response.json()
      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'Goal not found' })
    })
  })

  describe('PATCH', () => {
    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null)
      const response = await PATCH(createMockRequest({ targetCount: 60 }), { params: createMockParams('1') })
      const data = await response.json()
      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Not authenticated' })
    })

    it('should update a goal', async () => {
      mockAuth.mockResolvedValue(mockSession)
      const updatedGoal = { ...mockGoal, targetCount: 60, updatedAt: '2025-01-02T00:00:00Z' }
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedGoal]),
          }),
        }),
      })

      const response = await PATCH(createMockRequest({ targetCount: 60 }), { params: createMockParams('1') })
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.targetCount).toBe(60)
    })

    it('should return 404 when goal not found', async () => {
      mockAuth.mockResolvedValue(mockSession)
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([]),
          }),
        }),
      })

      const response = await PATCH(createMockRequest({ targetCount: 60 }), { params: createMockParams('999') })
      const data = await response.json()
      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'Goal not found' })
    })

    it('should return 400 for invalid data', async () => {
      mockAuth.mockResolvedValue(mockSession)
      const response = await PATCH(createMockRequest({ targetCount: -1 }), { params: createMockParams('1') })
      const data = await response.json()
      expect(response.status).toBe(400)
    })
  })

  describe('DELETE', () => {
    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null)
      const response = await DELETE(createMockRequest(), { params: createMockParams('1') })
      const data = await response.json()
      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Not authenticated' })
    })

    it('should delete a goal', async () => {
      mockAuth.mockResolvedValue(mockSession)
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockGoal]),
        }),
      })

      const response = await DELETE(createMockRequest(), { params: createMockParams('1') })
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data).toEqual({ message: 'Goal deleted successfully' })
    })
  })
})
