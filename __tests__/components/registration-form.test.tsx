import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../test/test-utils'
import AuthPage from '../../app/auth/page'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(() => null),
  })),
}))

// Mock the toast hook
jest.mock('../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

// Mock fetch
global.fetch = jest.fn()

describe('Registration Form', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should switch to registration form when sign up link is clicked', () => {
    render(<AuthPage />)
    
    // Initially shows login form
    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument()
    
    // Click sign up link
    const signUpLink = screen.getByText("Don't have an account? Sign up")
    fireEvent.click(signUpLink)
    
    // Should show registration form
    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('should validate email format in registration form', async () => {
    render(<AuthPage />)
    
    // Switch to registration
    const signUpLink = screen.getByText("Don't have an account? Sign up")
    fireEvent.click(signUpLink)
    
    // Enter invalid email
    const emailInput = screen.getByPlaceholderText('Enter your email')
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.blur(emailInput)
    
    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText('Invalid email address')).toBeInTheDocument()
    })
  })

  it('should validate password length in registration form', async () => {
    render(<AuthPage />)
    
    // Switch to registration
    const signUpLink = screen.getByText("Don't have an account? Sign up")
    fireEvent.click(signUpLink)
    
    // Enter short password - use getAllByDisplayValue and select the password input
    const emptyInputs = screen.getAllByDisplayValue('')
    const passwordInput = emptyInputs.find(input => input.getAttribute('type') === 'password')
    fireEvent.change(passwordInput!, { target: { value: '123' } })
    fireEvent.blur(passwordInput!)
    
    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
    })
  })

  it('should accept valid email and password', async () => {
    render(<AuthPage />)
    
    // Switch to registration
    const signUpLink = screen.getByText("Don't have an account? Sign up")
    fireEvent.click(signUpLink)
    
    // Enter valid data - use getAllByDisplayValue and select the password input
    const emailInput = screen.getByPlaceholderText('Enter your email')
    const emptyInputs = screen.getAllByDisplayValue('')
    const passwordInput = emptyInputs.find(input => input.getAttribute('type') === 'password')
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput!, { target: { value: 'password123' } })
    
    // Should not show validation errors
    await waitFor(() => {
      expect(screen.queryByText('Invalid email address')).not.toBeInTheDocument()
      expect(screen.queryByText('Password must be at least 8 characters')).not.toBeInTheDocument()
    })
  })

  it('should switch back to login form when sign in link is clicked', () => {
    render(<AuthPage />)
    
    // Switch to registration first
    const signUpLink = screen.getByText("Don't have an account? Sign up")
    fireEvent.click(signUpLink)
    
    // Verify we're in registration mode
    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument()
    
    // Switch back to login
    const signInLink = screen.getByText('Already have an account? Sign in')
    fireEvent.click(signInLink)
    
    // Should show login form
    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('should show book notification when book data is present in URL', () => {
    const mockBookData = {
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald'
    }

    // Mock search params to include book data for this specific test
    const mockUseSearchParams = require('next/navigation').useSearchParams
    mockUseSearchParams.mockReturnValue({
      get: jest.fn((param) => {
        if (param === 'book') {
          return encodeURIComponent(JSON.stringify(mockBookData))
        }
        return null
      })
    })

    render(<AuthPage />)
    
    // Should show book notification
    expect(screen.getByText(/The Great Gatsby/)).toBeInTheDocument()
    expect(screen.getByText(/F. Scott Fitzgerald/)).toBeInTheDocument()
    expect(screen.getByText(/will be added to your reading roadmap/)).toBeInTheDocument()
  })

  it('should not show book notification when no book data is present', () => {
    // Reset the mock to default (no book data)
    const mockUseSearchParams = require('next/navigation').useSearchParams
    mockUseSearchParams.mockReturnValue({
      get: jest.fn(() => null),
    })

    render(<AuthPage />)
    
    // Should not show book notification
    expect(screen.queryByText(/will be added to your reading roadmap/)).not.toBeInTheDocument()
  })
}) 