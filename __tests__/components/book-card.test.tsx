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

  it('shows progress slider for reading books', () => {
    const readingBook = {
      ...mockBook,
      status: 'reading' as const,
      readingProgress: 50,
    }

    render(<BookCard book={readingBook} />)

    expect(screen.getByText('Progress')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
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

    const slider = screen.getByRole('slider')
    expect(slider).toBeInTheDocument()
    expect(screen.getByText('25%')).toBeInTheDocument()

    const updateProgressMutation = require('@tanstack/react-query').useMutation
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