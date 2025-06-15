import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../test/test-utils'
import { BookSearch } from '../../components/book-search'
import { useAuth } from '../../contexts/auth-context'
import { useRouter } from 'next/navigation'

// Mock the auth context and router
jest.mock('../../contexts/auth-context')
jest.mock('next/navigation')
jest.mock('../../lib/openLibrary', () => ({
  searchBooks: jest.fn(),
  getCoverImageUrl: jest.fn((id) => `https://covers.openlibrary.org/b/id/${id}-L.jpg`)
}))

// Mock the API request function
jest.mock('../../lib/queryClient', () => ({
  apiRequest: jest.fn()
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockSearchBooks = require('../../lib/openLibrary').searchBooks as jest.MockedFunction<any>
const mockApiRequest = require('../../lib/queryClient').apiRequest as jest.MockedFunction<any>

describe('BookSearch', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn()
  }

  const mockAuthContext = {
    isAuthenticated: false,
    user: null,
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue(mockAuthContext)
    mockUseRouter.mockReturnValue(mockRouter)
    
    // Mock successful API responses
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve([])
      })
    ) as jest.Mock
  })

  it('renders the Add Book button', () => {
    render(<BookSearch laneId={1} />)
    expect(screen.getByRole('button', { name: /add book/i })).toBeTruthy()
  })

  it('opens the search modal when Add Book button is clicked', () => {
    render(<BookSearch laneId={1} />)
    
    const addButton = screen.getByRole('button', { name: /add book/i })
    fireEvent.click(addButton)
    
    expect(screen.getByText('Search Books')).toBeTruthy()
    expect(screen.getByPlaceholderText('Search by title or author...')).toBeTruthy()
  })

  it('searches for books when user types in the search input', async () => {
    const mockOpenLibraryBooks = [
      {
        key: '/works/OL123',
        title: 'Test Book',
        author_name: ['Test Author'],
        cover_i: 12345,
        number_of_pages_median: 300
      }
    ]

    mockSearchBooks.mockResolvedValue(mockOpenLibraryBooks)

    render(<BookSearch laneId={1} />)
    
    // Open modal
    fireEvent.click(screen.getByRole('button', { name: /add book/i }))
    
    // Type in search
    const searchInput = screen.getByPlaceholderText('Search by title or author...')
    fireEvent.change(searchInput, { target: { value: 'test' } })
    
    await waitFor(() => {
      expect(mockSearchBooks).toHaveBeenCalledWith('test')
    })
  })

  it('displays search results with book information', async () => {
    const mockOpenLibraryBooks = [
      {
        key: '/works/OL123',
        title: 'Test Book',
        author_name: ['Test Author'],
        cover_i: 12345,
        number_of_pages_median: 300
      }
    ]

    mockSearchBooks.mockResolvedValue(mockOpenLibraryBooks)

    render(<BookSearch laneId={1} />)
    
    // Open modal and search
    fireEvent.click(screen.getByRole('button', { name: /add book/i }))
    const searchInput = screen.getByPlaceholderText('Search by title or author...')
    fireEvent.change(searchInput, { target: { value: 'test' } })
    
    await waitFor(() => {
      expect(screen.getByText('Test Book')).toBeTruthy()
      expect(screen.getByText('Test Author')).toBeTruthy()
      expect(screen.getByText('300 pages')).toBeTruthy()
    })
  })

  it('redirects to auth page when unauthenticated user tries to add a book', async () => {
    const mockOpenLibraryBooks = [
      {
        key: '/works/OL123',
        title: 'Test Book',
        author_name: ['Test Author'],
        cover_i: 12345,
        number_of_pages_median: 300
      }
    ]

    mockSearchBooks.mockResolvedValue(mockOpenLibraryBooks)
    mockUseAuth.mockReturnValue({ ...mockAuthContext, isAuthenticated: false })

    render(<BookSearch laneId={1} />)
    
    // Open modal and search
    fireEvent.click(screen.getByRole('button', { name: /add book/i }))
    const searchInput = screen.getByPlaceholderText('Search by title or author...')
    fireEvent.change(searchInput, { target: { value: 'test' } })
    
    await waitFor(() => {
      const addButton = screen.getByRole('button', { name: /add/i })
      fireEvent.click(addButton)
    })
    
    expect(mockRouter.push).toHaveBeenCalledWith(
      expect.stringContaining('/auth?book=')
    )
  })

  it('adds book directly when authenticated user clicks Add', async () => {
    const mockOpenLibraryBooks = [
      {
        key: '/works/OL123',
        title: 'Test Book',
        author_name: ['Test Author'],
        cover_i: 12345,
        number_of_pages_median: 300
      }
    ]

    mockSearchBooks.mockResolvedValue(mockOpenLibraryBooks)
    mockUseAuth.mockReturnValue({ ...mockAuthContext, isAuthenticated: true })
    mockApiRequest.mockResolvedValue({ ok: true })

    render(<BookSearch laneId={1} />)
    
    // Open modal and search
    fireEvent.click(screen.getByRole('button', { name: /add book/i }))
    const searchInput = screen.getByPlaceholderText('Search by title or author...')
    fireEvent.change(searchInput, { target: { value: 'test' } })
    
    await waitFor(() => {
      const addButton = screen.getByRole('button', { name: /add/i })
      fireEvent.click(addButton)
    })
    
    expect(mockApiRequest).toHaveBeenCalledWith('POST', '/api/books', {
      title: 'Test Book',
      author: 'Test Author',
      pages: 300,
      coverUrl: 'https://covers.openlibrary.org/b/id/12345-L.jpg',
      status: 'to-read',
      laneId: 1
    })
  })

  it('handles search errors gracefully', async () => {
    mockSearchBooks.mockRejectedValue(new Error('Search failed'))

    render(<BookSearch laneId={1} />)
    
    // Open modal and search
    fireEvent.click(screen.getByRole('button', { name: /add book/i }))
    const searchInput = screen.getByPlaceholderText('Search by title or author...')
    fireEvent.change(searchInput, { target: { value: 'test' } })
    
    await waitFor(() => {
      // Should not crash and should show no results
      expect(screen.queryByText('Test Book')).toBeNull()
    })
  })
}) 