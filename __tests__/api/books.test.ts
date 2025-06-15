import { GET, POST } from '../../app/api/books/route'
import { mockBook } from '../../test/test-utils'

// Mock the database client
jest.mock('../../lib/database', () => ({
  db: {
    query: jest.fn(),
    insert: jest.fn(),
  },
}))

const { db } = require('../../lib/database')

describe('/api/books', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return books successfully', async () => {
      const mockBooks = [mockBook]
      db.query.mockResolvedValue({ data: mockBooks, error: null })

      // GET handler does not use any properties of the request object
      const response = await GET({} as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockBooks)
      expect(db.query).toHaveBeenCalledWith('books')
    })

    it('should handle database errors', async () => {
      db.query.mockResolvedValue({ data: null, error: 'Database error' })

      const response = await GET({} as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch books')
    })

    it('should handle unexpected errors', async () => {
      db.query.mockRejectedValue(new Error('Unexpected error'))

      const response = await GET({} as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('POST', () => {
    const validBookData = {
      title: 'New Book',
      author: 'New Author',
      pages: 250,
      coverUrl: 'https://example.com/new-cover.jpg',
      status: 'to-read' as const,
    }

    it('should create a book successfully', async () => {
      const createdBook = { ...mockBook, ...validBookData, id: 2 }
      db.insert.mockResolvedValue({ data: createdBook, error: null })

      const mockRequest = {
        json: async () => validBookData,
      }
      const response = await POST(mockRequest as any)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual(createdBook)
      expect(db.insert).toHaveBeenCalledWith('books', expect.objectContaining({
        ...validBookData,
        user_id: 1,
        reading_progress: 0,
        estimated_minutes: expect.any(Number),
      }))
    })

    it('should validate required fields', async () => {
      const invalidBookData = {
        title: '', // Invalid: empty title
        author: 'New Author',
        pages: 250,
        coverUrl: 'https://example.com/new-cover.jpg',
        status: 'to-read' as const,
      }

      const mockRequest = {
        json: async () => invalidBookData,
      }
      const response = await POST(mockRequest as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('String must contain at least 1 character(s)')
    })

    it('should validate page count', async () => {
      const invalidBookData = {
        ...validBookData,
        pages: 0, // Invalid: pages must be > 0
      }

      const mockRequest = {
        json: async () => invalidBookData,
      }
      const response = await POST(mockRequest as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Number must be greater than or equal to 1')
    })

    it('should validate cover URL format', async () => {
      const invalidBookData = {
        ...validBookData,
        coverUrl: 'not-a-url', // Invalid: not a valid URL
      }

      const mockRequest = {
        json: async () => invalidBookData,
      }
      const response = await POST(mockRequest as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid url')
    })

    it('should handle database errors during creation', async () => {
      db.insert.mockResolvedValue({ data: null, error: 'Database error' })

      const mockRequest = {
        json: async () => validBookData,
      }
      const response = await POST(mockRequest as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create book')
    })

    it('should handle unexpected errors during creation', async () => {
      db.insert.mockRejectedValue(new Error('Unexpected error'))

      const mockRequest = {
        json: async () => validBookData,
      }
      const response = await POST(mockRequest as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
}) 