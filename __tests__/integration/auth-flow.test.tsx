import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '../../test/test-utils'
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

// Mock fetch
global.fetch = jest.fn()

describe('Complete Authentication Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Registration Flow', () => {
    it('should complete full registration flow with immediate sign in', async () => {
      const mockRouter = { push: jest.fn() }
      jest.mocked(require('next/navigation').useRouter).mockReturnValue(mockRouter)

      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

      render(<AuthPage />)

      const signUpLink = screen.getByText("Don't have an account? Sign up")
      fireEvent.click(signUpLink)

      const emailInput = screen.getByPlaceholderText('Enter your email')
      const passwordInputs = screen.getAllByDisplayValue('')
      const passwordField = passwordInputs.find(
        input => input.getAttribute('type') === 'password'
      ) as HTMLInputElement

      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } })
        fireEvent.change(passwordField, { target: { value: 'securepassword123' } })
      })

      const submitButton = screen.getByRole('button', { name: /create account/i })

      await act(async () => {
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/')
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'newuser@example.com', password: 'securepassword123' }),
      })
    })

    it('should handle registration validation errors', async () => {
      render(<AuthPage />)

      const signUpLink = screen.getByText("Don't have an account? Sign up")
      fireEvent.click(signUpLink)

      const submitButton = screen.getByRole('button', { name: /create account/i })

      await act(async () => {
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument()
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
      })

      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should handle server errors during registration', async () => {
      render(<AuthPage />)

      const signUpLink = screen.getByText("Don't have an account? Sign up")
      fireEvent.click(signUpLink)

      const emailInput = screen.getByPlaceholderText('Enter your email')
      const passwordInputs = screen.getAllByDisplayValue('')
      const passwordField = passwordInputs.find(
        input => input.getAttribute('type') === 'password'
      ) as HTMLInputElement

      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
        fireEvent.change(passwordField, { target: { value: 'password123' } })
      })

      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const submitButton = screen.getByRole('button', { name: /create account/i })

      await act(async () => {
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument()
        expect(screen.getByText('An error occurred during registration')).toBeInTheDocument()
      })
    })
  })

  describe('Login Flow', () => {
    it('should handle successful login', async () => {
      const mockRouter = { push: jest.fn() }
      jest.mocked(require('next/navigation').useRouter).mockReturnValue(mockRouter)

      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: '123', email: 'test@example.com', name: 'Test User' } }),
      } as Response)

      render(<AuthPage />)

      const emailInput = screen.getByPlaceholderText('Enter your email')
      const passwordInputs = screen.getAllByDisplayValue('')
      const passwordField = passwordInputs.find(
        input => input.getAttribute('type') === 'password'
      ) as HTMLInputElement

      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
        fireEvent.change(passwordField, { target: { value: 'password123' } })
      })

      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await act(async () => {
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/')
      })

      expect(screen.getByText('Welcome back!')).toBeInTheDocument()
    })

    it('should handle login errors', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid email or password' }),
      } as Response)

      render(<AuthPage />)

      const emailInput = screen.getByPlaceholderText('Enter your email')
      const passwordInputs = screen.getAllByDisplayValue('')
      const passwordField = passwordInputs.find(
        input => input.getAttribute('type') === 'password'
      ) as HTMLInputElement

      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } })
        fireEvent.change(passwordField, { target: { value: 'wrongpassword' } })
      })

      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await act(async () => {
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument()
        expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
      })
    })
  })

  describe('Form Switching', () => {
    it('should switch between login and registration forms', () => {
      render(<AuthPage />)

      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()

      const signUpLink = screen.getByText("Don't have an account? Sign up")
      fireEvent.click(signUpLink)

      expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()

      const signInLink = screen.getByText('Already have an account? Sign in')
      fireEvent.click(signInLink)

      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument()
    })
  })
})
