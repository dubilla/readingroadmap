import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../test/test-utils'
import AuthPage from '../../app/auth/page'
import { useAuth } from '../../contexts/auth-context'
import { useRouter, useSearchParams } from 'next/navigation'

// Mock the auth context and router
jest.mock('../../contexts/auth-context')
jest.mock('next/navigation')
jest.mock('../../lib/queryClient', () => ({
  apiRequest: jest.fn()
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>
const mockApiRequest = require('../../lib/queryClient').apiRequest as jest.MockedFunction<any>

describe('AuthPage', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn()
  }

  const mockAuthContext = {
    user: null,
    isLoading: false,
    isAuthenticated: false,
    login: jest.fn(),
    logout: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue(mockAuthContext)
    mockUseRouter.mockReturnValue(mockRouter)
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue(null),
      has: jest.fn().mockReturnValue(false),
      getAll: jest.fn().mockReturnValue([]),
      forEach: jest.fn(),
      entries: jest.fn().mockReturnValue([]),
      keys: jest.fn().mockReturnValue([]),
      values: jest.fn().mockReturnValue([]),
      toString: jest.fn().mockReturnValue(''),
      size: 0
    })
  })

  it('renders login form by default', () => {
    render(<AuthPage />)
    
    expect(screen.getByText('Sign In')).toBeTruthy()
    expect(screen.getByLabelText('Email')).toBeTruthy()
    expect(screen.getByLabelText('Password')).toBeTruthy()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeTruthy()
  })

  it('switches to register form when sign up link is clicked', () => {
    render(<AuthPage />)
    
    const signUpLink = screen.getByText('Don\'t have an account? Sign up')
    fireEvent.click(signUpLink)
    
    expect(screen.getByText('Create Account')).toBeTruthy()
    expect(screen.getByLabelText('Name')).toBeTruthy()
    expect(screen.getByLabelText('Email')).toBeTruthy()
    expect(screen.getByLabelText('Password')).toBeTruthy()
    expect(screen.getByRole('button', { name: /create account/i })).toBeTruthy()
  })

  it('shows book information when book data is in URL params', () => {
    const bookData = {
      title: 'Test Book',
      author: 'Test Author',
      pages: 300,
      coverUrl: 'https://example.com/cover.jpg',
      status: 'to-read',
      laneId: 1
    }
    
    const searchParams = new URLSearchParams()
    searchParams.set('book', encodeURIComponent(JSON.stringify(bookData)))
    mockUseSearchParams.mockReturnValue(searchParams)

    render(<AuthPage />)
    
    expect(screen.getByText(/Test Book.*will be added to your reading roadmap/i)).toBeTruthy()
  })

  it('handles successful registration and adds book', async () => {
    const bookData = {
      title: 'Test Book',
      author: 'Test Author',
      pages: 300,
      coverUrl: 'https://example.com/cover.jpg',
      status: 'to-read',
      laneId: 1
    }
    
    const searchParams = new URLSearchParams()
    searchParams.set('book', encodeURIComponent(JSON.stringify(bookData)))
    mockUseSearchParams.mockReturnValue(searchParams)

    const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' }
    mockApiRequest
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ user: mockUser }) }) // Register
      .mockResolvedValueOnce({ ok: true }) // Add book

    render(<AuthPage />)
    
    // Switch to register form
    const signUpLink = screen.getByText('Don\'t have an account? Sign up')
    fireEvent.click(signUpLink)
    
    // Fill out form
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test User' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith('POST', '/api/auth/register', {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      })
    })
    
    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith('POST', '/api/books', {
        ...bookData,
        user_id: 1
      })
    })
    
    expect(mockRouter.push).toHaveBeenCalledWith('/')
  })

  it('handles successful login and adds book', async () => {
    const bookData = {
      title: 'Test Book',
      author: 'Test Author',
      pages: 300,
      coverUrl: 'https://example.com/cover.jpg',
      status: 'to-read',
      laneId: 1
    }
    
    const searchParams = new URLSearchParams()
    searchParams.set('book', encodeURIComponent(JSON.stringify(bookData)))
    mockUseSearchParams.mockReturnValue(searchParams)

    const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' }
    mockApiRequest
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ user: mockUser }) }) // Login
      .mockResolvedValueOnce({ ok: true }) // Add book

    render(<AuthPage />)
    
    // Fill out login form
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith('POST', '/api/auth/login', {
        email: 'test@example.com',
        password: 'password123'
      })
    })
    
    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith('POST', '/api/books', {
        ...bookData,
        user_id: 1
      })
    })
    
    expect(mockRouter.push).toHaveBeenCalledWith('/')
  })

  it('handles registration errors gracefully', async () => {
    mockApiRequest.mockResolvedValue({ 
      ok: false, 
      json: () => Promise.resolve({ error: 'Email already exists' }) 
    })

    render(<AuthPage />)
    
    // Switch to register form
    const signUpLink = screen.getByText('Don\'t have an account? Sign up')
    fireEvent.click(signUpLink)
    
    // Fill out form
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test User' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith('POST', '/api/auth/register', {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      })
    })
    
    // Should not redirect on error
    expect(mockRouter.push).not.toHaveBeenCalled()
  })

  it('validates required fields', async () => {
    render(<AuthPage />)
    
    // Switch to register form
    const signUpLink = screen.getByText('Don\'t have an account? Sign up')
    fireEvent.click(signUpLink)
    
    // Submit empty form
    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)
    
    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeTruthy()
      expect(screen.getByText('Invalid email address')).toBeTruthy()
      expect(screen.getByText('Password must be at least 8 characters')).toBeTruthy()
    })
  })
}) 