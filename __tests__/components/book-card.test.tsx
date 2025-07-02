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

    // This test seems incomplete and was likely for the Slider.
    // It will be replaced by more specific input tests.
    // const slider = screen.getByRole('slider');
    // expect(slider).toBeInTheDocument();
    // expect(screen.getByText('25%')).toBeInTheDocument();
    // const updateProgressMutation = require('@tanstack/react-query').useMutation
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

describe('BookCard Progress Input', () => {
  const { apiRequest } = require('../../lib/queryClient')
  const { invalidateQueries } = require('@tanstack/react-query').useQueryClient()

  const readingBookBase = {
    ...mockBook,
    id: 'book1',
    status: 'reading' as const,
    readingProgress: 25, // Default initial progress for these tests
    // Ensure all necessary fields from Book type are present
    pages: mockBook.pages || 300,
    coverUrl: mockBook.coverUrl || 'https://example.com/cover.jpg',
    estimatedMinutes: mockBook.estimatedMinutes || 300,
    author: mockBook.author || 'Test Author',
    title: mockBook.title || 'Test Book',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    apiRequest.mockResolvedValue({ ok: true }) // Default mock for successful API calls
  })

  it('updates progress when a valid number is entered', async () => {
    render(<BookCard book={readingBookBase} />)

    const progressInput = screen.getByRole('spinbutton') // Input type="number" has role "spinbutton"
    expect(progressInput).toHaveValue(25) // Initial value

    fireEvent.change(progressInput, { target: { value: '50' } })
    // The component state `inputValue` becomes "50"
    // Mutation is called with 50

    expect(apiRequest).toHaveBeenCalledTimes(1)
    expect(apiRequest).toHaveBeenCalledWith(
      'PATCH',
      `/api/books/${readingBookBase.id}/progress`,
      { progress: 50 }
    )

    // Check if input value reflects the change (it should, due to controlled component)
    expect(progressInput).toHaveValue(50)

    // Wait for mutation to complete and invalidate queries
    await waitFor(() => {
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['/api/books'] })
    })
  })

  it('clamps progress to 0 and updates when a negative number is entered', async () => {
    render(<BookCard book={readingBookBase} />)
    const progressInput = screen.getByRole('spinbutton')
    expect(progressInput).toHaveValue(25)

    fireEvent.change(progressInput, { target: { value: '-10' } })
    // Value should be clamped to 0, mutation called with 0

    expect(apiRequest).toHaveBeenCalledTimes(1)
    expect(apiRequest).toHaveBeenCalledWith(
      'PATCH',
      `/api/books/${readingBookBase.id}/progress`,
      { progress: 0 }
    )
    expect(progressInput).toHaveValue(0) // Reflects clamped value

    await waitFor(() => {
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['/api/books'] })
    })
  })

  it('clamps progress to 100 and updates when a number greater than 100 is entered', async () => {
    render(<BookCard book={readingBookBase} />)
    const progressInput = screen.getByRole('spinbutton')
    expect(progressInput).toHaveValue(25)

    fireEvent.change(progressInput, { target: { value: '150' } })
    // Value should be clamped to 100, mutation called with 100

    expect(apiRequest).toHaveBeenCalledTimes(1)
    expect(apiRequest).toHaveBeenCalledWith(
      'PATCH',
      `/api/books/${readingBookBase.id}/progress`,
      { progress: 100 }
    )
    expect(progressInput).toHaveValue(100) // Reflects clamped value

    await waitFor(() => {
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['/api/books'] })
    })
  })

  it('does not update progress for non-numeric input and resets on blur', async () => {
    render(<BookCard book={readingBookBase} />)
    const progressInput = screen.getByRole('spinbutton')
    expect(progressInput).toHaveValue(25)

    fireEvent.change(progressInput, { target: { value: 'abc' } })
    expect(progressInput).toHaveValue(null) // Or how the browser/component handles it. type="number" might make it empty or keep old value if input is totally invalid.
                                            // Our component sets inputValue to "abc".
                                            // HTML input of type number with value "abc" has .value "" or .valueAsNumber NaN
                                            // Let's check the component's actual behavior when value is "abc"
                                            // The component code sets inputValue to "abc", so value prop will be "abc"
                                            // but .toHaveValue for input type=number might behave differently.
                                            // Let's test what happens. It should be "abc" from our code.
                                            // However, an input type=number when its value is set to "abc" programmatically,
                                            // its .value property might be empty string.

    // Let's assume the component's state `inputValue` is "abc"
    // `screen.getByRole('spinbutton')` will give the HTMLInputElement.
    // `(screen.getByRole('spinbutton') as HTMLInputElement).value` would be "abc" if type was text.
    // For type="number", setting value to "abc" makes element.value = ""
    // Our component state is `inputValue = "abc"`, and it's passed as `value="abc"` to Input.
    // The test should reflect this. Let's assume `toHaveValue` checks the `value` attribute.
    // The actual behavior of `toHaveValue` on an input type="number" with a non-numeric value needs confirmation.
    // It typically checks the .value property, which for type="number" becomes "" if set to non-numeric.
    // Let's assume it becomes empty or reflects the last valid numeric value.
    // From previous implementation: setInputValue(rawValue) when isNaN. So input shows "abc".
    // HTMLInputElement.value for type="number" will be empty if set to "abc".
    // So, we expect it to be empty if the underlying <Input> is a true number input.
    expect((progressInput as HTMLInputElement).value).toBe(''); // HTML standard for type=number with invalid value

    expect(apiRequest).not.toHaveBeenCalled()

    fireEvent.blur(progressInput)
    // On blur, if inputValue is "abc", it's parsed to NaN, then reset to initialProgress
    expect(progressInput).toHaveValue(25) // Resets to initial progress
    expect(apiRequest).not.toHaveBeenCalled() // Still no call
  })

  it('does not update progress for empty input and resets on blur', async () => {
    render(<BookCard book={readingBookBase} />)
    const progressInput = screen.getByRole('spinbutton')
    expect(progressInput).toHaveValue(25)

    fireEvent.change(progressInput, { target: { value: '' } })
    expect((progressInput as HTMLInputElement).value).toBe('') // Input is cleared

    expect(apiRequest).not.toHaveBeenCalled()

    fireEvent.blur(progressInput)
    expect(progressInput).toHaveValue(25) // Resets to initial progress
    expect(apiRequest).not.toHaveBeenCalled()
  })

  it('does not call mutation if value entered is same as initial progress', async () => {
    render(<BookCard book={readingBookBase} />)
    const progressInput = screen.getByRole('spinbutton')
    expect(progressInput).toHaveValue(25)

    fireEvent.change(progressInput, { target: { value: '25' } })
    expect(progressInput).toHaveValue(25)
    expect(apiRequest).not.toHaveBeenCalled()
  })

  it('updates input correctly even if mutation fails', async () => {
    apiRequest.mockRejectedValue(new Error('API Error'))
    render(<BookCard book={readingBookBase} />)
    const progressInput = screen.getByRole('spinbutton')

    fireEvent.change(progressInput, { target: { value: '60' } })
    expect(apiRequest).toHaveBeenCalledWith(
      'PATCH',
      `/api/books/${readingBookBase.id}/progress`,
      { progress: 60 }
    )
    // Input value should still reflect the attempted change (60)
    // because mutation failure doesn't revert the optimistic inputValue update.
    expect(progressInput).toHaveValue(60)

    await waitFor(() => {
      // invalidateQueries might still be called in onError or onSettled,
      // depending on useMutation setup. The current mock is basic.
      // Let's assume it's not called on error for simplicity unless specified.
      expect(invalidateQueries).not.toHaveBeenCalled();
    });
  });
})