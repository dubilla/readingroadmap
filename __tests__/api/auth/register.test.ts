// Mock Next.js server types for test environment
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      status: init?.status || 200,
      json: async () => data,
    }),
  },
}))

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}))

// Mock drizzle-orm operators
jest.mock('drizzle-orm', () => ({
  eq: jest.fn((col, val) => ({ col, val })),
}))

import { POST } from '../../../app/api/auth/register/route'

describe('/api/auth/register', () => {
  let mockDb: any
  let mockSignIn: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockDb = require('@/lib/db').db
    mockSignIn = require('@/auth').signIn
  })

  const createMockRequest = (body: any) => ({
    json: jest.fn().mockResolvedValue(body),
    cookies: { get: jest.fn().mockReturnValue(undefined) },
  } as any)

  describe('POST', () => {
    it('should return 400 for invalid email', async () => {
      const request = createMockRequest({ email: 'invalid', password: 'password123' })
      const response = await POST(request)
      const data = await response.json()
      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Invalid registration data' })
    })

    it('should return 400 for short password', async () => {
      const request = createMockRequest({ email: 'test@example.com', password: '123' })
      const response = await POST(request)
      const data = await response.json()
      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Invalid registration data' })
    })

    it('should return 400 for missing email', async () => {
      const request = createMockRequest({ password: 'password123' })
      const response = await POST(request)
      const data = await response.json()
      expect(response.status).toBe(400)
    })

    it('should return 409 when email already exists', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 'existing-user-id' }]),
        }),
      })

      const request = createMockRequest({ email: 'existing@example.com', password: 'password123' })
      const response = await POST(request)
      const data = await response.json()
      expect(response.status).toBe(409)
      expect(data).toEqual({ error: 'Email already in use' })
    })

    it('should register user successfully', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      })
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]),
        }),
      })
      mockSignIn.mockResolvedValue(undefined)

      const request = createMockRequest({ email: 'new@example.com', password: 'password123' })
      const response = await POST(request)
      const data = await response.json()
      expect(response.status).toBe(201)
      expect(data).toEqual({ success: true })
    })

    it('should handle server errors gracefully', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockRejectedValue(new Error('Database error')),
        }),
      })

      const request = createMockRequest({ email: 'test@example.com', password: 'password123' })
      const response = await POST(request)
      const data = await response.json()
      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Internal server error' })
    })
  })
})
