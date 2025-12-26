import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../test/test-utils'
import { GoalForm } from '../../components/goal-form'
import { mockGoal } from '../../test/test-utils'

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

describe('GoalForm', () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    editingGoal: null,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the form when open', () => {
    render(<GoalForm {...defaultProps} />)

    expect(screen.getByText('Set a Reading Goal')).toBeInTheDocument()
    expect(screen.getByText('Goal Type')).toBeInTheDocument()
    expect(screen.getByText('Year')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<GoalForm {...defaultProps} open={false} />)

    expect(screen.queryByText('Set a Reading Goal')).not.toBeInTheDocument()
  })

  it('shows create button for new goal', () => {
    render(<GoalForm {...defaultProps} />)

    expect(screen.getByRole('button', { name: /create goal/i })).toBeInTheDocument()
  })

  it('shows update button when editing', () => {
    render(<GoalForm {...defaultProps} editingGoal={mockGoal} />)

    expect(screen.getByText('Edit Reading Goal')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /update goal/i })).toBeInTheDocument()
  })

  it('populates form with editing goal values', () => {
    render(<GoalForm {...defaultProps} editingGoal={mockGoal} />)

    const targetInput = screen.getByLabelText(/target books/i)
    expect(targetInput).toHaveValue(50)
  })

  it('calls onOpenChange when cancel button is clicked', () => {
    const onOpenChange = jest.fn()
    render(<GoalForm {...defaultProps} onOpenChange={onOpenChange} />)

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('creates a new goal when form is submitted', async () => {
    const { apiRequest } = require('../../lib/queryClient')
    apiRequest.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1, goalType: 'books', targetCount: 50, year: 2025 }),
    })

    const onOpenChange = jest.fn()
    render(<GoalForm {...defaultProps} onOpenChange={onOpenChange} />)

    // Fill in the target count
    const targetInput = screen.getByLabelText(/target books/i)
    fireEvent.change(targetInput, { target: { value: '50' } })

    // Submit the form
    const createButton = screen.getByRole('button', { name: /create goal/i })
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('POST', '/api/goals', {
        goalType: 'books',
        targetCount: 50,
        year: expect.any(Number),
      })
    })

    await waitFor(() => {
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['/api/goals'] })
    })

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('updates a goal when editing and form is submitted', async () => {
    const { apiRequest } = require('../../lib/queryClient')
    apiRequest.mockResolvedValue({
      ok: true,
      json: async () => ({ ...mockGoal, targetCount: 60 }),
    })

    const onOpenChange = jest.fn()
    render(<GoalForm {...defaultProps} onOpenChange={onOpenChange} editingGoal={mockGoal} />)

    // Update the target count
    const targetInput = screen.getByLabelText(/target books/i)
    fireEvent.change(targetInput, { target: { value: '60' } })

    // Submit the form
    const updateButton = screen.getByRole('button', { name: /update goal/i })
    fireEvent.click(updateButton)

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('PATCH', '/api/goals/1', expect.objectContaining({
        targetCount: 60,
      }))
    })
  })

  it('does not submit with invalid target count', async () => {
    const { apiRequest } = require('../../lib/queryClient')

    render(<GoalForm {...defaultProps} />)

    // Don't fill in target count
    const createButton = screen.getByRole('button', { name: /create goal/i })
    fireEvent.click(createButton)

    // The form should have native validation preventing submission
    expect(apiRequest).not.toHaveBeenCalled()
  })

  it('resets form when closed and reopened', () => {
    const { rerender } = render(<GoalForm {...defaultProps} editingGoal={mockGoal} />)

    // Verify it's populated
    const targetInput = screen.getByLabelText(/target books/i)
    expect(targetInput).toHaveValue(50)

    // Close the form
    rerender(<GoalForm {...defaultProps} open={false} editingGoal={null} />)

    // Reopen with no editing goal
    rerender(<GoalForm {...defaultProps} open={true} editingGoal={null} />)

    // The target should be empty now
    const newTargetInput = screen.getByLabelText(/target books/i)
    expect(newTargetInput).toHaveValue(null)
  })

  describe('Goal type selection', () => {
    it('shows books as default goal type', () => {
      render(<GoalForm {...defaultProps} />)

      // Multiple elements may exist (visible select and hidden native select)
      const elements = screen.getAllByText('Number of Books')
      expect(elements.length).toBeGreaterThan(0)
    })

    it('shows pages goal type when editing a pages goal', () => {
      const pagesGoal = {
        ...mockGoal,
        goalType: 'pages' as const,
        targetCount: 10000,
      }

      render(<GoalForm {...defaultProps} editingGoal={pagesGoal} />)

      // When editing a pages goal, the label should show Target Pages
      expect(screen.getByText('Target Pages')).toBeInTheDocument()
    })
  })
})
