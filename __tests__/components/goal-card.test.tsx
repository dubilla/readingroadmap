import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../test/test-utils'
import { GoalCard } from '../../components/goal-card'
import { mockGoal, mockGoalProgress } from '../../test/test-utils'

// Mock the API request function
jest.mock('../../lib/queryClient', () => ({
  apiRequest: jest.fn(),
  getQueryFn: jest.fn(() => async () => mockGoalProgress),
}))

// Mock the useQueryClient hook
const mockInvalidateQueries = jest.fn()
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
  useQuery: jest.fn(() => ({
    data: mockGoalProgress,
    isLoading: false,
  })),
}))

// Use a local mock for the goal progress
const mockGoalProgressLocal = {
  goalId: 1,
  goalType: 'books' as const,
  targetCount: 50,
  currentCount: 12,
  progressPercentage: 24,
  year: 2025,
}

describe('GoalCard', () => {
  const defaultProps = {
    goal: mockGoal,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset the useQuery mock for each test
    jest.mocked(require('@tanstack/react-query').useQuery).mockReturnValue({
      data: mockGoalProgressLocal,
      isLoading: false,
    })
  })

  it('renders goal information correctly', () => {
    render(<GoalCard {...defaultProps} />)

    expect(screen.getByText('2025 Reading Goal')).toBeInTheDocument()
    expect(screen.getByText('12 / 50 books')).toBeInTheDocument()
    expect(screen.getByText('24% complete')).toBeInTheDocument()
  })

  it('shows remaining count when goal not complete', () => {
    render(<GoalCard {...defaultProps} />)

    expect(screen.getByText('38 books to go!')).toBeInTheDocument()
  })

  it('shows goal achieved when progress is 100%', () => {
    jest.mocked(require('@tanstack/react-query').useQuery).mockReturnValue({
      data: {
        ...mockGoalProgressLocal,
        currentCount: 50,
        progressPercentage: 100,
      },
      isLoading: false,
    })

    render(<GoalCard {...defaultProps} />)

    expect(screen.getByText('Goal achieved!')).toBeInTheDocument()
    expect(screen.queryByText(/to go!/)).not.toBeInTheDocument()
  })

  it('shows loading state when fetching progress', () => {
    jest.mocked(require('@tanstack/react-query').useQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
    })

    render(<GoalCard {...defaultProps} />)

    expect(screen.getByText('...')).toBeInTheDocument()
  })

  it('renders edit button when onEdit is provided', () => {
    const onEdit = jest.fn()
    render(<GoalCard {...defaultProps} onEdit={onEdit} />)

    // Look for the edit button by finding the pencil icon's parent button
    const buttons = screen.getAllByRole('button')
    const editButton = buttons.find(btn => !btn.classList.contains('text-destructive'))
    expect(editButton).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = jest.fn()
    render(<GoalCard {...defaultProps} onEdit={onEdit} />)

    const buttons = screen.getAllByRole('button')
    const editButton = buttons.find(btn => !btn.classList.contains('text-destructive'))
    fireEvent.click(editButton!)

    expect(onEdit).toHaveBeenCalledWith(mockGoal)
  })

  it('does not render edit button when onEdit is not provided', () => {
    render(<GoalCard {...defaultProps} />)

    // Should only have the delete button
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(1)
  })

  it('renders delete button', () => {
    render(<GoalCard {...defaultProps} />)

    const deleteButton = screen.getByRole('button')
    expect(deleteButton).toHaveClass('text-destructive')
  })

  it('calls API to delete goal when delete button is clicked and confirmed', async () => {
    const { apiRequest } = require('../../lib/queryClient')
    apiRequest.mockResolvedValue({ ok: true })

    // Mock window.confirm
    window.confirm = jest.fn().mockReturnValue(true)

    render(<GoalCard {...defaultProps} />)

    const deleteButton = screen.getByRole('button')
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('DELETE', '/api/goals/1')
    })
  })

  it('does not delete goal when confirmation is cancelled', async () => {
    const { apiRequest } = require('../../lib/queryClient')

    // Mock window.confirm to return false
    window.confirm = jest.fn().mockReturnValue(false)

    render(<GoalCard {...defaultProps} />)

    const deleteButton = screen.getByRole('button')
    fireEvent.click(deleteButton)

    expect(apiRequest).not.toHaveBeenCalled()
  })

  it('invalidates goals query after successful delete', async () => {
    const { apiRequest } = require('../../lib/queryClient')
    apiRequest.mockResolvedValue({ ok: true })
    window.confirm = jest.fn().mockReturnValue(true)

    render(<GoalCard {...defaultProps} />)

    const deleteButton = screen.getByRole('button')
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['/api/goals'] })
    })
  })

  describe('Pages goal type', () => {
    it('shows pages unit for pages goal', () => {
      const pagesGoal = {
        ...mockGoal,
        goalType: 'pages' as const,
        targetCount: 10000,
      }

      jest.mocked(require('@tanstack/react-query').useQuery).mockReturnValue({
        data: {
          goalId: 1,
          goalType: 'pages',
          targetCount: 10000,
          currentCount: 2500,
          progressPercentage: 25,
          year: 2025,
        },
        isLoading: false,
      })

      render(<GoalCard goal={pagesGoal} />)

      expect(screen.getByText('2500 / 10000 pages')).toBeInTheDocument()
      expect(screen.getByText('7500 pages to go!')).toBeInTheDocument()
    })
  })
})
