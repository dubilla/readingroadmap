import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '../../test/test-utils'
import AuthPage from '../../app/auth/page'
import AuthCallback from '../../app/auth/callback/page'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn((key) => {
      const params = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        error: null,
        error_description: null,
      }
      return params[key as keyof typeof params] || null
    }),
  })),
}))

// Mock Supabase
jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn(() => ({
    auth: {
      signUp: jest.fn(),
      setSession: jest.fn(),
      getSession: jest.fn(),
    },
  })),
}))

// Mock fetch
global.fetch = jest.fn()

describe('Email Confirmation Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Registration with Email Confirmation', () => {
    it('should show email confirmation message when registration requires confirmation', async () => {
      // Mock successful registration with email confirmation required
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Please check your email to confirm your account',
          requiresConfirmation: true,
          user: {
            id: '123',
            email: 'test@example.com',
            name: 'Test User'
          }
        })
      } as Response)

      render(<AuthPage />)
      
      // Switch to registration form
      const signUpLink = screen.getByText("Don't have an account? Sign up")
      fireEvent.click(signUpLink)
      
      // Fill out registration form
      const emailInput = screen.getByPlaceholderText('Enter your email')
      const passwordInputs = screen.getAllByDisplayValue('')
      const passwordField = passwordInputs.find(input => input.getAttribute('type') === 'password') as HTMLInputElement
      
      await act(async () => {
        fireEvent.change(emailInput, {
          target: { value: 'test@example.com' }
        })
        fireEvent.change(passwordField, {
          target: { value: 'password123' }
        })
      })
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /create account/i })
      
      await act(async () => {
        fireEvent.click(submitButton)
      })
      
      // Should show email confirmation message in toast
      await waitFor(() => {
        expect(screen.getByText('Check your email!')).toBeInTheDocument()
        expect(screen.getByText(/We've sent you a confirmation email/)).toBeInTheDocument()
      })
    })

    it('should redirect immediately when email confirmation is disabled', async () => {
      const mockRouter = { push: jest.fn() }
      jest.mocked(require('next/navigation').useRouter).mockReturnValue(mockRouter)

      // Mock successful registration with immediate sign in
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: {
            id: '123',
            email: 'test@example.com',
            name: 'Test User'
          }
        })
      } as Response)

      render(<AuthPage />)
      
      // Switch to registration form
      const signUpLink = screen.getByText("Don't have an account? Sign up")
      fireEvent.click(signUpLink)
      
      // Fill out and submit form
      const emailInput = screen.getByPlaceholderText('Enter your email')
      const passwordInputs = screen.getAllByDisplayValue('')
      const passwordField = passwordInputs.find(input => input.getAttribute('type') === 'password') as HTMLInputElement
      
      await act(async () => {
        fireEvent.change(emailInput, {
          target: { value: 'test@example.com' }
        })
        fireEvent.change(passwordField, {
          target: { value: 'password123' }
        })
      })
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      
      await act(async () => {
        fireEvent.click(submitButton)
      })
      
      // Should redirect to home page
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/')
      })
    })

    it('should handle registration errors properly', async () => {
      // Mock registration error
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Email already exists'
        })
      } as Response)

      render(<AuthPage />)
      
      // Switch to registration form
      const signUpLink = screen.getByText("Don't have an account? Sign up")
      fireEvent.click(signUpLink)
      
      // Fill out and submit form
      const emailInput = screen.getByPlaceholderText('Enter your email')
      const passwordInputs = screen.getAllByDisplayValue('')
      const passwordField = passwordInputs.find(input => input.getAttribute('type') === 'password') as HTMLInputElement
      
      await act(async () => {
        fireEvent.change(emailInput, {
          target: { value: 'existing@example.com' }
        })
        fireEvent.change(passwordField, {
          target: { value: 'password123' }
        })
      })
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      
      await act(async () => {
        fireEvent.click(submitButton)
      })
      
      // Should show error message in toast
      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument()
        expect(screen.getByText('Email already exists')).toBeInTheDocument()
      })
    })
  })

  describe('Auth Callback Page', () => {
    it('should handle successful email confirmation', async () => {
      const mockRouter = { push: jest.fn() }
      jest.mocked(require('next/navigation').useRouter).mockReturnValue(mockRouter)

      const mockSupabase = {
        auth: {
          setSession: jest.fn().mockResolvedValue({
            data: { session: { user: { id: '123', email: 'test@example.com' } } },
            error: null
          }),
          getSession: jest.fn().mockResolvedValue({
            data: { session: null },
            error: null
          })
        }
      }
      jest.mocked(require('@supabase/ssr').createBrowserClient).mockReturnValue(mockSupabase)

      render(<AuthCallback />)
      
      // Should show loading state initially
      expect(screen.getByText('Confirming your email...')).toBeInTheDocument()
      
      // Should redirect to home page after successful confirmation
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/')
      })
    })

    it('should handle authentication errors', async () => {
      const mockSupabase = {
        auth: {
          setSession: jest.fn().mockResolvedValue({
            data: { session: null },
            error: { message: 'Invalid token' }
          }),
          getSession: jest.fn().mockResolvedValue({
            data: { session: null },
            error: null
          })
        }
      }
      jest.mocked(require('@supabase/ssr').createBrowserClient).mockReturnValue(mockSupabase)

      render(<AuthCallback />)
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Authentication Error')).toBeInTheDocument()
        expect(screen.getByText('Invalid token')).toBeInTheDocument()
      })
    })

    it('should handle URL error parameters', async () => {
      // Mock URL with error parameters
      jest.mocked(require('next/navigation').useSearchParams).mockReturnValue({
        get: jest.fn((key) => {
          const params = {
            error: 'invalid_grant',
            error_description: 'The provided authorization grant is invalid',
            access_token: null,
            refresh_token: null,
          }
          return params[key as keyof typeof params] || null
        }),
      })

      render(<AuthCallback />)
      
      // Should show error message from URL parameters
      await waitFor(() => {
        expect(screen.getByText('Authentication Error')).toBeInTheDocument()
        expect(screen.getByText('The provided authorization grant is invalid')).toBeInTheDocument()
      })
    })

    it('should provide navigation options on error', async () => {
      const mockRouter = { push: jest.fn() }
      jest.mocked(require('next/navigation').useRouter).mockReturnValue(mockRouter)

      const mockSupabase = {
        auth: {
          setSession: jest.fn().mockResolvedValue({
            data: { session: null },
            error: { message: 'Session expired' }
          }),
          getSession: jest.fn().mockResolvedValue({
            data: { session: null },
            error: null
          })
        }
      }
      jest.mocked(require('@supabase/ssr').createBrowserClient).mockReturnValue(mockSupabase)

      render(<AuthCallback />)
      
      await waitFor(() => {
        expect(screen.getByText('Go to Sign In')).toBeInTheDocument()
        expect(screen.getByText('Try Again')).toBeInTheDocument()
      })
      
      // Test navigation buttons
      fireEvent.click(screen.getByText('Go to Sign In'))
      expect(mockRouter.push).toHaveBeenCalledWith('/auth')
    })
  })

  describe('Form Validation', () => {
    it('should validate email format in registration', async () => {
      render(<AuthPage />)
      
      // Switch to registration
      const signUpLink = screen.getByText("Don't have an account? Sign up")
      fireEvent.click(signUpLink)
      
      // Enter invalid email
      const emailInput = screen.getByPlaceholderText('Enter your email')
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
        fireEvent.blur(emailInput)
      })
      
      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument()
      })
    })

    it('should validate password length in registration', async () => {
      render(<AuthPage />)
      
      // Switch to registration
      const signUpLink = screen.getByText("Don't have an account? Sign up")
      fireEvent.click(signUpLink)
      
      // Enter short password
      const passwordInputs = screen.getAllByDisplayValue('')
      const passwordField = passwordInputs.find(input => input.getAttribute('type') === 'password') as HTMLInputElement
      
      await act(async () => {
        fireEvent.change(passwordField, { target: { value: '123' } })
        fireEvent.blur(passwordField)
      })
      
      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
      })
    })
  })

  describe('Loading States', () => {
    it('should show loading state during registration', async () => {
      // Mock slow registration response
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ success: true, requiresConfirmation: true })
          } as Response), 100)
        )
      )

      render(<AuthPage />)
      
      // Switch to registration
      const signUpLink = screen.getByText("Don't have an account? Sign up")
      fireEvent.click(signUpLink)
      
      // Fill out form
      const emailInput = screen.getByPlaceholderText('Enter your email')
      const passwordInputs = screen.getAllByDisplayValue('')
      const passwordField = passwordInputs.find(input => input.getAttribute('type') === 'password') as HTMLInputElement
      
      await act(async () => {
        fireEvent.change(emailInput, {
          target: { value: 'test@example.com' }
        })
        fireEvent.change(passwordField, {
          target: { value: 'password123' }
        })
      })
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /create account/i })
      
      await act(async () => {
        fireEvent.click(submitButton)
      })
      
      // Should show loading state
      expect(screen.getByText('Creating account...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
      
      // Wait for response
      await waitFor(() => {
        expect(screen.getByText('Check your email!')).toBeInTheDocument()
      })
      
      // Button should be enabled again
      expect(submitButton).not.toBeDisabled()
    })
  })
}) 