import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '../../test/test-utils'
import { BookSearch } from '../../components/book-search'
import { mockBook } from '../../test/test-utils'

// Mock the API request function
jest.mock('../../lib/queryClient', () => ({
  apiRequest: jest.fn(),
}))

// Mock the openLibrary module
jest.mock('../../lib/openLibrary', () => ({
  searchBooks: jest.fn(),
  getCoverImageUrl: jest.fn((coverId) =>
    coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : 'https://via.placeholder.com/300x400'
  ),
}))

// Mock the useDebounce hook to make tests faster
jest.mock('../../hooks/use-debounce', () => ({
  useDebounce: (value: string) => value,
}))

// Mock useRouter
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock useQueryClient
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
  }),
}))

// Helper to render and wait for auth check
async function renderBookSearch() {
  let result: ReturnType<typeof render>
  await act(async () => {
    result = render(<BookSearch />)
    // Wait for auth check to complete
    await new Promise(resolve => setTimeout(resolve, 0))
  })
  return result!
}

describe('BookSearch', () => {
  const mockLocalBook = {
    ...mockBook,
    id: 100,
    title: 'Local Book',
    author: 'Local Author',
  }

  const mockOpenLibraryBook = {
    key: '/works/OL123',
    title: 'Open Library Book',
    author_name: ['OL Author'],
    number_of_pages_median: 250,
    cover_i: 12345,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Default: user is authenticated
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({ ok: true })
      }
      if (url.includes('/api/books/search')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      }
      return Promise.resolve({ ok: false })
    })
  })

  it('renders the Add Book button', async () => {
    await renderBookSearch()
    expect(screen.getByRole('button', { name: /add book/i })).toBeInTheDocument()
  })

  it('opens dialog when Add Book button is clicked', async () => {
    await renderBookSearch()

    const addButton = screen.getByRole('button', { name: /add book/i })
    await act(async () => {
      fireEvent.click(addButton)
    })

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Search Books')).toBeInTheDocument()
    })
  })

  it('shows empty state message when no query entered', async () => {
    await renderBookSearch()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add book/i }))
    })

    await waitFor(() => {
      expect(screen.getByText('Start typing to search for books')).toBeInTheDocument()
    })
  })

  it('shows loading skeletons while searching', async () => {
    const { searchBooks } = require('../../lib/openLibrary')
    searchBooks.mockImplementation(() => new Promise(() => {})) // Never resolves

    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({ ok: true })
      }
      if (url.includes('/api/books/search')) {
        return new Promise(() => {}) // Never resolves
      }
      return Promise.resolve({ ok: false })
    })

    await renderBookSearch()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add book/i }))
    })

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search by title or author...')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Search by title or author...')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'test query' } })
    })

    await waitFor(() => {
      // Skeletons have animate-pulse class
      const skeletons = document.querySelectorAll('[class*="animate-pulse"]')
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  it('shows "No books found" when search returns empty results', async () => {
    const { searchBooks } = require('../../lib/openLibrary')
    searchBooks.mockResolvedValue([])

    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({ ok: true })
      }
      if (url.includes('/api/books/search')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      }
      return Promise.resolve({ ok: false })
    })

    await renderBookSearch()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add book/i }))
    })

    const input = screen.getByPlaceholderText('Search by title or author...')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'nonexistent book xyz' } })
    })

    await waitFor(() => {
      expect(screen.getByText('No books found')).toBeInTheDocument()
    })
  })

  it('displays local books with "Already in your library" badge', async () => {
    const { searchBooks } = require('../../lib/openLibrary')
    searchBooks.mockResolvedValue([])

    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({ ok: true })
      }
      if (url.includes('/api/books/search')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([mockLocalBook]),
        })
      }
      return Promise.resolve({ ok: false })
    })

    await renderBookSearch()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add book/i }))
    })

    const input = screen.getByPlaceholderText('Search by title or author...')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Local' } })
    })

    await waitFor(() => {
      expect(screen.getByText('Local Book')).toBeInTheDocument()
      expect(screen.getByText('Already in your library')).toBeInTheDocument()
    })
  })

  it('displays Open Library books with Add button', async () => {
    const { searchBooks } = require('../../lib/openLibrary')
    searchBooks.mockResolvedValue([mockOpenLibraryBook])

    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({ ok: true })
      }
      if (url.includes('/api/books/search')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      }
      return Promise.resolve({ ok: false })
    })

    await renderBookSearch()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add book/i }))
    })

    const input = screen.getByPlaceholderText('Search by title or author...')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Open Library' } })
    })

    await waitFor(() => {
      expect(screen.getByText('Open Library Book')).toBeInTheDocument()
      expect(screen.getByText('OL Author')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument()
    })
  })

  it('deduplicates results when same book exists locally and in Open Library', async () => {
    const { searchBooks } = require('../../lib/openLibrary')
    // Open Library has a book with same title and author as local book
    const duplicateOLBook = {
      key: '/works/OL999',
      title: 'Local Book',
      author_name: ['Local Author'],
      number_of_pages_median: 300,
      cover_i: 99999,
    }
    searchBooks.mockResolvedValue([duplicateOLBook])

    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({ ok: true })
      }
      if (url.includes('/api/books/search')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([mockLocalBook]),
        })
      }
      return Promise.resolve({ ok: false })
    })

    await renderBookSearch()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add book/i }))
    })

    const input = screen.getByPlaceholderText('Search by title or author...')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Local' } })
    })

    await waitFor(() => {
      // Should only show one instance of the book (the local one)
      const bookTitles = screen.getAllByText('Local Book')
      expect(bookTitles).toHaveLength(1)
      expect(screen.getByText('Already in your library')).toBeInTheDocument()
      // Should NOT have an Add button since it's local
      expect(screen.queryByRole('button', { name: /^add$/i })).not.toBeInTheDocument()
    })
  })

  it('redirects to auth page with book data when unauthenticated user clicks Add', async () => {
    const { searchBooks } = require('../../lib/openLibrary')
    searchBooks.mockResolvedValue([mockOpenLibraryBook])

    // User is not authenticated
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({ ok: false })
      }
      if (url.includes('/api/books/search')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      }
      return Promise.resolve({ ok: false })
    })

    await renderBookSearch()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add book/i }))
    })

    const input = screen.getByPlaceholderText('Search by title or author...')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Open Library' } })
    })

    await waitFor(() => {
      expect(screen.getByText('Open Library Book')).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: /^add$/i })
    await act(async () => {
      fireEvent.click(addButton)
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled()
      const pushCall = mockPush.mock.calls[0][0]
      expect(pushCall).toContain('/auth?book=')
    })
  })

  it('calls addBookMutation when authenticated user clicks Add', async () => {
    const { searchBooks } = require('../../lib/openLibrary')
    const { apiRequest } = require('../../lib/queryClient')
    searchBooks.mockResolvedValue([mockOpenLibraryBook])
    apiRequest.mockResolvedValue({ ok: true })

    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({ ok: true })
      }
      if (url.includes('/api/books/search')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      }
      return Promise.resolve({ ok: false })
    })

    await renderBookSearch()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add book/i }))
    })

    const input = screen.getByPlaceholderText('Search by title or author...')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Open Library' } })
    })

    await waitFor(() => {
      expect(screen.getByText('Open Library Book')).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: /^add$/i })
    await act(async () => {
      fireEvent.click(addButton)
    })

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('POST', '/api/books', expect.objectContaining({
        title: 'Open Library Book',
        author: 'OL Author',
        status: 'to-read',
      }))
    })
  })

  it('shows book pages in search results', async () => {
    const { searchBooks } = require('../../lib/openLibrary')
    searchBooks.mockResolvedValue([mockOpenLibraryBook])

    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({ ok: true })
      }
      if (url.includes('/api/books/search')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      }
      return Promise.resolve({ ok: false })
    })

    await renderBookSearch()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add book/i }))
    })

    const input = screen.getByPlaceholderText('Search by title or author...')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Open Library' } })
    })

    await waitFor(() => {
      expect(screen.getByText('250 pages')).toBeInTheDocument()
    })
  })

  it('handles Open Library API failure gracefully', async () => {
    const { searchBooks } = require('../../lib/openLibrary')
    searchBooks.mockRejectedValue(new Error('API Error'))

    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({ ok: true })
      }
      if (url.includes('/api/books/search')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([mockLocalBook]),
        })
      }
      return Promise.resolve({ ok: false })
    })

    await renderBookSearch()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add book/i }))
    })

    const input = screen.getByPlaceholderText('Search by title or author...')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Local' } })
    })

    // Should still show local results even when Open Library fails
    await waitFor(() => {
      expect(screen.getByText('Local Book')).toBeInTheDocument()
    })
  })

  it('handles local API failure gracefully', async () => {
    const { searchBooks } = require('../../lib/openLibrary')
    searchBooks.mockResolvedValue([mockOpenLibraryBook])

    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({ ok: true })
      }
      if (url.includes('/api/books/search')) {
        return Promise.resolve({ ok: false, status: 500 })
      }
      return Promise.resolve({ ok: false })
    })

    await renderBookSearch()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add book/i }))
    })

    const input = screen.getByPlaceholderText('Search by title or author...')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Open' } })
    })

    // Should still show Open Library results even when local API fails
    await waitFor(() => {
      expect(screen.getByText('Open Library Book')).toBeInTheDocument()
    })
  })

  it('uses default pages when Open Library book has no page count', async () => {
    const { searchBooks } = require('../../lib/openLibrary')
    const bookWithoutPages = {
      ...mockOpenLibraryBook,
      number_of_pages_median: undefined,
    }
    searchBooks.mockResolvedValue([bookWithoutPages])

    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({ ok: true })
      }
      if (url.includes('/api/books/search')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      }
      return Promise.resolve({ ok: false })
    })

    await renderBookSearch()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add book/i }))
    })

    const input = screen.getByPlaceholderText('Search by title or author...')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Open Library' } })
    })

    await waitFor(() => {
      expect(screen.getByText('200 pages')).toBeInTheDocument() // Default is 200
    })
  })

  it('uses "Unknown Author" when Open Library book has no author', async () => {
    const { searchBooks } = require('../../lib/openLibrary')
    const bookWithoutAuthor = {
      ...mockOpenLibraryBook,
      author_name: undefined,
    }
    searchBooks.mockResolvedValue([bookWithoutAuthor])

    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({ ok: true })
      }
      if (url.includes('/api/books/search')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      }
      return Promise.resolve({ ok: false })
    })

    await renderBookSearch()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add book/i }))
    })

    const input = screen.getByPlaceholderText('Search by title or author...')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Open Library' } })
    })

    await waitFor(() => {
      expect(screen.getByText('Unknown Author')).toBeInTheDocument()
    })
  })
})
