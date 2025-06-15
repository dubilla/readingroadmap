import { GET, POST } from '../../app/api/books/route'
import { mockBook } from '../../test/test-utils'
import { NextRequest } from 'next/server'
import { db } from '../../lib/database'

// Mock the database
jest.mock('../../lib/database', () => ({
  db: {
    insert: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
    query: jest.fn().mockResolvedValue({ data: [], error: null })
  }
}))

const mockDb = db as jest.Mocked<typeof db>

describe('/api/books', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return books successfully', async () => {
      const mockBooks = [mockBook]
      mockDb.query.mockResolvedValue({ data: mockBooks, error: null })

      // GET handler does not use any properties of the request object
      const response = await GET({} as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockBooks)
      expect(mockDb.query).toHaveBeenCalledWith('books')
    })

    it('should handle database errors', async () => {
      mockDb.query.mockResolvedValue({ data: null, error: 'Database error' })

      const response = await GET({} as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch books')
    })

    it('should handle unexpected errors', async () => {
      mockDb.query.mockRejectedValue(new Error('Unexpected error'))

      const response = await GET({} as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('POST', () => {
    it('creates a new book successfully', async () => {
      const bookData = {
        title: 'Test Book',
        author: 'Test Author',
        pages: 300,
        coverUrl: 'https://example.com/cover.jpg',
        status: 'to-read',
        laneId: 1,
        user_id: 1
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

      expect(response.status).toBe(201)
      expect(result.success).toBe(true)
      expect(result.book).toBeDefined()
      expect(mockDb.insert).toHaveBeenCalledWith('books', {
        ...bookData,
        readingProgress: 0,
        estimatedMinutes: 300,
        addedAt: expect.any(String)
      })
    })

    it('returns 400 for invalid book data', async () => {
      const invalidBookData = {
        title: '', // Empty title
        author: 'Test Author',
        pages: 300
      }

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
      expect(mockDb.insert).not.toHaveBeenCalled()
    })

    it('handles database errors gracefully', async () => {
      mockDb.insert.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const bookData = {
        title: 'Test Book',
        author: 'Test Author',
        pages: 300,
        coverUrl: 'https://example.com/cover.jpg',
        status: 'to-read',
        laneId: 1,
        user_id: 1
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

    it('validates required fields', async () => {
      const incompleteBookData = {
        title: 'Test Book'
        // Missing required fields
      }

      const request = new NextRequest('http://localhost:3000/api/books', {
        method: 'POST',
        body: JSON.stringify(incompleteBookData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toContain('author')
      expect(mockDb.insert).not.toHaveBeenCalled()
    })

    it('sets default values for optional fields', async () => {
      const bookData = {
        title: 'Test Book',
        author: 'Test Author',
        pages: 300,
        user_id: 1
        // Missing optional fields
      }

      const request = new NextRequest('http://localhost:3000/api/books', {
        method: 'POST',
        body: JSON.stringify(bookData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(mockDb.insert).toHaveBeenCalledWith('books', {
        ...bookData,
        coverUrl: null,
        status: 'to-read',
        laneId: null,
        readingProgress: 0,
        estimatedMinutes: 300,
        addedAt: expect.any(String)
      })
    })
  })
}) 