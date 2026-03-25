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

describe('Authentication Form', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Registration', () => {
    it('should show success message after registration', async () => {
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
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
        fireEvent.change(passwordField, { target: { value: 'password123' } })
      })

      const submitButton = screen.getByRole('button', { name: /create account/i })

      await act(async () => {
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/')
      })
    })

    it('should handle registration errors properly', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Email already in use' }),
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
        fireEvent.change(emailInput, { target: { value: 'existing@example.com' } })
        fireEvent.change(passwordField, { target: { value: 'password123' } })
      })

      const submitButton = screen.getByRole('button', { name: /create account/i })

      await act(async () => {
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument()
        expect(screen.getByText('Email already in use')).toBeInTheDocument()
      })
    })
  })

  describe('Form Validation', () => {
    it('should validate email format in registration', async () => {
      render(<AuthPage />)

      const signUpLink = screen.getByText("Don't have an account? Sign up")
      fireEvent.click(signUpLink)

      const emailInput = screen.getByPlaceholderText('Enter your email')
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
        fireEvent.blur(emailInput)
      })

      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument()
      })
    })

    it('should validate password length in registration', async () => {
      render(<AuthPage />)

      const signUpLink = screen.getByText("Don't have an account? Sign up")
      fireEvent.click(signUpLink)

      const passwordInputs = screen.getAllByDisplayValue('')
      const passwordField = passwordInputs.find(
        input => input.getAttribute('type') === 'password'
      ) as HTMLInputElement

      await act(async () => {
        fireEvent.change(passwordField, { target: { value: '123' } })
        fireEvent.blur(passwordField)
      })

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
      })
    })
  })

  describe('Loading States', () => {
    it('should show loading state during registration', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockImplementationOnce(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ success: true }),
                } as Response),
              100
            )
          )
      )

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

      const submitButton = screen.getByRole('button', { name: /create account/i })

      await act(async () => {
        fireEvent.click(submitButton)
      })

      expect(screen.getByText('Creating account...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })
  })
})
