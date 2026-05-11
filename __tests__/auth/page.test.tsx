import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../test/test-utils'
import AuthPage from '../../app/auth/page'
import { useSearchParams, useRouter } from 'next/navigation'

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

global.fetch = jest.fn()

describe('AuthPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useSearchParams as jest.Mock).mockReturnValue({ get: () => null })
    ;(useRouter as jest.Mock).mockReturnValue({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })
  })

  it('renders login form by default', async () => {
    render(<AuthPage />)
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('switches to register form when clicked', async () => {
    render(<AuthPage />)
    const signUpLink = screen.getByText("Don't have an account? Sign up")
    fireEvent.click(signUpLink)
    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('switches back to login form when clicked', async () => {
    render(<AuthPage />)
    const signUpLink = screen.getByText("Don't have an account? Sign up")
    fireEvent.click(signUpLink)
    const signInLink = screen.getByText('Already have an account? Sign in')
    fireEvent.click(signInLink)
    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('handles login form submission', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { id: 1, email: 'test@example.com' } })
    } as Response)

    render(<AuthPage />)
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByDisplayValue(''), { target: { value: 'password123' } })
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/auth/login', expect.anything())
    })
  })

  it('handles register form submission', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { id: 1, email: 'test@example.com' } })
    } as Response)

    render(<AuthPage />)
    const signUpLink = screen.getByText("Don't have an account? Sign up")
    fireEvent.click(signUpLink)
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByDisplayValue(''), { target: { value: 'password123' } })
    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/auth/register', expect.anything())
    })
  })

  it('adds pending book after successful registration when book param is present', async () => {
    const pendingBook = {
      title: 'Pending Book',
      author: 'Pending Author',
      pages: 200,
      coverUrl: 'https://example.com/cover.jpg',
      status: 'to-read',
      laneId: null,
    }
    ;(useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => (key === 'book' ? encodeURIComponent(JSON.stringify(pendingBook)) : null),
    })
    const push = jest.fn()
    ;(useRouter as jest.Mock).mockReturnValue({ push, replace: jest.fn(), back: jest.fn() })

    const fetchMock = fetch as jest.MockedFunction<typeof fetch>
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) } as Response) // register
      .mockResolvedValueOnce({ ok: true, json: async () => pendingBook } as Response) // POST /api/books

    render(<AuthPage />)
    fireEvent.click(screen.getByText("Don't have an account? Sign up"))
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByDisplayValue(''), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/books', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(pendingBook),
      }))
    })
    expect(push).toHaveBeenCalledWith('/')
  })

  it('adds pending book after successful login when book param is present', async () => {
    const pendingBook = {
      title: 'Login Book',
      author: 'Login Author',
      pages: 150,
      coverUrl: 'https://example.com/cover.jpg',
      status: 'to-read',
      laneId: null,
    }
    ;(useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => (key === 'book' ? encodeURIComponent(JSON.stringify(pendingBook)) : null),
    })
    const push = jest.fn()
    ;(useRouter as jest.Mock).mockReturnValue({ push, replace: jest.fn(), back: jest.fn() })

    const fetchMock = fetch as jest.MockedFunction<typeof fetch>
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) } as Response) // login
      .mockResolvedValueOnce({ ok: true, json: async () => pendingBook } as Response) // POST /api/books

    render(<AuthPage />)
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByDisplayValue(''), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/books', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(pendingBook),
      }))
    })
    expect(push).toHaveBeenCalledWith('/')
  })

  it('does not call /api/books when no book param is present', async () => {
    const push = jest.fn()
    ;(useRouter as jest.Mock).mockReturnValue({ push, replace: jest.fn(), back: jest.fn() })

    const fetchMock = fetch as jest.MockedFunction<typeof fetch>
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) } as Response)

    render(<AuthPage />)
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByDisplayValue(''), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/')
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).not.toHaveBeenCalledWith('/api/books', expect.anything())
  })

  it('validates required fields', async () => {
    render(<AuthPage />)
    const signUpLink = screen.getByText("Don't have an account? Sign up")
    fireEvent.click(signUpLink)
    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)
    await waitFor(() => {
      expect(screen.getByText('Invalid email address')).toBeInTheDocument()
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
    })
  })
}) 