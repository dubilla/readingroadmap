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

describe('Complete Authentication Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Registration Flow', () => {
    it('should complete full registration flow with email confirmation', async () => {
      const mockRouter = { push: jest.fn() }
      jest.mocked(require('next/navigation').useRouter).mockReturnValue(mockRouter)

      // Step 1: User fills out registration form
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
          target: { value: 'newuser@example.com' }
        })
        fireEvent.change(passwordField, {
          target: { value: 'securepassword123' }
        })
      })
      
      // Step 2: Submit registration
      const submitButton = screen.getByRole('button', { name: /create account/i })
      
      // Mock registration response with email confirmation required
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Please check your email to confirm your account',
          requiresConfirmation: true,
          user: {
            id: '123',
            email: 'newuser@example.com',
            name: 'newuser'
          }
        })
      } as Response)
      
      await act(async () => {
        fireEvent.click(submitButton)
      })
      
      // Step 3: Verify email confirmation message
      await waitFor(() => {
        expect(screen.getByText('Check your email!')).toBeInTheDocument()
        expect(screen.getByText(/We've sent you a confirmation email/)).toBeInTheDocument()
      })
      
      // Step 4: Verify API call was made correctly
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'newuser@example.com',
          password: 'securepassword123'
        }),
      })
    })

    it('should handle registration validation errors', async () => {
      render(<AuthPage />)
      
      // Switch to registration
      const signUpLink = screen.getByText("Don't have an account? Sign up")
      fireEvent.click(signUpLink)
      
      // Try to submit without filling required fields
      const submitButton = screen.getByRole('button', { name: /create account/i })
      
      await act(async () => {
        fireEvent.click(submitButton)
      })
      
      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument()
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
      })
      
      // API should not be called
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should handle server errors during registration', async () => {
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
      
      // Mock server error
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockRejectedValueOnce(
        new Error('Network error')
      )
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      
      await act(async () => {
        fireEvent.click(submitButton)
      })
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument()
        expect(screen.getByText('An error occurred during registration')).toBeInTheDocument()
      })
    })
  })

  describe('Email Confirmation Flow', () => {
    it('should handle successful email confirmation', async () => {
      const mockRouter = { push: jest.fn() }
      jest.mocked(require('next/navigation').useRouter).mockReturnValue(mockRouter)

      const mockSupabase = {
        auth: {
          setSession: jest.fn().mockResolvedValue({
            data: { 
              session: { 
                user: { id: '123', email: 'test@example.com' },
                access_token: 'mock-token'
              } 
            },
            error: null
          }),
          getSession: jest.fn().mockResolvedValue({
            data: { session: null },
            error: null
          })
        }
      }
      jest.mocked(require('@supabase/ssr').createBrowserClient).mockReturnValue(mockSupabase)

      // User clicks email confirmation link and lands on callback page
      render(<AuthCallback />)
      
      // Should show loading state
      expect(screen.getByText('Confirming your email...')).toBeInTheDocument()
      
      // Should redirect to home page after successful confirmation
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/')
      })
      
      // Should call setSession with tokens from URL
      expect(mockSupabase.auth.setSession).toHaveBeenCalledWith({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
      })
    })

    it('should handle expired or invalid confirmation links', async () => {
      const mockSupabase = {
        auth: {
          setSession: jest.fn().mockResolvedValue({
            data: { session: null },
            error: { message: 'Token expired' }
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
        expect(screen.getByText('Token expired')).toBeInTheDocument()
      })
      
      // Should provide navigation options
      expect(screen.getByText('Go to Sign In')).toBeInTheDocument()
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })
  })

  describe('Login Flow', () => {
    it('should handle successful login', async () => {
      const mockRouter = { push: jest.fn() }
      jest.mocked(require('next/navigation').useRouter).mockReturnValue(mockRouter)

      // Mock successful login
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: {
            id: '123',
            email: 'test@example.com',
            name: 'Test User'
          }
        })
      } as Response)

      render(<AuthPage />)
      
      // Fill out login form
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
      
      // Submit login
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      
      await act(async () => {
        fireEvent.click(submitButton)
      })
      
      // Should redirect to home page
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/')
      })
      
      // Should show success message
      expect(screen.getByText('Success')).toBeInTheDocument()
      expect(screen.getByText('Welcome back!')).toBeInTheDocument()
    })

    it('should handle login errors', async () => {
      // Mock login error
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Invalid email or password'
        })
      } as Response)

      render(<AuthPage />)
      
      // Fill out login form
      const emailInput = screen.getByPlaceholderText('Enter your email')
      const passwordInputs = screen.getAllByDisplayValue('')
      const passwordField = passwordInputs.find(input => input.getAttribute('type') === 'password') as HTMLInputElement
      
      await act(async () => {
        fireEvent.change(emailInput, {
          target: { value: 'wrong@example.com' }
        })
        fireEvent.change(passwordField, {
          target: { value: 'wrongpassword' }
        })
      })
      
      // Submit login
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      
      await act(async () => {
        fireEvent.click(submitButton)
      })
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument()
        expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
      })
    })
  })

  describe('Form Switching', () => {
    it('should switch between login and registration forms', () => {
      render(<AuthPage />)
      
      // Initially shows login form
      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
      
      // Switch to registration
      const signUpLink = screen.getByText("Don't have an account? Sign up")
      fireEvent.click(signUpLink)
      
      // Should show registration form
      expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
      
      // Switch back to login
      const signInLink = screen.getByText('Already have an account? Sign in')
      fireEvent.click(signInLink)
      
      // Should show login form again
      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('should show loading states during form submission', async () => {
      // Mock slow response
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