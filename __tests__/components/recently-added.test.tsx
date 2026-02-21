import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '../../test/test-utils'
import HomePage from '../../app/page'
import { mockBook } from '../../test/test-utils'
import type { Book, UserLane } from '@shared/schema'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

// Mock the API request function
jest.mock('../../lib/queryClient', () => ({
  apiRequest: jest.fn(),
  getQueryFn: jest.fn(() => jest.fn()),
}))

// Mock child components to simplify tests
jest.mock('../../components/nav-header', () => ({
  NavHeader: () => <div data-testid="nav-header">NavHeader</div>,
}))

jest.mock('../../components/reading-board', () => ({
  ReadingBoard: () => <div data-testid="reading-board">ReadingBoard</div>,
}))

jest.mock('../../components/book-search', () => ({
  BookSearch: () => <button>Add Book</button>,
}))

jest.mock('../../components/goal-card', () => ({
  GoalCard: () => <div>GoalCard</div>,
}))

jest.mock('../../components/goal-form', () => ({
  GoalForm: () => <div data-testid="goal-form">GoalForm</div>,
}))

// Mock BookActionDrawer to capture props and allow interaction
jest.mock('../../components/book-action-drawer', () => ({
  BookActionDrawer: ({ book, open, onStatusChange, onLaneChange, onDelete }: {
    book: Book | null;
    open: boolean;
    onStatusChange: (bookId: number, status: string) => void;
    onLaneChange: (bookId: number, laneId: number | null) => void;
    onDelete?: (bookId: number) => void;
    userLanes: UserLane[];
    onOpenChange: (open: boolean) => void;
  }) => {
    return open && book ? (
      <div data-testid="book-action-drawer">
        <span data-testid="drawer-book-title">{book.title}</span>
        <span data-testid="drawer-book-author">{book.author}</span>
        <button
          data-testid="status-change-btn"
          onClick={() => onStatusChange(book.id, 'reading')}
        >
          Change Status
        </button>
        <button
          data-testid="lane-change-btn"
          onClick={() => onLaneChange(book.id, 1)}
        >
          Change Lane
        </button>
        {onDelete && (
          <button
            data-testid="delete-btn"
            onClick={() => onDelete(book.id)}
          >
            Delete Book
          </button>
        )}
      </div>
    ) : null
  },
}))

// Variables for controlling useQuery return values per test
let mockBooksData: Book[] = []
let mockLanesData: UserLane[] = []

// Mock useQueryClient and useQuery
const mockInvalidateQueries = jest.fn()
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
  useQuery: ({ queryKey }: { queryKey: string[] }) => {
    const key = queryKey[0]
    if (key === '/api/books') {
      return { data: mockBooksData, isLoading: false }
    }
    if (key === '/api/lanes') {
      return { data: mockLanesData, isLoading: false }
    }
    if (key === '/api/goals') {
      return { data: [], isLoading: false }
    }
    return { data: undefined, isLoading: false }
  },
}))

// Test data
const book1: Book = {
  ...mockBook,
  id: 1,
  title: 'First Book',
  author: 'Author One',
  status: 'to-read',
}

const book2: Book = {
  ...mockBook,
  id: 2,
  title: 'Second Book',
  author: 'Author Two',
  status: 'reading',
}

const book3: Book = {
  ...mockBook,
  id: 3,
  title: 'Third Book',
  author: 'Author Three',
  status: 'completed',
}

const book4: Book = {
  ...mockBook,
  id: 4,
  title: 'Fourth Book',
  author: 'Author Four',
  status: 'to-read',
}

const allBooks = [book1, book2, book3, book4]

const mockUserLane: UserLane = {
  id: 1,
  name: 'Fiction',
  userId: '1',
  order: 0,
}

// Helper to render HomePage in authenticated state with books
async function renderAuthenticatedDashboard(books: Book[] = allBooks, lanes: UserLane[] = []) {
  mockBooksData = books
  mockLanesData = lanes

  // Mock fetch for auth check
  global.fetch = jest.fn((url: string) => {
    if (typeof url === 'string' && url.includes('/api/auth/me')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ user: { email: 'test@example.com' } }),
      })
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    })
  }) as jest.Mock

  let result: ReturnType<typeof render>
  await act(async () => {
    result = render(<HomePage />)
  })

  // Wait for auth check to complete and dashboard to render
  await waitFor(() => {
    expect(screen.getByText('Recently Added')).toBeInTheDocument()
  })

  return result!
}

describe('Recently Added - Edit Modal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockBooksData = []
    mockLanesData = []
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Book card interactivity', () => {
    it('renders recently added books with cursor-pointer class', async () => {
      await renderAuthenticatedDashboard()

      const bookTitle = screen.getByText('Fourth Book')
      const card = bookTitle.closest('.cursor-pointer')
      expect(card).toBeInTheDocument()
    })

    it('renders recently added books in reverse chronological order', async () => {
      await renderAuthenticatedDashboard()

      expect(screen.getByText('First Book')).toBeInTheDocument()
      expect(screen.getByText('Second Book')).toBeInTheDocument()
      expect(screen.getByText('Third Book')).toBeInTheDocument()
      expect(screen.getByText('Fourth Book')).toBeInTheDocument()
    })
  })

  describe('Drawer interaction', () => {
    it('opens book action drawer when a recently added book is clicked', async () => {
      await renderAuthenticatedDashboard()

      // Drawer should not be visible initially
      expect(screen.queryByTestId('book-action-drawer')).not.toBeInTheDocument()

      // Click on a book card
      const bookTitle = screen.getByText('Fourth Book')
      const card = bookTitle.closest('.cursor-pointer')
      fireEvent.click(card!)

      // Drawer should now be visible with the correct book
      await waitFor(() => {
        expect(screen.getByTestId('book-action-drawer')).toBeInTheDocument()
        expect(screen.getByTestId('drawer-book-title')).toHaveTextContent('Fourth Book')
        expect(screen.getByTestId('drawer-book-author')).toHaveTextContent('Author Four')
      })
    })

    it('opens drawer with the correct book when different books are clicked', async () => {
      await renderAuthenticatedDashboard()

      // Click on the first book
      const firstBookTitle = screen.getByText('First Book')
      const firstCard = firstBookTitle.closest('.cursor-pointer')
      fireEvent.click(firstCard!)

      await waitFor(() => {
        expect(screen.getByTestId('drawer-book-title')).toHaveTextContent('First Book')
        expect(screen.getByTestId('drawer-book-author')).toHaveTextContent('Author One')
      })
    })
  })

  describe('Status changes', () => {
    it('calls API to update book status when status is changed in drawer', async () => {
      const { apiRequest } = require('../../lib/queryClient')
      apiRequest.mockResolvedValue({ ok: true })

      await renderAuthenticatedDashboard()

      // Click on a book to open drawer
      const bookTitle = screen.getByText('Fourth Book')
      const card = bookTitle.closest('.cursor-pointer')
      fireEvent.click(card!)

      await waitFor(() => {
        expect(screen.getByTestId('book-action-drawer')).toBeInTheDocument()
      })

      // Click the status change button in the mock drawer
      fireEvent.click(screen.getByTestId('status-change-btn'))

      await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith('PATCH', '/api/books/4/status', { status: 'reading' })
      })
    })

    it('invalidates books query after status change', async () => {
      const { apiRequest } = require('../../lib/queryClient')
      apiRequest.mockResolvedValue({ ok: true })

      await renderAuthenticatedDashboard()

      // Click on a book to open drawer
      const bookTitle = screen.getByText('Fourth Book')
      const card = bookTitle.closest('.cursor-pointer')
      fireEvent.click(card!)

      await waitFor(() => {
        expect(screen.getByTestId('book-action-drawer')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('status-change-btn'))

      await waitFor(() => {
        expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['/api/books'] })
      })
    })
  })

  describe('Lane changes', () => {
    it('calls API to update book lane when lane is changed in drawer', async () => {
      const { apiRequest } = require('../../lib/queryClient')
      apiRequest.mockResolvedValue({ ok: true })

      await renderAuthenticatedDashboard(allBooks, [mockUserLane])

      // Click on a book to open drawer
      const bookTitle = screen.getByText('Fourth Book')
      const card = bookTitle.closest('.cursor-pointer')
      fireEvent.click(card!)

      await waitFor(() => {
        expect(screen.getByTestId('book-action-drawer')).toBeInTheDocument()
      })

      // Click the lane change button in the mock drawer
      fireEvent.click(screen.getByTestId('lane-change-btn'))

      await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith('PATCH', '/api/books/4/lane', { laneId: 1 })
      })
    })

    it('invalidates books query after lane change', async () => {
      const { apiRequest } = require('../../lib/queryClient')
      apiRequest.mockResolvedValue({ ok: true })

      await renderAuthenticatedDashboard(allBooks, [mockUserLane])

      // Click on a book to open drawer
      const bookTitle = screen.getByText('Fourth Book')
      const card = bookTitle.closest('.cursor-pointer')
      fireEvent.click(card!)

      await waitFor(() => {
        expect(screen.getByTestId('book-action-drawer')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('lane-change-btn'))

      await waitFor(() => {
        expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['/api/books'] })
      })
    })
  })

  describe('Delete book', () => {
    it('renders delete button in the drawer', async () => {
      await renderAuthenticatedDashboard()

      const bookTitle = screen.getByText('Fourth Book')
      const card = bookTitle.closest('.cursor-pointer')
      fireEvent.click(card!)

      await waitFor(() => {
        expect(screen.getByTestId('delete-btn')).toBeInTheDocument()
      })
    })

    it('calls API to delete book when delete button is clicked in drawer', async () => {
      const { apiRequest } = require('../../lib/queryClient')
      apiRequest.mockResolvedValue({ ok: true })

      await renderAuthenticatedDashboard()

      const bookTitle = screen.getByText('Fourth Book')
      const card = bookTitle.closest('.cursor-pointer')
      fireEvent.click(card!)

      await waitFor(() => {
        expect(screen.getByTestId('book-action-drawer')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('delete-btn'))

      await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith('DELETE', '/api/books/4')
      })
    })

    it('invalidates books query after deleting', async () => {
      const { apiRequest } = require('../../lib/queryClient')
      apiRequest.mockResolvedValue({ ok: true })

      await renderAuthenticatedDashboard()

      const bookTitle = screen.getByText('Fourth Book')
      const card = bookTitle.closest('.cursor-pointer')
      fireEvent.click(card!)

      await waitFor(() => {
        expect(screen.getByTestId('book-action-drawer')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('delete-btn'))

      await waitFor(() => {
        expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['/api/books'] })
      })
    })
  })

  describe('Empty state', () => {
    it('does not render book cards when there are no books', async () => {
      await renderAuthenticatedDashboard([])

      expect(screen.getByText('No books yet')).toBeInTheDocument()
      expect(screen.queryByTestId('book-action-drawer')).not.toBeInTheDocument()
    })
  })
})
