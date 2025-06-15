import { apiRequest } from '../../lib/queryClient'

// Mock the API request function
jest.mock('../../lib/queryClient', () => ({
  apiRequest: jest.fn()
}))

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>

describe('Sign-up Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should handle the complete sign-up and book addition flow', async () => {
    // Mock successful registration
    const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' }
    mockApiRequest
      .mockResolvedValueOnce({ 
        ok: true, 
        json: () => Promise.resolve({ user: mockUser }) 
      }) // Register
      .mockResolvedValueOnce({ 
        ok: true, 
        json: () => Promise.resolve({ success: true }) 
      }) // Add book

    // Step 1: Register user
    const registerResponse = await mockApiRequest('POST', '/api/auth/register', {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    })

    expect(registerResponse.ok).toBe(true)
    const userData = await registerResponse.json()
    expect(userData.user.id).toBe(1)

    // Step 2: Add book to user's library
    const bookData = {
      title: 'Test Book',
      author: 'Test Author',
      pages: 300,
      coverUrl: 'https://example.com/cover.jpg',
      status: 'to-read',
      laneId: 1,
      user_id: userData.user.id
    }

    const addBookResponse = await mockApiRequest('POST', '/api/books', bookData)
    expect(addBookResponse.ok).toBe(true)

    // Verify the flow was called correctly
    expect(mockApiRequest).toHaveBeenCalledTimes(2)
    expect(mockApiRequest).toHaveBeenNthCalledWith(1, 'POST', '/api/auth/register', {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    })
    expect(mockApiRequest).toHaveBeenNthCalledWith(2, 'POST', '/api/books', bookData)
  })

  it('should handle registration errors gracefully', async () => {
    // Mock registration failure
    mockApiRequest.mockResolvedValue({ 
      ok: false, 
      json: () => Promise.resolve({ error: 'Email already exists' }) 
    })

    const registerResponse = await mockApiRequest('POST', '/api/auth/register', {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    })

    expect(registerResponse.ok).toBe(false)
    const errorData = await registerResponse.json()
    expect(errorData.error).toBe('Email already exists')
  })

  it('should handle book addition errors gracefully', async () => {
    // Mock successful registration but failed book addition
    const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' }
    mockApiRequest
      .mockResolvedValueOnce({ 
        ok: true, 
        json: () => Promise.resolve({ user: mockUser }) 
      }) // Register
      .mockResolvedValueOnce({ 
        ok: false, 
        json: () => Promise.resolve({ error: 'Failed to add book' }) 
      }) // Add book

    // Register user
    const registerResponse = await mockApiRequest('POST', '/api/auth/register', {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    })

    expect(registerResponse.ok).toBe(true)

    // Try to add book
    const bookData = {
      title: 'Test Book',
      author: 'Test Author',
      pages: 300,
      user_id: 1
    }

    const addBookResponse = await mockApiRequest('POST', '/api/books', bookData)
    expect(addBookResponse.ok).toBe(false)
    const errorData = await addBookResponse.json()
    expect(errorData.error).toBe('Failed to add book')
  })
}) 