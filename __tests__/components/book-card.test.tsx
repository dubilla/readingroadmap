import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../test/test-utils'
import { BookCard } from '../../components/book-card'
import { mockBook } from '../../test/test-utils'

// Mock the API request function
jest.mock('../../lib/queryClient', () => ({
  apiRequest: jest.fn(),
}))

// Mock the useQueryClient hook
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
  }),
}))

describe('BookCard', () => {
  const defaultProps = {
    book: mockBook,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders book information correctly', () => {
    render(<BookCard {...defaultProps} />)

    expect(screen.getByText('Test Book')).toBeInTheDocument()
    expect(screen.getByText('Test Author')).toBeInTheDocument()
    expect(screen.getByText('Reading Time')).toBeInTheDocument()
    expect(screen.getByText('5h')).toBeInTheDocument() // 300 pages * 250 words / 250 wpm = 300 minutes = 5h
  })

  it('displays book cover image', () => {
    render(<BookCard {...defaultProps} />)

    const coverImage = screen.getByAltText('Test Book')
    expect(coverImage).toBeInTheDocument()
    expect(coverImage).toHaveAttribute('src', 'https://example.com/cover.jpg')
  })

  it('shows progress input for reading books', () => {
    const readingBook = {
      ...mockBook,
      status: 'reading' as const,
      readingProgress: 50,
    }

    render(<BookCard book={readingBook} />)

    expect(screen.getByText('Progress')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    const progressInput = screen.getByRole('spinbutton')
    expect(progressInput).toBeInTheDocument()
    expect(progressInput).toHaveValue(50)
  })

  it('does not show progress input for non-reading books', () => {
    const toReadBook = {
      ...mockBook,
      status: 'to-read' as const,
      readingProgress: 0,
    }

    render(<BookCard book={toReadBook} />)

    expect(screen.queryByText('Progress')).not.toBeInTheDocument()
    expect(screen.queryByText('0%')).not.toBeInTheDocument()
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
  })

  describe('Progress Input Interactions', () => {
    const { apiRequest } = require('../../lib/queryClient')
    const readingBook = {
      ...mockBook, // Assumes mockBook has an id, e.g., '1'
      id: 'test-book-id-123', // Explicitly set for clarity in assertions
      status: 'reading' as const,
      readingProgress: 25,
    }

    beforeEach(() => {
      apiRequest.mockClear()
      apiRequest.mockResolvedValue({ ok: true }) // Default mock response
    })

    it('updates progress on input change and blur', async () => {
      render(<BookCard book={readingBook} />)
      const progressInput = screen.getByRole('spinbutton')
      expect(progressInput).toHaveValue(25)

      fireEvent.change(progressInput, { target: { value: '60' } })
      expect(progressInput).toHaveValue(60) // Input reflects typed value
      fireEvent.blur(progressInput)

      await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledTimes(1)
        expect(apiRequest).toHaveBeenCalledWith(
          'PATCH',
          `/api/books/${readingBook.id}/progress`,
          { progress: 60 }
        )
      })
      // After mutation and re-render (if readingProgress prop updated), input would sync via useEffect
      // For this test, we mainly care about the mutation call.
      // If we want to test the input value reflecting the *committed* value post-mutation,
      // we'd need to simulate query invalidation and prop update.
      // The component itself calls setInputValue(String(clampedValue)), so it should reflect "60".
      expect(progressInput).toHaveValue(60)
    })

    it('updates progress on "Enter" key press', async () => {
      render(<BookCard book={readingBook} />)
      const progressInput = screen.getByRole('spinbutton')
      expect(progressInput).toHaveValue(25)

      fireEvent.change(progressInput, { target: { value: '75' } })
      fireEvent.keyDown(progressInput, { key: 'Enter', code: 'Enter' })

      await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledTimes(1)
        expect(apiRequest).toHaveBeenCalledWith(
          'PATCH',
          `/api/books/${readingBook.id}/progress`,
          { progress: 75 }
        )
      })
      expect(progressInput).toHaveValue(75)
    })

    it('clamps input value to 0 if negative input is provided', async () => {
      render(<BookCard book={readingBook} />)
      const progressInput = screen.getByRole('spinbutton')

      fireEvent.change(progressInput, { target: { value: '-10' } })
      fireEvent.blur(progressInput)

      await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith(
          'PATCH',
          `/api/books/${readingBook.id}/progress`,
          { progress: 0 }
        )
      })
      expect(progressInput).toHaveValue(0) // Input field should show the clamped value
    })

    it('clamps input value to 100 if input is greater than 100', async () => {
      render(<BookCard book={readingBook} />)
      const progressInput = screen.getByRole('spinbutton')

      fireEvent.change(progressInput, { target: { value: '150' } })
      fireEvent.blur(progressInput)

      await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith(
          'PATCH',
          `/api/books/${readingBook.id}/progress`,
          { progress: 100 }
        )
      })
      expect(progressInput).toHaveValue(100) // Input field should show the clamped value
    })

    it('handles non-numeric input by sending 0 and updating input to 0', async () => {
      render(<BookCard book={readingBook} />)
      const progressInput = screen.getByRole('spinbutton')

      fireEvent.change(progressInput, { target: { value: 'abc' } })
      fireEvent.blur(progressInput)

      await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith(
          'PATCH',
          `/api/books/${readingBook.id}/progress`,
          { progress: 0 }
        )
      })
      expect(progressInput).toHaveValue(0) // Input field should show 0
    })
  })

  it('displays correct reading time for different estimated minutes', () => {
    const shortBook = {
      ...mockBook,
      estimatedMinutes: 100, // 1h 40m
    }

    const { rerender } = render(<BookCard book={shortBook} />)
    expect(screen.getByText('1h 40m')).toBeInTheDocument()

    const longBook = {
      ...mockBook,
      estimatedMinutes: 800, // 13h 20m
    }

    rerender(<BookCard book={longBook} />)
    expect(screen.getByText('13h 20m')).toBeInTheDocument()
  })
}) 