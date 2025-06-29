// Mock Next.js server types for test environment
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      status: init?.status || 200,
      json: async () => data,
    }),
  },
}))

import { POST } from '../../../app/api/auth/register/route'

// Mock Supabase
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      signUp: jest.fn(),
    },
  })),
}))

describe('/api/auth/register', () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase = {
      auth: {
        signUp: jest.fn(),
      },
    }
    jest.mocked(require('@supabase/ssr').createServerClient).mockReturnValue(mockSupabase)
  })

  const createMockRequest = (body: any) => {
    return {
      json: jest.fn().mockResolvedValue(body),
      cookies: {
        get: jest.fn().mockReturnValue(undefined),
      },
    } as any
  }

  describe('POST', () => {
    it('should register user successfully with email confirmation', async () => {
      // Mock Supabase signUp with email confirmation required
      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: {
            id: '123',
            email: 'test@example.com',
            user_metadata: { name: 'Test User' }
          },
          session: null // No session means email confirmation required
        },
        error: null
      })

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        message: 'Please check your email to confirm your account',
        requiresConfirmation: true,
        user: {
          id: '123',
          email: 'test@example.com',
          name: 'Test User'
        }
      })

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            name: 'Test User'
          },
          emailRedirectTo: expect.stringContaining('/auth/callback')
        }
      })
    })

    it('should register user successfully with immediate sign in', async () => {
      // Mock Supabase signUp with immediate session
      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: {
            id: '123',
            email: 'test@example.com',
            user_metadata: { name: 'Test User' }
          },
          session: { access_token: 'token' } // Session means immediate sign in
        },
        error: null
      })

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        user: {
          id: '123',
          email: 'test@example.com',
          name: 'Test User'
        }
      })
    })

    it('should handle registration errors', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email already exists' }
      })

      const request = createMockRequest({
        email: 'existing@example.com',
        password: 'password123'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: 'Email already exists'
      })
    })

    it('should handle invalid request data', async () => {
      const request = createMockRequest({
        email: 'invalid-email',
        password: '123' // Too short
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: 'Invalid registration data'
      })
    })

    it('should handle missing email', async () => {
      const request = createMockRequest({
        password: 'password123'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: 'Invalid registration data'
      })
    })

    it('should handle missing password', async () => {
      const request = createMockRequest({
        email: 'test@example.com'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: 'Invalid registration data'
      })
    })

    it('should use email prefix as name when name is not provided', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: {
            id: '123',
            email: 'john.doe@example.com',
            user_metadata: { name: 'john.doe' }
          },
          session: null
        },
        error: null
      })

      const request = createMockRequest({
        email: 'john.doe@example.com',
        password: 'password123'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'john.doe@example.com',
        password: 'password123',
        options: {
          data: {
            name: 'john.doe'
          },
          emailRedirectTo: expect.stringContaining('/auth/callback')
        }
      })
    })

    it('should handle server errors gracefully', async () => {
      mockSupabase.auth.signUp.mockRejectedValue(new Error('Database connection failed'))

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        error: 'Internal server error'
      })
    })

    it('should handle registration failure without error message', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: null
      })

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: 'Registration failed'
      })
    })
  })
}) 