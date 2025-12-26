import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../test/test-utils'
import { ReadingBoard } from '../../components/reading-board'
import { mockBook, mockLane } from '../../test/test-utils'
import type { Book, UserLane } from '@shared/schema'

// Mock the API request function
jest.mock('../../lib/queryClient', () => ({
  apiRequest: jest.fn(),
}))

// Mock useQueryClient
const mockInvalidateQueries = jest.fn()
const mockRefetchQueries = jest.fn().mockResolvedValue(undefined)
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
    refetchQueries: mockRefetchQueries,
  }),
}))

// Mock the drag-drop library
jest.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children, onDragEnd }: { children: React.ReactNode; onDragEnd: (result: unknown) => void }) => {
    // Expose onDragEnd for testing
    (global as unknown as { __onDragEnd: typeof onDragEnd }).__onDragEnd = onDragEnd
    return <div data-testid="drag-drop-context">{children}</div>
  },
  Droppable: ({ children, droppableId }: { children: (provided: unknown, snapshot: unknown) => React.ReactNode; droppableId: string }) =>
    children(
      {
        innerRef: jest.fn(),
        droppableProps: { 'data-droppable-id': droppableId },
        placeholder: null,
      },
      {
        isDraggingOver: false,
        draggingOverWith: null,
        draggingFromThisWith: null,
        isUsingPlaceholder: false,
      }
    ),
  Draggable: ({ children, draggableId }: { children: (provided: unknown) => React.ReactNode; draggableId: string }) =>
    children({
      innerRef: jest.fn(),
      draggableProps: { 'data-draggable-id': draggableId },
      dragHandleProps: {},
    }),
}))

// Mock useIsMobile hook
jest.mock('../../hooks/use-mobile', () => ({
  useIsMobile: jest.fn(() => false),
}))

// Mock BookSearch to simplify tests
jest.mock('../../components/book-search', () => ({
  BookSearch: () => <button>Add Book</button>,
}))

// Mock BookActionDrawer
jest.mock('../../components/book-action-drawer', () => ({
  BookActionDrawer: ({ book, open }: { book: Book | null; open: boolean }) =>
    open && book ? <div data-testid="book-action-drawer">{book.title}</div> : null,
}))

describe('ReadingBoard', () => {
  const mockUserLane: UserLane = {
    id: 10,
    name: 'Fiction',
    order: 0,
    userId: 1,
    createdAt: new Date().toISOString(),
  }

  const toReadBook: Book = {
    ...mockBook,
    id: 1,
    title: 'To Read Book',
    status: 'to-read',
    laneId: null,
  }

  const readingBook: Book = {
    ...mockBook,
    id: 2,
    title: 'Reading Book',
    status: 'reading',
    laneId: null,
  }

  const completedBook: Book = {
    ...mockBook,
    id: 3,
    title: 'Completed Book',
    status: 'completed',
    laneId: null,
  }

  const bookInLane: Book = {
    ...mockBook,
    id: 4,
    title: 'Book In Lane',
    status: 'to-read',
    laneId: 10,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Column rendering', () => {
    it('renders all three columns', () => {
      render(<ReadingBoard books={[]} userLanes={[]} />)

      expect(screen.getByText('To Read')).toBeInTheDocument()
      expect(screen.getByText('In Progress')).toBeInTheDocument()
      expect(screen.getByText('Completed')).toBeInTheDocument()
    })

    it('renders the Reading Board header', () => {
      render(<ReadingBoard books={[]} userLanes={[]} />)

      expect(screen.getByText('Reading Board')).toBeInTheDocument()
    })

    it('renders Create Lane button', () => {
      render(<ReadingBoard books={[]} userLanes={[]} />)

      expect(screen.getByRole('button', { name: /create lane/i })).toBeInTheDocument()
    })
  })

  describe('Book grouping by status', () => {
    it('displays to-read books in To Read column', () => {
      render(<ReadingBoard books={[toReadBook]} userLanes={[]} />)

      // BookCard renders both mobile and desktop layouts
      expect(screen.getAllByText('To Read Book').length).toBeGreaterThan(0)
    })

    it('displays reading books in In Progress column', () => {
      render(<ReadingBoard books={[readingBook]} userLanes={[]} />)

      expect(screen.getAllByText('Reading Book').length).toBeGreaterThan(0)
    })

    it('displays completed books in Completed column', () => {
      render(<ReadingBoard books={[completedBook]} userLanes={[]} />)

      expect(screen.getAllByText('Completed Book').length).toBeGreaterThan(0)
    })

    it('groups books correctly when multiple statuses exist', () => {
      render(<ReadingBoard books={[toReadBook, readingBook, completedBook]} userLanes={[]} />)

      expect(screen.getAllByText('To Read Book').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Reading Book').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Completed Book').length).toBeGreaterThan(0)
    })
  })

  describe('Lane organization', () => {
    it('displays default lane as "Wild & Free" in all columns', () => {
      render(<ReadingBoard books={[toReadBook]} userLanes={[]} />)

      // Default lane appears in all 3 status columns
      expect(screen.getAllByText('📚 Wild & Free').length).toBe(3)
    })

    it('displays user-created lane names in all columns', () => {
      render(<ReadingBoard books={[bookInLane]} userLanes={[mockUserLane]} />)

      // Lane appears in all 3 status columns
      expect(screen.getAllByText('Fiction').length).toBe(3)
    })

    it('groups books by lane within status', () => {
      const toReadInLane: Book = { ...toReadBook, id: 5, title: 'To Read In Lane', laneId: 10 }

      render(
        <ReadingBoard
          books={[toReadBook, toReadInLane]}
          userLanes={[mockUserLane]}
        />
      )

      // Lanes appear in all 3 status columns
      expect(screen.getAllByText('📚 Wild & Free').length).toBe(3)
      expect(screen.getAllByText('Fiction').length).toBe(3)
      // BookCard renders both mobile and desktop layouts
      expect(screen.getAllByText('To Read Book').length).toBeGreaterThan(0)
      expect(screen.getAllByText('To Read In Lane').length).toBeGreaterThan(0)
    })

    it('renders empty lanes with drop placeholder', () => {
      // Lane has no books but should still be visible
      const emptyLane: UserLane = { ...mockUserLane, id: 99, name: 'Empty Lane' }

      render(<ReadingBoard books={[toReadBook]} userLanes={[emptyLane]} />)

      // Empty Lane should appear with "Drop books here" placeholder
      // It appears 3 times - once in each status column (To Read, In Progress, Completed)
      expect(screen.getAllByText('Empty Lane').length).toBe(3)
      expect(screen.getAllByText('Drop books here').length).toBeGreaterThan(0)
    })
  })

  describe('Drag and drop', () => {
    it('calls updateBookStatusMutation when dropping on different status lane', async () => {
      const { apiRequest } = require('../../lib/queryClient')
      apiRequest.mockResolvedValue({ ok: true })

      render(<ReadingBoard books={[toReadBook]} userLanes={[]} />)

      // Simulate drag end - format is lane-{laneId}-{status}
      const onDragEnd = (global as unknown as { __onDragEnd: (result: unknown) => void }).__onDragEnd
      onDragEnd({
        draggableId: '1',
        destination: { droppableId: 'lane-default-reading' },
      })

      await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith('PATCH', '/api/books/1/status', { status: 'reading' })
      })
    })

    it('calls updateBookLaneMutation when dropping on lane', async () => {
      const { apiRequest } = require('../../lib/queryClient')
      apiRequest.mockResolvedValue({ ok: true })

      render(<ReadingBoard books={[toReadBook]} userLanes={[mockUserLane]} />)

      // Simulate drag end to a specific lane - format is lane-{laneId}-{status}
      const onDragEnd = (global as unknown as { __onDragEnd: (result: unknown) => void }).__onDragEnd
      onDragEnd({
        draggableId: '1',
        destination: { droppableId: 'lane-10-to-read' },
      })

      await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith('PATCH', '/api/books/1/lane', { laneId: 10 })
      })
    })

    it('does nothing when drop has no destination', () => {
      const { apiRequest } = require('../../lib/queryClient')

      render(<ReadingBoard books={[toReadBook]} userLanes={[]} />)

      // Simulate drag end with no destination (cancelled)
      const onDragEnd = (global as unknown as { __onDragEnd: (result: unknown) => void }).__onDragEnd
      onDragEnd({
        draggableId: '1',
        destination: null,
      })

      expect(apiRequest).not.toHaveBeenCalled()
    })

    it('invalidates queries after status mutation', async () => {
      const { apiRequest } = require('../../lib/queryClient')
      apiRequest.mockResolvedValue({ ok: true })

      render(<ReadingBoard books={[toReadBook]} userLanes={[]} />)

      const onDragEnd = (global as unknown as { __onDragEnd: (result: unknown) => void }).__onDragEnd
      onDragEnd({
        draggableId: '1',
        destination: { droppableId: 'lane-default-completed' },
      })

      await waitFor(() => {
        expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['/api/books'] })
      })
    })
  })

  describe('Lane creation', () => {
    it('opens lane creation dialog when Create Lane button is clicked', async () => {
      render(<ReadingBoard books={[]} userLanes={[]} />)

      const createLaneButton = screen.getByRole('button', { name: /create lane/i })
      fireEvent.click(createLaneButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText('Create New Lane')).toBeInTheDocument()
      })
    })

    it('shows lane name input in dialog', async () => {
      render(<ReadingBoard books={[]} userLanes={[]} />)

      fireEvent.click(screen.getByRole('button', { name: /create lane/i }))

      await waitFor(() => {
        expect(screen.getByLabelText('Lane Name')).toBeInTheDocument()
      })
    })

    it('submits lane creation form', async () => {
      const { apiRequest } = require('../../lib/queryClient')
      apiRequest.mockResolvedValue({ ok: true })

      render(<ReadingBoard books={[]} userLanes={[]} />)

      fireEvent.click(screen.getByRole('button', { name: /create lane/i }))

      await waitFor(() => {
        expect(screen.getByLabelText('Lane Name')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('Enter lane name...')
      fireEvent.change(input, { target: { value: 'My New Lane' } })

      // Find the submit button inside the dialog (not the trigger button)
      const dialog = screen.getByRole('dialog')
      const submitButton = dialog.querySelector('button[type="submit"]')
      expect(submitButton).toBeInTheDocument()
      fireEvent.click(submitButton!)

      await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith('POST', '/api/lanes', expect.objectContaining({
          name: 'My New Lane',
        }))
      })
    })

    it('sets default order to number of existing lanes', async () => {
      const { apiRequest } = require('../../lib/queryClient')
      apiRequest.mockResolvedValue({ ok: true })

      const existingLanes = [
        { ...mockUserLane, id: 1, name: 'Lane 1' },
        { ...mockUserLane, id: 2, name: 'Lane 2' },
      ]

      render(<ReadingBoard books={[]} userLanes={existingLanes} />)

      fireEvent.click(screen.getByRole('button', { name: /create lane/i }))

      await waitFor(() => {
        expect(screen.getByLabelText('Lane Name')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('Enter lane name...')
      fireEvent.change(input, { target: { value: 'Lane 3' } })

      const dialog = screen.getByRole('dialog')
      const submitButton = dialog.querySelector('button[type="submit"]')
      fireEvent.click(submitButton!)

      await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith('POST', '/api/lanes', {
          name: 'Lane 3',
          order: 2, // 0-indexed, so third lane is order 2
        })
      })
    })

    it('refetches lanes query after creation', async () => {
      const { apiRequest } = require('../../lib/queryClient')
      apiRequest.mockResolvedValue({ ok: true })

      render(<ReadingBoard books={[]} userLanes={[]} />)

      fireEvent.click(screen.getByRole('button', { name: /create lane/i }))

      await waitFor(() => {
        expect(screen.getByLabelText('Lane Name')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('Enter lane name...')
      fireEvent.change(input, { target: { value: 'New Lane' } })

      const dialog = screen.getByRole('dialog')
      const submitButton = dialog.querySelector('button[type="submit"]')
      fireEvent.click(submitButton!)

      await waitFor(() => {
        expect(mockRefetchQueries).toHaveBeenCalledWith({ queryKey: ['/api/lanes'] })
      })
    })
  })

  describe('Mobile behavior', () => {
    it('opens book action drawer when book is tapped on mobile', async () => {
      const { useIsMobile } = require('../../hooks/use-mobile')
      useIsMobile.mockReturnValue(true)

      render(<ReadingBoard books={[toReadBook]} userLanes={[]} />)

      // Find the book card and click on the Card element itself (with overflow-hidden class)
      const bookTitles = screen.getAllByText('To Read Book')
      const cardElement = bookTitles[0].closest('.overflow-hidden')
      expect(cardElement).toBeInTheDocument()

      // Click on the Card component directly - this triggers the onClick handler
      fireEvent.click(cardElement!)

      await waitFor(() => {
        expect(screen.getByTestId('book-action-drawer')).toBeInTheDocument()
        expect(screen.getByTestId('book-action-drawer')).toHaveTextContent('To Read Book')
      })
    })

    it('does not open drawer on desktop', () => {
      const { useIsMobile } = require('../../hooks/use-mobile')
      useIsMobile.mockReturnValue(false)

      render(<ReadingBoard books={[toReadBook]} userLanes={[]} />)

      const bookTitles = screen.getAllByText('To Read Book')
      const cardElement = bookTitles[0].closest('.overflow-hidden')
      fireEvent.click(cardElement!)

      expect(screen.queryByTestId('book-action-drawer')).not.toBeInTheDocument()
    })
  })

  describe('BookSearch integration', () => {
    it('renders BookSearch component in To Read column', () => {
      render(<ReadingBoard books={[]} userLanes={[]} />)

      expect(screen.getByRole('button', { name: /add book/i })).toBeInTheDocument()
    })
  })
})
