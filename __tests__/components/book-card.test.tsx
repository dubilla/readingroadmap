import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../test/test-utils'
import { BookCard } from '../../components/book-card'
import { mockBook } from '../../test/test-utils'

// Mock the API request function
jest.mock('../../lib/queryClient', () => ({
  apiRequest: jest.fn(),
}))

// Mock the useQueryClient hook
const mockInvalidateQueries = jest.fn()
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
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

    // Both mobile and desktop layouts show title and author
    expect(screen.getAllByText('Test Book').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Test Author').length).toBeGreaterThan(0)
    // Reading Time label is only in desktop layout
    expect(screen.getByText('Reading Time')).toBeInTheDocument()
    // Both layouts show the reading time value
    expect(screen.getAllByText('5h').length).toBeGreaterThan(0) // 300 pages * 250 words / 250 wpm = 300 minutes = 5h
  })

  it('displays book cover image', () => {
    render(<BookCard {...defaultProps} />)

    // Both mobile and desktop have cover images
    const coverImages = screen.getAllByAltText('Test Book')
    expect(coverImages.length).toBeGreaterThan(0)
    expect(coverImages[0]).toHaveAttribute('src', 'https://example.com/cover.jpg')
  })

  it('shows progress slider for reading books', () => {
    const readingBook = {
      ...mockBook,
      status: 'reading' as const,
      readingProgress: 50,
    }

    render(<BookCard book={readingBook} />)

    // Progress label is in desktop layout
    expect(screen.getByText('Progress')).toBeInTheDocument()
    // Progress value shown in both layouts
    expect(screen.getAllByText('50%').length).toBeGreaterThan(0)
  })

  it('does not show progress slider for non-reading books', () => {
    const toReadBook = {
      ...mockBook,
      status: 'to-read' as const,
      readingProgress: 0,
    }

    render(<BookCard book={toReadBook} />)

    expect(screen.queryByText('Progress')).not.toBeInTheDocument()
    expect(screen.queryByText('0%')).not.toBeInTheDocument()
  })

  it('handles reading progress updates', async () => {
    const { apiRequest } = require('../../lib/queryClient')
    apiRequest.mockResolvedValue({ ok: true })

    const readingBook = {
      ...mockBook,
      status: 'reading' as const,
      readingProgress: 25,
    }

    render(<BookCard book={readingBook} />)

    // Both layouts have sliders
    const sliders = screen.getAllByRole('slider')
    expect(sliders.length).toBeGreaterThan(0)
    expect(screen.getAllByText('25%').length).toBeGreaterThan(0)
  })

  it('displays correct reading time for different estimated minutes', () => {
    const shortBook = {
      ...mockBook,
      estimatedMinutes: 100, // 1h 40m
    }

    const { rerender } = render(<BookCard book={shortBook} />)
    // Both layouts show reading time
    expect(screen.getAllByText('1h 40m').length).toBeGreaterThan(0)

    const longBook = {
      ...mockBook,
      estimatedMinutes: 800, // 13h 20m
    }

    rerender(<BookCard book={longBook} />)
    expect(screen.getAllByText('13h 20m').length).toBeGreaterThan(0)
  })

  describe('onTap callback', () => {
    it('calls onTap when card is clicked', () => {
      const onTap = jest.fn()
      render(<BookCard book={mockBook} onTap={onTap} />)

      const card = screen.getAllByText('Test Book')[0].closest('.overflow-hidden')
      fireEvent.click(card!)

      expect(onTap).toHaveBeenCalledWith(mockBook)
    })

    it('does not call onTap when slider is clicked', () => {
      const onTap = jest.fn()
      const readingBook = {
        ...mockBook,
        status: 'reading' as const,
        readingProgress: 50,
      }

      render(<BookCard book={readingBook} onTap={onTap} />)

      const sliders = screen.getAllByRole('slider')
      fireEvent.click(sliders[0])

      expect(onTap).not.toHaveBeenCalled()
    })

    it('applies cursor-pointer class when onTap is provided', () => {
      const onTap = jest.fn()
      render(<BookCard book={mockBook} onTap={onTap} />)

      const card = screen.getAllByText('Test Book')[0].closest('.overflow-hidden')
      expect(card).toHaveClass('cursor-pointer')
    })

    it('does not apply cursor-pointer class when onTap is not provided', () => {
      render(<BookCard book={mockBook} />)

      const card = screen.getAllByText('Test Book')[0].closest('.overflow-hidden')
      expect(card).not.toHaveClass('cursor-pointer')
    })
  })

  describe('Progress mutation', () => {
    it('calls API to update progress when slider value changes', async () => {
      const { apiRequest } = require('../../lib/queryClient')
      apiRequest.mockResolvedValue({ ok: true })

      const readingBook = {
        ...mockBook,
        id: 42,
        status: 'reading' as const,
        readingProgress: 25,
      }

      render(<BookCard book={readingBook} />)

      const sliders = screen.getAllByRole('slider')

      // Simulate slider change by triggering the onValueChange
      fireEvent.keyDown(sliders[0], { key: 'ArrowRight' })

      await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith(
          'PATCH',
          '/api/books/42/progress',
          expect.objectContaining({ progress: expect.any(Number) })
        )
      })
    })

    it('invalidates books query after successful progress update', async () => {
      const { apiRequest } = require('../../lib/queryClient')
      apiRequest.mockResolvedValue({ ok: true })

      const readingBook = {
        ...mockBook,
        id: 42,
        status: 'reading' as const,
        readingProgress: 25,
      }

      render(<BookCard book={readingBook} />)

      const sliders = screen.getAllByRole('slider')
      fireEvent.keyDown(sliders[0], { key: 'ArrowRight' })

      await waitFor(() => {
        expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['/api/books'] })
      })
    })
  })

  describe('Completed books', () => {
    it('does not show progress slider for completed books', () => {
      const completedBook = {
        ...mockBook,
        status: 'completed' as const,
        readingProgress: 100,
      }

      render(<BookCard book={completedBook} />)

      expect(screen.queryByRole('slider')).not.toBeInTheDocument()
      expect(screen.queryByText('Progress')).not.toBeInTheDocument()
    })
  })

  describe('Progress display', () => {
    it('handles 0% progress', () => {
      const readingBook = {
        ...mockBook,
        status: 'reading' as const,
        readingProgress: 0,
      }

      render(<BookCard book={readingBook} />)

      // There are two 0% elements (mobile and desktop layouts)
      const progressTexts = screen.getAllByText('0%')
      expect(progressTexts.length).toBeGreaterThan(0)
    })

    it('handles 100% progress', () => {
      const readingBook = {
        ...mockBook,
        status: 'reading' as const,
        readingProgress: 100,
      }

      render(<BookCard book={readingBook} />)

      // Both layouts show progress
      expect(screen.getAllByText('100%').length).toBeGreaterThan(0)
    })

    it('handles null readingProgress as 0', () => {
      const readingBook = {
        ...mockBook,
        status: 'reading' as const,
        readingProgress: null,
      }

      render(<BookCard book={readingBook} />)

      // There are two 0% elements (mobile and desktop layouts)
      const progressTexts = screen.getAllByText('0%')
      expect(progressTexts.length).toBeGreaterThan(0)
    })
  })
}) 